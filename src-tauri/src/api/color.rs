use crate::rgb::pick::mouse_rgb;

#[tauri::command]
// 鼠标位置的rgb值
pub fn get_mouse_rgb() -> String {
    let rbg = mouse_rgb();
    rbg
}
