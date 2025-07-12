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

fn handle_children(
    children: Option<Vec<Children>>,
    target_iyn: &str,
    stop_flag: &Arc<AtomicBool>,
) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(children) = children {
        for child in children {
            if child.iyn == target_iyn {
                run_element(vec![child], stop_flag.clone())?;
            }
        }
    }
    Ok(())
}

pub fn run_element(
    elements: Vec<Children>,
    stop_flag: Arc<AtomicBool>,
) -> Result<(), Box<dyn std::error::Error>> {
    for c in elements {
        // 更频繁地检查停止标志
        if stop_flag.load(Ordering::Relaxed) {
            return Ok(());
        }

        let result = match &c.element {
            ElementEnum::Element(e) => {
                // println!("Executing element: {:?}", e);
                // 添加错误处理
                simulate_key(e.elements_code, e.key_up_delay)
                    .map_err(|e| format!("Failed to simulate key: {:?}", e))?;
                handle_children(c.children.clone(), "y", &stop_flag)
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
                        handle_children(c.children.clone(), target_iyn, &stop_flag)
                    }
                    Err(e) => {
                        eprintln!("Failed to create GameMemoryReader: {:?}", e);
                        // 继续执行而不是失败
                        handle_children(c.children.clone(), "n", &stop_flag)
                    }
                }
            }
            ElementEnum::TimeOrNama(t) => match t.t {
                1 => {
                    let sleep_duration = Duration::from_millis(t.n as u64);
                    let start_time = Instant::now();
                    // 使用更小的检查间隔以提高响应性
                    let check_interval = Duration::from_millis(2);

                    while start_time.elapsed() < sleep_duration {
                        if stop_flag.load(Ordering::Relaxed) {
                            return Ok(());
                        }
                        thread::sleep(check_interval);
                    }
                    handle_children(c.children.clone(), "y", &stop_flag)
                }
                2 => {
                    let e_id = &t.id;
                    let out_wait_time = t.n * 2;
                    let now = Instant::now();

                    // 添加锁超时保护
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
                            false // 默认值
                        }
                    };

                    let target_iyn = if check_result { "y" } else { "n" };
                    handle_children(c.children.clone(), target_iyn, &stop_flag)
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
                            handle_children(c.children.clone(), target_iyn, &stop_flag)
                        }
                        Err(e) => {
                            eprintln!("Failed to create GameMemoryReader for mana: {:?}", e);
                            handle_children(c.children.clone(), "n", &stop_flag)
                        }
                    }
                }
                _ => Ok(()),
            },
            ElementEnum::Color(co) => {
                // 为颜色检查添加错误处理
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
                handle_children(c.children.clone(), target_iyn, &stop_flag)
            }
        };

        // 处理子元素执行的错误
        if let Err(e) = result {
            eprintln!("Error handling children: {:?}", e);
            // 继续执行下一个元素而不是终止整个流程
        }

        // 在每个元素处理完后再次检查停止标志
        if stop_flag.load(Ordering::Relaxed) {
            return Ok(());
        }
    }
    Ok(())
}
