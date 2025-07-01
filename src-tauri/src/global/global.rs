use std::{
    collections::HashMap,
    sync::{atomic::AtomicBool, Arc, Mutex},
    time::Instant,
};

use lazy_static::lazy_static;

use crate::global::common::{screen_height, screen_width};

lazy_static! {
pub static ref MODE_CLOSE: Mutex<bool> = Mutex::new(true); // 关闭标识
pub static ref STOP_ACTION: Mutex<bool> = Mutex::new(true); // 暂停标识
pub static ref ACTION_TYPE: Mutex<u32> = Mutex::new(1); // 操作模式 1: 长按模式 2: 单击模式
pub static ref SCREEN_WIDTH: Mutex<u32> = Mutex::new(screen_width()); // 屏幕宽度
pub static ref SCREEN_HEIGHT: Mutex<u32> = Mutex::new(screen_height()); // 屏幕高度
pub static ref PROCESS_NAME: String = "Client.exe".to_string(); // 进程名称  "Client.exe"
pub static ref TIME_WITE: u64 = 200; // 无任何操作的时候等待时长ms
pub static ref GLOBAL_STOP_FLAG: Arc<AtomicBool> = Arc::new(AtomicBool::new(false)); // 全局停止标志
pub static ref HOLD_ON_TIME: Mutex<u64> = Mutex::new(100); // 长按时间ms
pub static ref TIME_CHECK_TIME: Mutex<HashMap<String, Instant>> = Mutex::new(HashMap::new());
}
