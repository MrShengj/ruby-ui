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
        // let element_type = match &c.element {
        //     ElementEnum::Element(_) => "Element",
        //     ElementEnum::Skill(_) => "Skill",
        //     ElementEnum::TimeOrNama(_) => "TimeOrNama",
        //     ElementEnum::Color(_) => "Color",
        // };
        // println!(
        //     "[执行元素] ElementEnum::{:?} - {:?}",
        //     element_type, c.element
        // );
        // let start_time = Instant::now();

        let children_to_add = match &c.element {
            ElementEnum::Element(e) => {
                simulate_key(e.elements_code, e.key_up_delay)
                    .map_err(|e| format!("Failed to simulate key: {:?}", e))?;
                collect_children(c.children.clone(), "y")
            }
            ElementEnum::Skill(s) => {
                let process_name = PROCESS_NAME.clone();
                match GameMemoryReader::new(&process_name, 0x00400000) {
                    Ok(reader) => {
                        let skill_code = reader.read_skill().unwrap_or_else(|e| {
                            eprintln!("Error reading skill: {:?}", e);
                            0
                        });
                        let target_iyn: &'static str =
                            if skill_code == s.skill_code { "y" } else { "n" };
                        collect_children(c.children.clone(), target_iyn)
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
                    let out_wait_time = t.n * 2;
                    let now = Instant::now();

                    let check_result = match TIME_CHECK_TIME.try_lock() {
                        Ok(mut last_time_map) => {
                            if let Some(last_time) = last_time_map.get(e_id) {
                                let duration = last_time.elapsed().as_millis();
                                if duration <= t.n.into() {
                                    false
                                } else if duration > out_wait_time.into() {
                                    last_time_map.remove(e_id);
                                    true
                                } else {
                                    last_time_map.insert(e_id.clone(), now);
                                    true
                                }
                            } else {
                                last_time_map.insert(e_id.clone(), now);
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
