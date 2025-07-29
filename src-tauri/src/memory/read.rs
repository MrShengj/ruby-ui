use std::mem::{size_of, zeroed};
use std::ptr::null_mut;
use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};
use windows::{
    core::Error,
    Win32::{
        Foundation::{CloseHandle, HANDLE},
        Security::{
            AdjustTokenPrivileges, LookupPrivilegeValueW, LUID_AND_ATTRIBUTES, SE_DEBUG_NAME,
            SE_PRIVILEGE_ENABLED, TOKEN_ADJUST_PRIVILEGES, TOKEN_PRIVILEGES, TOKEN_QUERY,
        },
        System::{
            Diagnostics::Debug::ReadProcessMemory,
            Diagnostics::ToolHelp::{
                CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
                TH32CS_SNAPPROCESS,
            },
            Threading::{
                OpenProcess, PROCESS_ALL_ACCESS, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ,
            },
        },
    },
};

// 定义错误类型
#[derive(Debug)]
#[allow(dead_code)]
pub enum MemoryError {
    ProcessNotFound,
    OpenProcessFailed(Error),
    ReadMemoryFailed(Error),
    PrivilegeAdjustFailed(Error),
    // 其他错误...
}

// 主结构体
pub struct GameMemoryReader {
    process_handle: HANDLE,
    base_address: usize,
}

impl GameMemoryReader {
    /// 创建新的读取器并提权
    pub fn new(process_name: &str, base_address: usize) -> Result<Self, MemoryError> {
        // 提权操作
        adjust_debug_privilege(true).expect("msg: 提权失败");

        // 获取进程ID（此处简化为示例，实际需要枚举进程）
        let pid = find_process_id(process_name).ok_or(MemoryError::ProcessNotFound)?;
        // println!("进程ID: {}", pid);
        // 打开进程句柄
        let handle = unsafe {
            OpenProcess(
                PROCESS_ALL_ACCESS | PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                false,
                pid,
            )
        }
        .map_err(|e| MemoryError::OpenProcessFailed(e))?; // This ensures the variant is used

        Ok(Self {
            process_handle: handle,
            base_address,
        })
    }

    /// 读取链式地址
    #[allow(dead_code)]
    pub fn read_chain(&self, offsets: &[usize]) -> Result<usize, MemoryError> {
        let mut current = self.base_address;
        for &offset in offsets {
            current = self.read_memory::<usize>(current + offset, None)?;
        }
        Ok(current)
    }

    /// 泛型内存读取方法
    pub fn read_memory<T: Copy + Default>(
        &self,
        address: usize,
        byte_size: Option<usize>,
    ) -> Result<T, MemoryError> {
        let mut buffer: T = Default::default();
        let size = byte_size.unwrap_or(size_of::<T>());
        // println!("读取地址: {:#X}, 大小: {}", address, size); // 添加调试日志

        unsafe {
            // 读取内存
            if ReadProcessMemory(
                self.process_handle,
                address as _,
                &mut buffer as *mut T as _,
                size,
                None,
            )
            .is_ok()
            {
                // 根据类型返回结果
                Ok(buffer)
            } else {
                Err(MemoryError::ReadMemoryFailed(Error::from_win32()))
            }
        }
    }

    /// 读取技能名称
    #[allow(dead_code)]
    pub fn read_skill(&self) -> Result<u32, MemoryError> {
        let skill_address = self.base_address + 0x00C912F0;
        let offsets = 0x60;
        let mut current_address = skill_address;
        let read_memory_data = self.read_memory::<u32>(current_address, Some(4))?;
        current_address = read_memory_data as usize + offsets;

        // 最终读取技能 ID
        let skill_id = self.read_memory::<u32>(current_address, Some(4))?;

        Ok(skill_id)
    }

    /// 读取法力值
    pub fn read_mana(&self) -> Result<usize, MemoryError> {
        let offsets = [0x00C910E4, 0x2C, 0xC, 0xA0];
        let mut current_address = self.base_address;

        for &offset in &offsets {
            // 检查当前地址是否有效
            if current_address == 0 {
                return Err(MemoryError::ReadMemoryFailed(Error::from_win32()));
            }

            // 读取当前地址的值
            current_address = self.read_memory::<usize>(current_address + offset, Some(4))?;
        }

        // 最终读取法力值
        Ok(current_address)
    }

    // 左右键和F
    #[allow(dead_code)]
    pub fn read_lrf(&self, offset: usize) -> Result<usize, MemoryError> {
        // println!("读取技能偏移量: {}", offset);
        // offset10进制转16进制
        // println!("技能偏移量(16进制): {:#X}", offset);
        // let offsets = [0x00C912F0, 0x248, 0x8, 0x4, 0x8, 0x0, 0x30, offset];
        let offsets = [0x00C912F0, 0x25C, offset];
        let mut current_address = self.base_address;

        for &offset in &offsets {
            // 检查当前地址是否有效
            if current_address == 0 {
                return Err(MemoryError::ReadMemoryFailed(Error::from_win32()));
            }

            // 读取当前地址的值
            current_address = self.read_memory::<usize>(current_address + offset, Some(4))?;
        }

        Ok(current_address)
    }

    #[allow(dead_code)]
    pub fn read_skill_plan(&self, offset: usize) -> Result<usize, MemoryError> {
        let offsets = [
            0x00C910E4, 0x2C, 0x0C, 0x00058B48, 0x00017A80, 0x28, offset, 0x10,
        ];
        let mut current_address = self.base_address;

        for &offset in &offsets {
            // 检查当前地址是否有效
            if current_address == 0 {
                return Err(MemoryError::ReadMemoryFailed(Error::from_win32()));
            }

            // 读取当前地址的值
            current_address = self.read_memory::<usize>(current_address + offset, Some(4))?;
        }

        // 最终读取技能计划
        Ok(current_address)
    }
}

impl Drop for GameMemoryReader {
    fn drop(&mut self) {
        unsafe { CloseHandle(self.process_handle).ok() };
    }
}

/// 提权函数
fn adjust_debug_privilege(enable: bool) -> Result<(), MemoryError> {
    unsafe {
        let mut token = HANDLE::default();
        if !OpenProcessToken(
            GetCurrentProcess(),
            TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY,
            &mut token,
        )
        .is_ok()
        {
            return Err(MemoryError::PrivilegeAdjustFailed(Error::from_win32()));
        }

        let mut luid = zeroed();
        if !LookupPrivilegeValueW(None, SE_DEBUG_NAME, &mut luid).is_ok() {
            return Err(MemoryError::PrivilegeAdjustFailed(Error::from_win32()));
        }

        let mut tp = TOKEN_PRIVILEGES {
            PrivilegeCount: 1,
            Privileges: [LUID_AND_ATTRIBUTES {
                Luid: luid,
                Attributes: if enable {
                    SE_PRIVILEGE_ENABLED
                } else {
                    windows::Win32::Security::TOKEN_PRIVILEGES_ATTRIBUTES(0)
                },
            }],
        };

        if !AdjustTokenPrivileges(
            token,
            false,
            Some(&mut tp),
            0,
            Some(null_mut()),
            Some(null_mut()),
        )
        .is_ok()
        {
            Err(MemoryError::PrivilegeAdjustFailed(Error::from_win32()))
        } else {
            Ok(())
        }
    }
}

fn find_process_id(name: &str) -> Option<u32> {
    unsafe {
        // 创建进程快照
        let snapshot = match CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
            Ok(handle) => handle,
            Err(_) => return None,
        };
        if snapshot.is_invalid() {
            return None;
        }

        let mut entry = PROCESSENTRY32W {
            dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
            ..Default::default()
        };

        // 遍历进程列表
        if Process32FirstW(snapshot, &mut entry).is_ok() {
            loop {
                // 将进程名称转换为 Rust 字符串
                let process_name = String::from_utf16_lossy(
                    &entry
                        .szExeFile
                        .iter()
                        .take_while(|c| **c != 0u16)
                        .map(|&c| c)
                        .collect::<Vec<u16>>(),
                );

                // 检查是否匹配目标进程名称
                if process_name.eq_ignore_ascii_case(name) {
                    return Some(entry.th32ProcessID);
                }

                // 获取下一个进程
                if !Process32NextW(snapshot, &mut entry).is_ok() {
                    break;
                }
            }
        }

        None
    }
}
