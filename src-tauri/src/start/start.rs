use std::thread;

use device_query::{DeviceQuery, DeviceState, Keycode};

use crate::{
    act::{keyboard::keyboard_type, mouse::mouse_type},
    global::{
        global::{HOLD_ON_TIME, MODE_CLOSE, STOP_ACTION, TIME_CHECK_TIME, TIME_WITE},
        init::{init_global_hdc_screen, release_global_hdc_screen},
        model::Elements,
    },
    user::user::get_hod_on_time,
};

/**
 * element x6的元素集合
 * t: 开启或者关闭
 */
pub fn start(element: Vec<Elements>, t: bool) {
    if t {
        // get_hod_on_time 通过用户配置修改HOLD_ON_TIME
        let user_set_hold_on_time = get_hod_on_time();
        {
            let mut hold_on_time = HOLD_ON_TIME.lock().unwrap();
            *hold_on_time = match user_set_hold_on_time {
                Ok(val) => val as u64,
                Err(_) => *hold_on_time, // or provide a default value, e.g. 1000
            };
        }

        init_global_hdc_screen(); // 初始化全局屏幕句柄
    } else {
        release_global_hdc_screen(); // 释放全局屏幕句柄
        TIME_CHECK_TIME.lock().unwrap().clear(); // 清除时间检查缓存
        return;
    }
    // 设置关闭标识为false 表示开启状态
    {
        let mut stop_action = STOP_ACTION.lock().unwrap();
        *stop_action = false;
    }
    for e in element.iter() {
        if e.header.elements_code == 4 || e.header.elements_code == 5 {
            // 鼠标模式
            mouse_type(e.clone());
        } else {
            // 这些都是键盘代码，使用键盘监听
            keyboard_type(e.clone());
        }
    }
}

/**
 * 关闭规则
 */
pub fn close() {
    {
        let mut mode_close: std::sync::MutexGuard<bool> = MODE_CLOSE.lock().unwrap();
        *mode_close = true;
        let mut stop_action = STOP_ACTION.lock().unwrap();
        *stop_action = true;
    }
}

/**
 * 停止所有操作
 */
pub fn stop() {
    thread::spawn(move || loop {
        let mode_close = {
            let mode_close = MODE_CLOSE.lock().unwrap();
            *mode_close
        };
        if !mode_close {
            let device_state = DeviceState::new();
            let keys: Vec<Keycode> = device_state.get_keys();
            if keys.len() > 0 && keys[0] == Keycode::F2 {
                {
                    let mut stop_action = STOP_ACTION.lock().unwrap();
                    *stop_action = true;
                }
            }
            if keys.len() > 0 && keys[0] == Keycode::F3 {
                {
                    let mut stop_action = STOP_ACTION.lock().unwrap();
                    *stop_action = false;
                }
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(*TIME_WITE));
    });
}
