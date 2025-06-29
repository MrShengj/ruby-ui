use mac_address::get_mac_address;
use md5::{Digest, Md5};

pub fn local_mac_address() -> String {
    let mut mac_md5: String = "".to_string();

    match get_mac_address() {
        Ok(mac) => {
            // println!("mac 地址 {:?}", mac.unwrap().to_string());
            let mut hasher = Md5::new();
            // 将字符串转换为字节序列并更新 hasher
            hasher.update(mac.unwrap().to_string().as_bytes());

            // 计算 MD5 哈希值
            let result = hasher.finalize();

            // 将结果格式化为字符串
            let hashed_string = format!("{:x}", result);
            // println!("MD5 Hash: {}", hashed_string);
            mac_md5 = hashed_string;
        }
        Err(e) => eprintln!("Error: {}", e),
    }
    mac_md5
}