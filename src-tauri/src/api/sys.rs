use crate::user::user::{self, get_hod_on_time, update_user_config};
use serde_json::Value;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

#[tauri::command]
// 获取本地mac地址的md5值
pub fn get_loacl_mac_md5() -> String {
    let mac_md5 = user::local_mac_address();
    mac_md5
}

#[tauri::command]
pub fn create_tray(app: AppHandle) -> Result<(), tauri::Error> {
    let show = MenuItem::with_id(&app, "show", "显示窗口", true, None::<&str>)?;
    let quit = MenuItem::with_id(&app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(&app, &[&show, &PredefinedMenuItem::separator(&app)?, &quit])?;

    let _ = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone()) // 使用应用默认图标
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Ruby UI") // 添加提示文本
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(&app)?;

    Ok(())
}

// Tauri invoke 包装：读取用户配置
#[tauri::command]
pub fn read_user_hold_on() -> Result<i64, String> {
    match get_hod_on_time() {
        Ok(config) => Ok(config),
        Err(e) => Err(format!("读取配置失败: {}", e)),
    }
}

// Tauri invoke 包装：更新用户配置
#[tauri::command]
pub fn update_user_hold_on(duration: Value) -> Result<String, String> {
    match update_user_config("hold_on_time", duration) {
        Ok(_) => Ok("配置更新成功".to_string()),
        Err(e) => Err(format!("配置更新失败: {}", e)),
    }
}
