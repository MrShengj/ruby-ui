use once_cell::sync::Lazy;
use std::{sync::Mutex, thread, time};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, KEYEVENTF_SCANCODE,
    MAPVK_VK_TO_VSC, VIRTUAL_KEY,
};

use crate::global::global::HOLD_ON_TIME;

// 缓存扫描码映射，避免重复调用 MapVirtualKeyW
static SCAN_CODE_CACHE: Lazy<Mutex<std::collections::HashMap<u16, u16>>> =
    Lazy::new(|| Mutex::new(std::collections::HashMap::new()));

pub fn simulate_key(key: u32) -> Result<(), String> {
    let virtual_key = key as u16;

    // 按键按下
    enter_simulate_key(virtual_key, false)?;

    // 按键持续时间
    let hold_on_time = {
        let hold_time = HOLD_ON_TIME.lock().map_err(|_| "Failed to acquire lock")?;
        *hold_time as u64
    };

    if hold_on_time > 0 {
        thread::sleep(time::Duration::from_millis(hold_on_time));
    }

    // 按键释放
    enter_simulate_key(virtual_key, true)?;

    Ok(())
}

// 批量发送按键，提高效率
#[allow(dead_code)]
pub fn simulate_keys_batch(keys: &[u32]) -> Result<(), String> {
    let mut inputs = Vec::with_capacity(keys.len() * 2);

    // 构建所有按键按下事件
    for &key in keys {
        let scan_code = get_scan_code_cached(key as u16)?;
        inputs.push(create_input(scan_code, false));
    }

    // 构建所有按键释放事件
    for &key in keys {
        let scan_code = get_scan_code_cached(key as u16)?;
        inputs.push(create_input(scan_code, true));
    }

    // 批量发送
    send_inputs(&inputs)?;

    Ok(())
}

fn enter_simulate_key(virtual_key: u16, is_key_up: bool) -> Result<(), String> {
    let scan_code = get_scan_code_cached(virtual_key)?;
    let input = create_input(scan_code, is_key_up);
    send_inputs(&[input])
}

// 缓存扫描码以提高性能
fn get_scan_code_cached(virtual_key: u16) -> Result<u16, String> {
    let mut cache = SCAN_CODE_CACHE
        .lock()
        .map_err(|_| "Failed to acquire scan code cache lock")?;

    if let Some(&scan_code) = cache.get(&virtual_key) {
        return Ok(scan_code);
    }

    let scan_code = unsafe {
        windows::Win32::UI::Input::KeyboardAndMouse::MapVirtualKeyW(
            virtual_key.into(),
            MAPVK_VK_TO_VSC,
        ) as u16
    };

    if scan_code == 0 {
        return Err(format!("Invalid virtual key: {}", virtual_key));
    }

    cache.insert(virtual_key, scan_code);
    Ok(scan_code)
}

// 创建输入结构体
fn create_input(scan_code: u16, is_key_up: bool) -> INPUT {
    let mut flags = KEYEVENTF_SCANCODE;
    if is_key_up {
        flags |= KEYEVENTF_KEYUP;
    }

    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: VIRTUAL_KEY(0), // 使用扫描码时设为0
                wScan: scan_code,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

// 发送输入事件
fn send_inputs(inputs: &[INPUT]) -> Result<(), String> {
    if inputs.is_empty() {
        return Ok(());
    }

    unsafe {
        let sent = SendInput(inputs, std::mem::size_of::<INPUT>() as i32);
        if sent != inputs.len() as u32 {
            return Err(format!(
                "SendInput failed. Expected: {}, Sent: {}",
                inputs.len(),
                sent
            ));
        }
    }

    Ok(())
}

// 高级按键组合功能
#[allow(dead_code)]
pub fn simulate_key_combination(keys: &[u32], hold_time_ms: u64) -> Result<(), String> {
    let mut inputs = Vec::with_capacity(keys.len() * 2);

    // 按下所有按键
    for &key in keys {
        let scan_code = get_scan_code_cached(key as u16)?;
        inputs.push(create_input(scan_code, false));
    }

    send_inputs(&inputs)?;

    // 保持按下状态
    if hold_time_ms > 0 {
        thread::sleep(time::Duration::from_millis(hold_time_ms));
    }

    // 释放所有按键（逆序释放）
    inputs.clear();
    for &key in keys.iter().rev() {
        let scan_code = get_scan_code_cached(key as u16)?;
        inputs.push(create_input(scan_code, true));
    }

    send_inputs(&inputs)?;
    Ok(())
}

// 清除缓存（可选，用于内存管理）
#[allow(dead_code)]
pub fn clear_scan_code_cache() {
    if let Ok(mut cache) = SCAN_CODE_CACHE.lock() {
        cache.clear();
    }
}
