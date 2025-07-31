use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::{Duration, Instant},
};

use crate::{
    act::send::simulate_key,
    global::{
        global::{PROCESS_NAME, TIME_CHECK_TIME},
        model::{Children, ElementEnum},
    },
    memory::read::GameMemoryReader,
    rgb::check::check_color_distance,
};

fn collect_children(children: Option<Vec<Children>>, target_iyn: &str) -> Vec<Children> {
    let mut result = Vec::new();
    if let Some(children) = children {
        for child in children {
            if child.iyn == target_iyn {
                result.push(child);
            }
        }
    }
    result
}

pub fn run_element(
    elements: Vec<Children>,
    stop_flag: Arc<AtomicBool>,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut next_level: Vec<Children> = Vec::new();

    for c in elements {
        if stop_flag.load(Ordering::Relaxed) {
            return Ok(());
        }

        let children_to_add = match &c.element {
            ElementEnum::Element(e) => {
                // println!("执行元素: {:?}", e);
                simulate_key(e.elements_code, e.key_up_delay, &stop_flag)
                    .map_err(|e| format!("Failed to simulate key: {:?}", e))?;
                collect_children(c.children.clone(), "y")
            }
            ElementEnum::Skill(s) => {
                let process_name = PROCESS_NAME.clone();
                match GameMemoryReader::new(&process_name, 0x00400000) {
                    Ok(reader) => {
                        // s.skill_offset是Option<String>类型，需要处理成usize
                        let skill_offset = s
                            .skill_offset
                            .as_ref()
                            .and_then(|s| s.parse::<usize>().ok());
                        match skill_offset {
                            Some(offset) => {
                                // println!("技能偏移量: {}", offset);
                                let skill_code = if s.skill_type == 2 {
                                    reader.read_lrf(offset).unwrap_or_else(|e| {
                                        eprintln!("Error reading skill: {:?}", e);
                                        0
                                    })
                                } else {
                                    reader.read_skill_plan(offset).unwrap_or_else(|e| {
                                        eprintln!("Error reading skill: {:?}", e);
                                        0
                                    })
                                };
                                // println!("技能代码: {}", skill_code);

                                if s.skill_code.contains(&(skill_code as u32)) {
                                    // 如果技能代码匹配，则返回子元素的iyn为"y"
                                    let target_iyn = "y";
                                    collect_children(c.children.clone(), target_iyn)
                                } else {
                                    // 如果技能代码不匹配，则返回子元素的iyn为"n"
                                    let target_iyn = "n";
                                    collect_children(c.children.clone(), target_iyn)
                                }
                                // let target_iyn: &'static str =
                                //     if skill_code == s.skill_code { "y" } else { "n" };
                                // collect_children(c.children.clone(), target_iyn)
                            }
                            None => {
                                eprintln!("技能偏移量解析失败，使用默认值0");
                                collect_children(c.children.clone(), "n")
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to create GameMemoryReader: {:?}", e);
                        collect_children(c.children.clone(), "n")
                    }
                }
            }
            ElementEnum::TimeOrNama(t) => match t.t {
                1 => {
                    thread::sleep(Duration::from_millis(t.n as u64));
                    collect_children(c.children.clone(), "y")
                }
                2 => {
                    let e_id = &t.id;

                    let check_result = match TIME_CHECK_TIME.try_lock() {
                        Ok(mut last_time_map) => {
                            if let Some(last_time) = last_time_map.get(e_id) {
                                let duration = last_time.elapsed().as_millis();
                                // println!("元素 {} 上次执行时间: {:?} 毫秒", e_id, duration);
                                if duration <= t.n.into() {
                                    true
                                } else {
                                    false
                                }
                            } else {
                                if t.init {
                                    last_time_map.insert(e_id.clone(), Instant::now());
                                    println!("进行初始化")
                                }
                                false
                            }
                        }
                        Err(_) => {
                            eprintln!(
                                "Failed to acquire TIME_CHECK_TIME lock, using default value"
                            );
                            false
                        }
                    };
                    let target_iyn = if check_result { "y" } else { "n" };
                    collect_children(c.children.clone(), target_iyn)
                }
                3 => {
                    let process_name = PROCESS_NAME.clone();
                    match GameMemoryReader::new(&process_name, 0x00400000) {
                        Ok(reader) => {
                            let inner_power = reader.read_mana().unwrap_or_else(|e| {
                                eprintln!("Error reading inner power: {:?}", e);
                                0
                            });
                            let target_iyn = if inner_power <= t.n.try_into().unwrap_or(0) {
                                "y"
                            } else {
                                "n"
                            };
                            collect_children(c.children.clone(), target_iyn)
                        }
                        Err(e) => {
                            eprintln!("Failed to create GameMemoryReader for mana: {:?}", e);
                            collect_children(c.children.clone(), "n")
                        }
                    }
                }
                4 => {
                    let now = Instant::now();
                    match TIME_CHECK_TIME.try_lock() {
                        Ok(mut last_time_map) => {
                            if let Some(last_time) = last_time_map.get_mut(&t.id) {
                                *last_time = now;
                            } else {
                                last_time_map.insert(t.id.clone(), now);
                            }
                        }
                        Err(_) => {
                            eprintln!(
                                "Failed to acquire TIME_CHECK_TIME lock, using default value"
                            );
                        }
                    };
                    collect_children(c.children.clone(), "y")
                }
                _ => Vec::new(),
            },
            ElementEnum::Color(co) => {
                let check_result = match std::panic::catch_unwind(|| {
                    check_color_distance(co.rgb.clone(), co.coordinate.clone(), 0)
                }) {
                    Ok(result) => result,
                    Err(_) => {
                        eprintln!("Color check panicked, using false as default");
                        false
                    }
                };
                let target_iyn = if check_result { "y" } else { "n" };
                collect_children(c.children.clone(), target_iyn)
            }
        };

        // let elapsed = start_time.elapsed();
        // println!(
        //     "[耗时统计] ElementEnum::{:?} 执行耗时: {:?}",
        //     element_type, elapsed
        // );

        next_level.extend(children_to_add);

        if stop_flag.load(Ordering::Relaxed) {
            return Ok(());
        }
    }

    if !next_level.is_empty() {
        run_element(next_level, stop_flag)?;
    }
    Ok(())
}
