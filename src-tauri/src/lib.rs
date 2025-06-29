mod act;
mod api;
mod global;
mod memory;
mod rgb;
mod start;
mod test;
mod user;

use tauri::Emitter;

use crate::api::color;
use crate::api::sys;
use crate::global::global::STOP_ACTION;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            sys::get_loacl_mac_md5,         // 获取本地mac地址的md5值
            color::get_mouse_rgb,           // 鼠标位置的rgb值
            api::start::run,                // 开始执行
            api::start::down,               // 停止执行
            api::start::change_action_type, // 改变操作方式
        ])
        .setup(|app| {
            let app_handle: tauri::AppHandle = app.handle().clone();
            std::thread::spawn(move || loop {
                let stop_action = {
                    let data = STOP_ACTION.lock().unwrap();
                    *data
                };

                app_handle
                    .emit("stop_action", stop_action)
                    .expect("Failed to emit event");

                std::thread::sleep(std::time::Duration::from_millis(200));
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
