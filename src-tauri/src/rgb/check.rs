use crate::global::common::RGB;
use lazy_static::lazy_static;
use std::sync::Mutex;
use windows::Win32::Foundation::HWND;
use windows::Win32::Graphics::Gdi::{
    BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits,
    SelectObject, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, HDC, SRCCOPY,
};

lazy_static! {
    // Store the raw handle as isize, which is Send + Sync
    static ref GLOBAL_HDC_SCREEN: Mutex<Option<isize>> = Mutex::new(None);
}

pub fn get_coordinate_rgb(x: i32, y: i32) -> RGB {
    unsafe {
        // println!("get_coordinate_rgb x: {}, y: {}", x, y);
        let hdc_screen = {
            let hdc_guard = GLOBAL_HDC_SCREEN.lock().unwrap();
            if let Some(hdc_raw) = *hdc_guard {
                HDC(hdc_raw as *mut std::ffi::c_void)
            } else {
                // fallback
                let hdc = GetDC(Some(HWND(std::ptr::null_mut())));
                if hdc.is_invalid() {
                    return RGB::new(0, 0, 0);
                }
                hdc
            }
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

/**
 * @param 校验取色
 */
pub fn check_color_distance(rgb: String, coordinate: String, deviation: i32) -> bool {
    let coordinate_v: Vec<i32> = coordinate
        .clone()
        .split(",")
        .map(|s| s.trim().parse().unwrap())
        .collect();
    let coordinate_rgb = get_coordinate_rgb(coordinate_v[0], coordinate_v[1]);

    let rgb: Vec<u8> = rgb
        .clone()
        .split(",")
        .map(|s| s.trim().parse().unwrap())
        .collect();
    let target_color = RGB::new(rgb[0], rgb[1], rgb[2]);
    let c: bool = color_check_one_by_one(coordinate_rgb, target_color, deviation);
    c
}

pub fn color_check_one_by_one(color: RGB, target_color: RGB, max_deviation: i32) -> bool {
    let dr = (color.r as i32 - target_color.r as i32).abs();
    let dg = (color.g as i32 - target_color.g as i32).abs();
    let db = (color.b as i32 - target_color.b as i32).abs();

    // 快速近似颜色差异（曼哈顿距离）
    let distance = dr + dg + db;
    distance <= max_deviation * 3 // 调整阈值
}
