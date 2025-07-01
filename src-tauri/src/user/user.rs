use mac_address::get_mac_address;
use md5::{Digest, Md5};
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;

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

// 在用户目录下创建一个隐藏文件夹, 文件夹中创建一个json文件，json文件中存放用户的配置信息
pub fn create_user_config_dir() {
    // 获取用户主目录
    let home_dir = dirs::home_dir()
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "无法获取用户主目录"));
    match home_dir {
        Ok(dir) => {
            // 创建隐藏文件夹路径 (以点开头的文件夹在Unix/Linux/macOS下是隐藏的)
            let config_dir = dir.join(".ruby");

            // 检查目录是否已存在
            if config_dir.exists() {
                if !config_dir.is_dir() {
                    eprintln!("路径 {:?} 存在但不是目录", config_dir);
                    return;
                }
            } else {
                // 创建文件夹（如果不存在）
                println!("正在创建配置目录...");
                match fs::create_dir_all(&config_dir) {
                    Ok(_) => {}
                    Err(e) => {
                        eprintln!("创建配置目录失败: {:?}, 错误: {}", config_dir, e);

                        // 尝试检查父目录权限
                        let parent = config_dir.parent();
                        if let Some(parent_dir) = parent {
                            println!("父目录: {:?}", parent_dir);
                            println!("父目录是否存在: {}", parent_dir.exists());
                            println!(
                                "父目录是否可写: {:?}",
                                parent_dir.metadata().map(|m| !m.permissions().readonly())
                            );
                        }
                        return;
                    }
                }
            }

            // Windows下设置文件夹为隐藏属性
            #[cfg(windows)]
            {
                use std::os::windows::ffi::OsStrExt;
                use windows::Win32::Storage::FileSystem::{
                    SetFileAttributesW, FILE_ATTRIBUTE_HIDDEN,
                };

                let wide_path: Vec<u16> = config_dir
                    .as_os_str()
                    .encode_wide()
                    .chain(std::iter::once(0))
                    .collect();

                unsafe {
                    let result = SetFileAttributesW(
                        windows::core::PCWSTR(wide_path.as_ptr()),
                        FILE_ATTRIBUTE_HIDDEN,
                    );
                    if result.is_ok() {
                    } else {
                        eprintln!("设置文件夹隐藏属性失败");
                    }
                }
            }

            // 创建配置文件路径
            let config_file = config_dir.join("config.json");

            // 如果配置文件不存在，创建默认配置
            if !config_file.exists() {
                let default_config = json!({
                    "hold_on_time": 100
                });

                // 将JSON写入文件
                match serde_json::to_string_pretty(&default_config) {
                    Ok(data) => match fs::write(&config_file, data) {
                        Ok(_) => {}
                        Err(e) => {
                            eprintln!("写入配置文件失败: {:?}, 错误: {}", config_file, e);
                        }
                    },
                    Err(e) => {
                        eprintln!("序列化默认配置失败: {}", e);
                    }
                }
            }
        }
        Err(e) => {
            panic!("无法获取用户主目录: {}", e);
        }
    }
}

// 读取用户配置
pub fn read_user_config() -> std::io::Result<Value> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "无法获取用户主目录"))?;

    let config_file = home_dir.join(".ruby").join("config.json");

    if !config_file.exists() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "配置文件不存在",
        ));
    }

    let content = fs::read_to_string(&config_file)?;
    let config: Value = serde_json::from_str(&content)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

    Ok(config)
}

// 更新用户配置
pub fn update_user_config(key: &str, value: Value) -> std::io::Result<()> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "无法获取用户主目录"))?;

    let config_file = home_dir.join(".ruby").join("config.json");

    // 读取现有配置
    let mut config = if config_file.exists() {
        let content = fs::read_to_string(&config_file)?;
        serde_json::from_str(&content)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?
    } else {
        json!({})
    };

    // 更新配置
    config[key] = value;
    config["last_updated"] = json!(chrono::Utc::now().to_rfc3339());

    // 写回文件
    fs::write(&config_file, serde_json::to_string_pretty(&config)?)?;

    Ok(())
}

// 获取配置文件路径
#[allow(dead_code)]
pub fn get_config_path() -> Option<PathBuf> {
    dirs::home_dir().map(|home| home.join(".ruby").join("config.json"))
}

// 获取配置文件内容的hod_on_time的值
#[allow(dead_code)]
pub fn get_hod_on_time() -> std::io::Result<i64> {
    let config = read_user_config()?;
    if let Some(hod_on_time) = config.get("hold_on_time") {
        if let Some(value) = hod_on_time.as_i64() {
            return Ok(value);
        }
    }
    Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "hod_on_time not found in config",
    ))
}
