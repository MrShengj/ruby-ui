use lazy_static::lazy_static;
use std::sync::Mutex;
use windows::Win32::Foundation::HWND;
use windows::Win32::Graphics::Gdi::{GetDC, ReleaseDC, HDC};

lazy_static! {
    static ref GLOBAL_HDC_SCREEN: Mutex<Option<isize>> = Mutex::new(None);
}

pub fn init_global_hdc_screen() {
    let mut hdc_guard = GLOBAL_HDC_SCREEN.lock().unwrap();
    if hdc_guard.is_none() {
        unsafe {
            let hdc = GetDC(Some(HWND(std::ptr::null_mut())));
            if !hdc.is_invalid() {
                *hdc_guard = Some(hdc.0 as isize);
            }
        }
    }
}

pub fn release_global_hdc_screen() {
    let mut hdc_guard = GLOBAL_HDC_SCREEN.lock().unwrap();
    if let Some(hdc_raw) = *hdc_guard {
        unsafe {
            let hwnd = HWND(std::ptr::null_mut());
            let hdc = HDC(hdc_raw as isize as _);
            ReleaseDC(Some(hwnd), hdc);
        }
        *hdc_guard = None;
    }
}
