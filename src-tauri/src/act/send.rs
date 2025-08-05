use std::{thread, time};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, KEYEVENTF_SCANCODE,
    MAPVK_VK_TO_VSC, VIRTUAL_KEY,
};

/// 模拟键盘按键点击
///
/// # 参数
/// - `vk_code`: 虚拟键码（VIRTUAL_KEY）
/// - `key_up_delay`: 按下到抬起之间的延迟（毫秒）
pub fn simulate_key(vk_code: u32, key_up_delay: u32) -> Result<(), Box<dyn std::error::Error>> {
    use windows::Win32::UI::Input::KeyboardAndMouse::MapVirtualKeyW;

    unsafe {
        // 获取扫描码
        let scan_code = MapVirtualKeyW(vk_code, MAPVK_VK_TO_VSC);

        // 构造按下事件
        let input_down = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(vk_code.try_into().unwrap()),
                    wScan: scan_code as u16,
                    dwFlags: KEYEVENTF_SCANCODE,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };

        // 构造抬起事件
        let input_up = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(vk_code.try_into().unwrap()),
                    wScan: scan_code as u16,
                    dwFlags: KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };

        // 发送按下
        let sent_down = SendInput(&[input_down], std::mem::size_of::<INPUT>() as i32);
        if sent_down == 0 {
            return Err("SendInput 按下事件失败".into());
        }

        // 按下到抬起的延迟
        thread::sleep(time::Duration::from_millis(key_up_delay.into()));

        // 发送抬起
        let sent_up = SendInput(&[input_up], std::mem::size_of::<INPUT>() as i32);
        if sent_up == 0 {
            return Err("SendInput 抬起事件失败".into());
        }

        // // 操作后等待
        // thread::sleep(time::Duration::from_millis(wait_ms));
    }
    Ok(())
}
