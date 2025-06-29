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

            let start_code = elements.header.elements_code;
            let key_down = match start_code {
                4 => unsafe { GetAsyncKeyState(0x05) & 0x8000u16 as i16 != 0 }, // 侧下键
                5 => unsafe { GetAsyncKeyState(0x06) & 0x8000u16 as i16 != 0 }, // 侧上键
                _ => false,
            };

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
            } else if let Some(handle) = current_thread.take() {
                // 没有按下时等待线程结束
                let _ = handle.join();
            }

            // 控制循环频率
            let elapsed = start.elapsed();
            let wait_time = Duration::from_millis(*TIME_WITE);
            if elapsed < wait_time {
                thread::sleep(wait_time - elapsed);
            }
        }
        // 退出前确保线程结束
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

            let start_code = elements.header.elements_code;
            let key_down = match start_code {
                4 => unsafe { GetAsyncKeyState(0x05) & 0x8000u16 as i16 != 0 }, // 侧下键
                5 => unsafe { GetAsyncKeyState(0x06) & 0x8000u16 as i16 != 0 }, // 侧上键
                _ => false,
            };

            if key_down {
                running = !running; // 切换运行状态
            }
            GLOBAL_STOP_FLAG.store(!running, Ordering::Relaxed); // 确保标志为false
                                                                 // 检测按下沿（从未按下到按下）
            if running {
                // 启动循环线程
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
                }));
            } else {
                // 停止循环线程
                if let Some(handle) = worker.take() {
                    let _ = handle.join();
                }
            }

            // 控制主循环频率
            let elapsed = start.elapsed();
            let wait_time = Duration::from_millis(*TIME_WITE);
            if elapsed < wait_time {
                thread::sleep(wait_time - elapsed);
            }
        }
        if let Some(handle) = worker {
            let _ = handle.join();
        }
    });
}
