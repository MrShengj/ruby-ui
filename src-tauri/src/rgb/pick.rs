use device_query::{DeviceQuery, DeviceState, Keycode};
use windows::Win32::Foundation::{HWND, POINT};
use windows::Win32::Graphics::Gdi::{
    BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits,
     SelectObject, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, SRCCOPY
};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

use crate::global::common::RGB;

// 获取指定点位的rgb值
pub fn pick_up_rgb(x: i32, y: i32) -> RGB {
    unsafe {
        let hdc_screen = {
            let hdc = GetDC(Some(HWND(std::ptr::null_mut())));
            if hdc.is_invalid() {
                return RGB::new(0, 0, 0);
            }
            hdc
        };

        let hdc_mem = CreateCompatibleDC(Some(hdc_screen));
        let hbm = CreateCompatibleBitmap(hdc_screen, 1, 1);
        SelectObject(hdc_mem, hbm.into());

        let _ = BitBlt(hdc_mem, 0, 0, 1, 1, Some(hdc_screen), x, y, SRCCOPY);

        let mut bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: 1,
                biHeight: 1,
                biPlanes: 1,
                biBitCount: 24,
                biCompression: 0,
                ..Default::default()
            },
            ..Default::default()
        };
        let mut pixel = [0u8; 3];
        GetDIBits(
            hdc_mem,
            hbm,
            0,
            1,
            Some(pixel.as_mut_ptr() as *mut _),
            &mut bmi,
            DIB_RGB_COLORS,
        );

        let _ = DeleteObject(hbm.into());
        let _ = DeleteDC(hdc_mem);

        // 注意：像素顺序是 BGR
        RGB::new(pixel[2], pixel[1], pixel[0])
    }
}

pub fn mouse_rgb() -> String {
    unsafe {
        let mut cursor_pos = POINT { x: 0, y: 0 };
        loop {
            let _ = GetCursorPos(&mut cursor_pos);
            let device_state = DeviceState::new();
            let keys: Vec<Keycode> = device_state.get_keys();

            match keys.first() {
                Some(Keycode::F1) | Some(Keycode::LControl) => break,
                _ => continue,
            }
        }

        let rgb =  pick_up_rgb(cursor_pos.x, cursor_pos.y);
        format!(
            "{},{}|{},{},{}",
            cursor_pos.x, cursor_pos.y, rgb.r, rgb.g, rgb.b
        )
    }
}