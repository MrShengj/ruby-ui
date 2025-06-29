use serde::Serialize;
use windows::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};

pub fn screen_width() -> u32 {
    unsafe { GetSystemMetrics(SM_CXSCREEN) as u32 }
}

pub fn screen_height() -> u32 {
    unsafe { GetSystemMetrics(SM_CYSCREEN) as u32 }
}

#[derive(Debug, Copy, Clone, PartialEq, Serialize)]
pub struct RGB {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl RGB {
    pub fn new(r: u8, g: u8, b: u8) -> Self {
        RGB { r, g, b }
    }

    #[allow(dead_code)]
    pub fn squared_distance_to(&self, other: &RGB) -> i32 {
        let dr = self.r as i32 - other.r as i32;
        let dg = self.g as i32 - other.g as i32;
        let db = self.b as i32 - other.b as i32;
        dr * dr + dg * dg + db * db
    }
}
