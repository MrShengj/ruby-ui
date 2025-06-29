use std::{thread, time};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, KEYEVENTF_SCANCODE,
    MAPVK_VK_TO_VSC, VIRTUAL_KEY,
};

use crate::global::global::HOLD_ON_TIME;

pub fn simulate_key(key: u32) {
    let e = enter_simulate_key(key as u16, false);
    match e {
        Ok(_) => {
            let hold_on_time = *HOLD_ON_TIME;
            thread::sleep(time::Duration::from_millis(hold_on_time as u64));
        }
        Err(e) => {
            println!("Error: {:?}", e);
            return;
        }
    }

    let e1 = enter_simulate_key(key as u16, true);
    match e1 {
        Ok(_) => {}
        Err(e) => {
            println!("Error: {:?}", e);
            return;
        }
    }
}

fn enter_simulate_key(virtual_key: u16, is_key_up: bool) -> Result<(), String> {
    unsafe {
        let scan_code = windows::Win32::UI::Input::KeyboardAndMouse::MapVirtualKeyW(
            virtual_key.into(),
            MAPVK_VK_TO_VSC,
        );
        let mut flags = KEYEVENTF_SCANCODE;
        if is_key_up {
            flags |= KEYEVENTF_KEYUP;
        }

        let input = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(0), // 使用扫描码时设为0
                    wScan: scan_code as u16,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };

        let inputs = [input];
        let sent = SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
        if sent != 1 {
            return Err(format!("SendInput failed."));
        }

        // 确保事件被处理
        thread::sleep(time::Duration::from_millis(20));
        Ok(())
    }
}
