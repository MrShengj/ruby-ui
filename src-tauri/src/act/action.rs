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

fn handle_children(children: Option<Vec<Children>>, target_iyn: &str, stop_flag: &Arc<AtomicBool>) {
    if let Some(children) = children {
        for child in children {
            if child.iyn == target_iyn {
                run_element(vec![child], stop_flag.clone());
            }
        }
    }
}

pub fn run_element(elements: Vec<Children>, stop_flag: Arc<AtomicBool>) {
    for c in elements {
        if stop_flag.load(Ordering::Relaxed) {
            break;
        }

        match &c.element {
            ElementEnum::Element(e) => {
                simulate_key(e.elements_code);
                handle_children(c.children.clone(), "y", &stop_flag);
            }
            ElementEnum::Skill(s) => {
                let process_name = PROCESS_NAME.clone();
                if let Ok(reader) = GameMemoryReader::new(&process_name, 0x00400000) {
                    let skill_code = reader.read_skill().unwrap_or_else(|e| {
                        eprintln!("Error reading skill: {:?}", e);
                        0
                    });
                    let target_iyn: &'static str =
                        if skill_code == s.skill_code { "y" } else { "n" };
                    handle_children(c.children.clone(), target_iyn, &stop_flag);
                }
            }
            ElementEnum::TimeOrNama(t) => match t.t {
                1 => {
                    // println!("Delay for {} milliseconds", t.n);
                    // let delay_duration = std::time::Duration::from_millis(t.n as u64);
                    // let start = Instant::now();

                    // // 使用忙等待确保精确延迟
                    // while start.elapsed() < delay_duration {
                    //     std::thread::yield_now();
                    // }
                    thread::sleep(Duration::from_millis(t.n as u64));
                    handle_children(c.children.clone(), "y", &stop_flag);
                }
                2 => {
                    let e_id = &t.id;
                    let out_wait_time = t.n * 2;
                    let now = Instant::now();
                    let mut last_time_map = TIME_CHECK_TIME.lock().unwrap();
                    let check_result = if let Some(last_time) = last_time_map.get(e_id) {
                        let duration = last_time.elapsed().as_millis();
                        if duration < t.n.into() || duration >= out_wait_time.into() {
                            false
                        } else {
                            last_time_map.insert(e_id.clone(), now);
                            true
                        }
                    } else {
                        last_time_map.insert(e_id.clone(), now);
                        false
                    };
                    let target_iyn = if check_result { "y" } else { "n" };
                    handle_children(c.children.clone(), target_iyn, &stop_flag);
                }
                3 => {
                    let process_name = PROCESS_NAME.clone();
                    if let Ok(reader) = GameMemoryReader::new(&process_name, 0x00400000) {
                        let inner_power = reader.read_mana().unwrap_or_else(|e| {
                            eprintln!("Error reading inner power: {:?}", e);
                            0
                        });
                        let target_iyn = if inner_power <= t.n.try_into().unwrap() {
                            "y"
                        } else {
                            "n"
                        };
                        handle_children(c.children.clone(), target_iyn, &stop_flag);
                    }
                }
                _ => {}
            },
            ElementEnum::Color(co) => {
                let check_result = check_color_distance(co.rgb.clone(), co.coordinate.clone(), 0);
                let target_iyn = if check_result { "y" } else { "n" };
                handle_children(c.children.clone(), target_iyn, &stop_flag);
            }
        }
    }
}
