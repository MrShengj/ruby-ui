use std::{sync::atomic::Ordering, thread, time::Duration};

use windows::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;

use crate::{
    act::action::run_element,
    global::{
        global::{ACTION_TYPE, GLOBAL_STOP_FLAG, MODE_CLOSE, STOP_ACTION, TIME_WITE},
        model::Elements,
    },
};

pub fn mouse_type(elements: Elements) {
    {
        let mut mode_close = MODE_CLOSE.lock().unwrap();
        *mode_close = false;
    }
    let action_type = *ACTION_TYPE.lock().unwrap();
    if action_type == 1 {
        hold_on(elements.clone())
    } else if action_type == 2 {
        // 单击模式
        click(elements.clone());
    }
}

// 长按监听
fn hold_on(elements: Elements) {
    thread::spawn(move || {
        let mut current_thread: Option<thread::JoinHandle<()>> = None;
        let mut was_key_down = false; // 添加状态跟踪

        loop {
            // 判断是否关闭
            if *MODE_CLOSE.lock().unwrap() {
                break;
            }
            // 判断是否暂停
            if *STOP_ACTION.lock().unwrap() {
                thread::sleep(Duration::from_millis(*TIME_WITE));
                continue;
            }

            let start_code = elements.header.elements_code;
            let key_down = match start_code {
                4 => unsafe { GetAsyncKeyState(0x05) & 0x8000u16 as i16 != 0 }, // 侧下键
                5 => unsafe { GetAsyncKeyState(0x06) & 0x8000u16 as i16 != 0 }, // 侧上键
                _ => false,
            };

            // 检测按键状态变化
            if key_down && !was_key_down {
                // 按键刚刚按下，启动循环执行线程
                if current_thread.is_none()
                    || current_thread
                        .as_ref()
                        .map(|t| t.is_finished())
                        .unwrap_or(true)
                {
                    GLOBAL_STOP_FLAG.store(false, Ordering::Relaxed);
                    let elements_c = elements.clone();
                    let stop_flag = GLOBAL_STOP_FLAG.clone();
                    current_thread = Some(thread::spawn(move || {
                        // 持续循环执行，直到停止标志被设置
                        // let mut cycle_count = 0;
                        while !stop_flag.load(Ordering::Relaxed) {
                            if let Some(children) = &elements_c.children {
                                // let start_time = Instant::now();
                                let result = run_element(children.clone(), stop_flag.clone());
                                if result.is_err() {
                                    eprintln!("Error running element: {:?}", result.err());
                                }
                                // let execution_time = start_time.elapsed();
                                // cycle_count += 1;
                                // println!("run_element cycle {}: {:?}", cycle_count, execution_time);
                            }
                            // 检查是否需要停止
                            if stop_flag.load(Ordering::Relaxed) {
                                break;
                            }
                            // 移除 TIME_WITE 等待，让 run_element 连续执行
                        }
                    }));
                }
            } else if !key_down && was_key_down {
                // 按键刚刚释放，停止执行
                GLOBAL_STOP_FLAG.store(true, Ordering::Relaxed);
                if let Some(handle) = current_thread.take() {
                    let _ = handle.join();
                }
            }

            was_key_down = key_down;

            // 控制循环频率
            thread::sleep(Duration::from_millis(10)); // 降低检测频率
        }

        // 退出前确保线程结束
        GLOBAL_STOP_FLAG.store(true, Ordering::Relaxed);
        if let Some(handle) = current_thread {
            let _ = handle.join();
        }
    });
}

// 单击监听
fn click(elements: Elements) {
    thread::spawn(move || {
        let mut running = false;
        let mut worker: Option<thread::JoinHandle<()>> = None;
        let mut was_key_down = false; // 添加状态跟踪

        loop {
            // 判断是否关闭
            if *MODE_CLOSE.lock().unwrap() {
                break;
            }
            // 判断是否暂停
            if *STOP_ACTION.lock().unwrap() {
                thread::sleep(Duration::from_millis(*TIME_WITE));
                continue;
            }

            let start_code = elements.header.elements_code;
            let key_down = match start_code {
                4 => unsafe { GetAsyncKeyState(0x05) & 0x8000u16 as i16 != 0 }, // 侧下键
                5 => unsafe { GetAsyncKeyState(0x06) & 0x8000u16 as i16 != 0 }, // 侧上键
                _ => false,
            };

            // 只在按键状态从未按下变为按下时切换状态
            if key_down && !was_key_down {
                running = !running; // 切换运行状态
                GLOBAL_STOP_FLAG.store(!running, Ordering::Relaxed);

                if running {
                    // 启动循环线程
                    let elements_c = elements.clone();
                    let stop_flag = GLOBAL_STOP_FLAG.clone();
                    worker = Some(thread::spawn(move || {
                        while !stop_flag.load(Ordering::Relaxed) {
                            if let Some(children) = &elements_c.children {
                                let result = run_element(children.clone(), stop_flag.clone());
                                if result.is_err() {
                                    eprintln!("Error running element: {:?}", result.err());
                                }
                            }
                            // 移除 TIME_WITE 等待，让 run_element 连续执行
                        }
                    }));
                } else {
                    // 停止循环线程
                    if let Some(handle) = worker.take() {
                        let _ = handle.join();
                    }
                }
            }

            was_key_down = key_down;

            // 控制主循环频率
            thread::sleep(Duration::from_millis(10));
        }

        // 确保退出时停止工作线程
        GLOBAL_STOP_FLAG.store(true, Ordering::Relaxed);
        if let Some(handle) = worker {
            let _ = handle.join();
        }
    });
}
