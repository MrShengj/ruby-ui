use rdev::{listen, Event, EventType, Key};
use std::sync::{Arc, Mutex};
use std::{sync::atomic::Ordering, thread, time::Duration};

use crate::act::action::run_element;
use crate::global::global::GLOBAL_STOP_FLAG;
use crate::global::{
    global::{ACTION_TYPE, MODE_CLOSE, STOP_ACTION, TIME_WITE},
    model::Elements,
};

pub fn keyboard_type(elements: Elements) {
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

fn hold_on(elements: Elements) {
    thread::spawn(move || {
        let mut current_thread: Option<thread::JoinHandle<()>> = None;

        // 创建共享的按键状态
        let key_pressed = Arc::new(Mutex::new(false));
        let key_pressed_clone = key_pressed.clone();
        let start_code = elements.header.elements_code;

        // 启动键盘监听线程
        let _keyboard_thread = thread::spawn(move || {
            if let Err(error) = listen(move |event| {
                match event {
                    Event {
                        event_type: EventType::KeyPress(key),
                        ..
                    } => {
                        // 将按键转换为代码进行比较
                        let key_code = key_to_code(key);
                        if key_code == start_code {
                            *key_pressed_clone.lock().unwrap() = true;
                        }
                    }
                    Event {
                        event_type: EventType::KeyRelease(key),
                        ..
                    } => {
                        let key_code = key_to_code(key);
                        if key_code == start_code {
                            *key_pressed_clone.lock().unwrap() = false;
                        }
                    }
                    _ => {}
                }
            }) {
                eprintln!("键盘监听错误: {:?}", error);
            }
        });

        loop {
            let start = std::time::Instant::now();

            // 判断是否关闭
            if *MODE_CLOSE.lock().unwrap() {
                break;
            }
            // 判断是否暂停
            if *STOP_ACTION.lock().unwrap() {
                thread::sleep(Duration::from_millis(*TIME_WITE));
                continue;
            }

            let key_down = *key_pressed.lock().unwrap();

            GLOBAL_STOP_FLAG.store(!key_down, Ordering::Relaxed);

            if key_down {
                // 启动新线程执行子元素
                if current_thread
                    .as_ref()
                    .map(|t| t.is_finished())
                    .unwrap_or(true)
                {
                    let elements_c = elements.clone();
                    let stop_flag = GLOBAL_STOP_FLAG.clone();
                    current_thread = Some(thread::spawn(move || {
                        if stop_flag.load(Ordering::Relaxed) {
                            return;
                        }
                        if let Some(children) = &elements_c.children {
                            run_element(children.clone(), stop_flag.clone());
                        }
                    }));
                }
            } else {
                if let Some(thread) = current_thread.take() {
                    thread
                        .join()
                        .unwrap_or_else(|_| eprintln!("Thread join failed"));
                }
            }

            let elapsed = start.elapsed();
            if elapsed < Duration::from_millis(*TIME_WITE) {
                thread::sleep(Duration::from_millis(*TIME_WITE) - elapsed);
            }
        }
    });
}

fn click(elements: Elements) {
    thread::spawn(move || {
        let mut running = false;
        let mut worker: Option<thread::JoinHandle<()>> = None;

        // 使用更可靠的状态管理
        let key_pressed = Arc::new(Mutex::new(false));
        let key_pressed_clone = key_pressed.clone();
        let trigger_state = Arc::new(Mutex::new(false)); // 新增触发状态
        let trigger_state_clone = trigger_state.clone();
        let start_code = elements.header.elements_code;

        // 启动键盘监听线程
        let _keyboard_thread = thread::spawn(move || {
            if let Err(error) = listen(move |event| match event {
                Event {
                    event_type: EventType::KeyPress(key),
                    ..
                } => {
                    let key_code = key_to_code(key);
                    if key_code == start_code {
                        let mut pressed = key_pressed_clone.lock().unwrap();
                        if !*pressed {
                            *pressed = true;
                            // 设置触发标志
                            *trigger_state_clone.lock().unwrap() = true;
                        }
                    }
                }
                Event {
                    event_type: EventType::KeyRelease(key),
                    ..
                } => {
                    let key_code = key_to_code(key);
                    if key_code == start_code {
                        *key_pressed_clone.lock().unwrap() = false;
                    }
                }
                _ => {}
            }) {
                eprintln!("键盘监听错误: {:?}", error);
            }
        });

        loop {
            let start = std::time::Instant::now();

            // 判断是否关闭
            if *MODE_CLOSE.lock().unwrap() {
                break;
            }
            // 判断是否暂停
            if *STOP_ACTION.lock().unwrap() {
                thread::sleep(Duration::from_millis(50));
                continue;
            }

            // 检查是否有触发事件
            let mut trigger = trigger_state.lock().unwrap();
            if *trigger {
                *trigger = false; // 重置触发标志
                running = !running; // 切换运行状态

                println!("状态切换: running = {}", running); // 调试日志

                // 立即处理状态变化
                if !running {
                    // 需要停止线程
                    if let Some(handle) = worker.take() {
                        GLOBAL_STOP_FLAG.store(true, Ordering::Relaxed);
                        let _ = handle.join(); // 等待线程结束
                        println!("工作线程已停止");
                    }
                }
            }

            GLOBAL_STOP_FLAG.store(!running, Ordering::Relaxed);

            if running {
                // 启动循环线程
                if worker.as_ref().map(|t| t.is_finished()).unwrap_or(true) {
                    let elements_c = elements.clone();
                    let stop_flag = GLOBAL_STOP_FLAG.clone();
                    worker = Some(thread::spawn(move || {
                        while !stop_flag.load(Ordering::Relaxed) {
                            if let Some(children) = &elements_c.children {
                                run_element(children.clone(), stop_flag.clone());
                            }
                            // 控制循环频率
                            thread::sleep(Duration::from_millis(*TIME_WITE));
                        }
                        println!("工作线程正在退出");
                    }));
                    println!("工作线程已启动");
                }
            }

            // 大幅减少主循环延迟
            let elapsed = start.elapsed();
            let wait_time = Duration::from_millis(5); // 减少到5ms以提高响应性
            if elapsed < wait_time {
                thread::sleep(wait_time - elapsed);
            }
        }

        // 退出前确保工作线程完全结束
        if let Some(handle) = worker {
            GLOBAL_STOP_FLAG.store(true, Ordering::Relaxed);
            println!("等待工作线程结束...");
            let _ = handle.join();
            println!("工作线程已结束");
        }
    });
}

// 将按键转换为代码的辅助函数
fn key_to_code(key: Key) -> u32 {
    match key {
        Key::KeyA => 65,
        Key::KeyB => 66,
        Key::KeyC => 67,
        Key::KeyD => 68,
        Key::KeyE => 69,
        Key::KeyF => 70,
        Key::KeyG => 71,
        Key::KeyH => 72,
        Key::KeyI => 73,
        Key::KeyJ => 74,
        Key::KeyK => 75,
        Key::KeyL => 76,
        Key::KeyM => 77,
        Key::KeyN => 78,
        Key::KeyO => 79,
        Key::KeyP => 80,
        Key::KeyQ => 81,
        Key::KeyR => 82,
        Key::KeyS => 83,
        Key::KeyT => 84,
        Key::KeyU => 85,
        Key::KeyV => 86,
        Key::KeyW => 87,
        Key::KeyX => 88,
        Key::KeyY => 89,
        Key::KeyZ => 90,
        Key::Num0 => 48,
        Key::Num1 => 49,
        Key::Num2 => 50,
        Key::Num3 => 51,
        Key::Num4 => 52,
        Key::Num5 => 53,
        Key::Num6 => 54,
        Key::Num7 => 55,
        Key::Num8 => 56,
        Key::Num9 => 57,
        Key::Space => 32,
        Key::Return => 13,
        Key::Escape => 27,
        Key::Tab => 9,
        Key::ShiftLeft | Key::ShiftRight => 16,
        Key::ControlLeft | Key::ControlRight => 17,
        Key::Alt => 18,
        Key::F1 => 112,
        Key::F2 => 113,
        Key::F3 => 114,
        Key::F4 => 115,
        Key::F5 => 116,
        Key::F6 => 117,
        Key::F7 => 118,
        Key::F8 => 119,
        Key::F9 => 120,
        Key::F10 => 121,
        Key::F11 => 122,
        Key::F12 => 123,
        Key::CapsLock => 20,
        Key::NumLock => 144,
        // 添加更多按键映射...
        _ => 0, // 未知按键返回0
    }
}
