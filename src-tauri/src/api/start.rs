use std::any::Any;

use serde::Serialize;

use crate::{
    global::{global::ACTION_TYPE, model::Elements},
    start::start::{close, start, stop},
};
#[derive(Serialize)]
struct Res<T: Any> {
    code: u32,
    message: String,
    data: T,
}

#[tauri::command]
pub async fn run(elements: Vec<Elements>, t: bool) -> String {
    let mut response: Res<()> = Res {
        code: 200,
        message: String::from("开启成功"),
        data: (),
    };
    if t {
        if elements.len() == 0 {
            response.message = String::from("没有可用规则");
        } else {
            start(elements, t);
            stop()
        }
    } else {
        start(elements, t);
        response.message = String::from("关闭");
    }
    let json_str = serde_json::to_string(&response).expect("Failed to serialize");
    json_str
}

#[tauri::command]
pub async fn down() -> String {
    let mut response = Res {
        code: 200,
        message: String::from("关闭"),
        data: (),
    };
    close();
    response.message = String::from("关闭");
    let json_str = serde_json::to_string(&response).expect("Failed to serialize");
    json_str
}

#[tauri::command]
pub fn change_action_type(t: u32) -> String {
    let mut action_type = ACTION_TYPE.lock().unwrap();
    *action_type = t;
    let response = Res {
        code: 200,
        message: String::from("操作方式已更改"),
        data: (),
    };
    let json_str = serde_json::to_string(&response).expect("Failed to serialize");
    json_str
}
