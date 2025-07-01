mod act;
mod api;
mod global;
mod memory;
mod rgb;
mod start;
mod test;
mod user;

use tauri::Emitter;
use tauri::Manager;

use crate::api::color;
use crate::api::sys;
use crate::global::global::STOP_ACTION;
use crate::user::user::create_user_config_dir;

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
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 当尝试启动第二个实例时执行此回调
            println!("检测到另一个实例正在尝试启动，聚焦到当前窗口");

            // 获取主窗口并显示/聚焦
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }))
        .invoke_handler(tauri::generate_handler![
            sys::get_loacl_mac_md5, // 获取本地mac地址的md5值
            // sys::create_tray,               // 创建托盘
            color::get_mouse_rgb,           // 鼠标位置的rgb值
            api::start::run,                // 开始执行
            api::start::down,               // 停止执行
            api::start::change_action_type, // 改变操作方式
            sys::create_tray,               // 创建托盘
            sys::update_user_hold_on,       // 更新用户配置
            sys::read_user_hold_on,         // 读取用户配置中的长按时间
        ])
        .setup(|app| {
            // 初始化用户配置目录
            create_user_config_dir();
            // 使用 sys::create_tray 创建托盘
            if let Err(e) = sys::create_tray(app.handle().clone()) {
                eprintln!("Failed to create tray: {}", e);
            }

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
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // 阻止窗口关闭，改为隐藏
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
