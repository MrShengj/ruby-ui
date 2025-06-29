use crate::user::user;

#[tauri::command]
// 获取本地mac地址的md5值
pub fn get_loacl_mac_md5() -> String {
    let mac_md5 = user::local_mac_address();
    mac_md5
}
