# Ruby UI - 自动化操作工具

基于 Tauri + React + TypeScript 构建的桌面自动化操作工具，支持键盘和鼠标事件监听与自动化执行。

## 🚀 功能特性

### 核心功能
- **可视化流程编辑**: 基于 X6 图形编辑器的拖拽式流程设计
- **多种触发模式**: 支持长按模式和单击模式
- **键盘监听**: 支持全局键盘事件监听和按键触发
- **鼠标监听**: 支持鼠标侧键监听（侧上键、侧下键）
- **颜色识别**: 内置取色器功能（LCtrl触发）
- **实时控制**: 支持暂停/恢复操作（F2/F3快捷键）

### 操作模式
- **长按模式**: 按住指定按键时持续执行操作
- **单击模式**: 点击按键开始执行，再次点击停止执行

### 界面功能
- **操作面板**: 统一的操作控制界面
- **状态指示**: 实时显示当前操作状态
- **版本信息**: 显示应用版本号
- **配置管理**: 支持自定义等待时间等参数

## 🛠️ 技术栈

### 前端
- **React 18**: 用户界面构建
- **TypeScript**: 类型安全的 JavaScript
- **Ant Design**: UI 组件库
- **X6**: 图形编辑器
- **Vite**: 构建工具

### 后端
- **Tauri**: 桌面应用框架
- **Rust**: 系统级编程语言
- **rdev**: 全局键盘/鼠标事件监听
- **windows-rs**: Windows API 调用

## 📦 安装说明

### 环境要求
- Node.js >= 16
- Rust >= 1.70
- Windows 10/11

### 开发环境设置

1. **克隆项目**
```bash
git clone [项目地址]
cd ruby-ui
```

2. **安装前端依赖**
```bash
npm install
```

3. **安装 Rust 工具链**
```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Tauri CLI
cargo install tauri-cli
```

4. **运行开发服务器**
```bash
npm run tauri dev
```

## 🔧 构建部署

### 开发模式
```bash
npm run tauri dev
```

### 生产构建
```bash
npm run tauri build
```

构建产物将生成在 `src-tauri/target/release/bundle/` 目录下。

## 📝 使用指南

### 基本操作

1. **创建操作流程**
   - 在操作面板中点击"添加"按钮
   - 使用图形编辑器设计自动化流程
   - 设置触发按键和执行参数

2. **配置触发模式**
   - 在设置面板中选择"长按模式"或"单击模式"
   - 调整HDO（等待时间）参数

3. **启动操作**
   - 点击操作卡片的开关按钮
   - 按下配置的触发按键开始执行

### 快捷键说明
- `LCtrl`: 取色功能
- `F2`: 暂停当前操作
- `F3`: 恢复操作
- `鼠标侧键`: 可配置为触发键

## 🏗️ 项目结构

```
ruby-ui/
├── src/                          # 前端源码
│   ├── pages/                    # 页面组件
│   │   ├── Content/             # 主要内容页面
│   │   │   ├── DoOperate/       # 操作执行页面
│   │   │   ├── Operate/         # 操作管理页面
│   │   │   └── Panel/           # 控制面板
│   │   └── Graph/               # 图形编辑器
│   └── components/              # 通用组件
├── src-tauri/                   # Tauri 后端
│   ├── src/
│   │   ├── act/                 # 操作执行模块
│   │   │   ├── keyboard.rs      # 键盘监听
│   │   │   ├── mouse.rs         # 鼠标监听
│   │   │   └── action.rs        # 动作执行
│   │   ├── global/              # 全局状态管理
│   │   └── main.rs              # 主程序入口
│   ├── Cargo.toml               # Rust 依赖配置
│   └── tauri.conf.json          # Tauri 配置
└── package.json                 # Node.js 依赖配置
```

## 🔍 核心模块说明

### 键盘监听模块 (`keyboard.rs`)
- 全局键盘事件监听
- 支持长按和单击两种模式
- 实时状态管理和线程安全

### 鼠标监听模块 (`mouse.rs`)
- 鼠标侧键监听
- Windows API 集成
- 高精度按键检测

### 操作执行模块 (`action.rs`)
- 自动化操作执行引擎
- 支持复杂流程控制
- 可中断和恢复执行

## 🐛 常见问题

### 1. 键盘监听不生效
- 确保应用以管理员权限运行
- 检查防病毒软件是否拦截

### 2. 鼠标侧键无响应
- 确认鼠标驱动已正确安装
- 检查鼠标是否支持侧键功能

### 3. 构建失败
- 确认 Rust 工具链版本
- 检查 Windows SDK 是否安装

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Tauri 官方文档](https://tauri.app/)
- [React 官方文档](https://reactjs.org/)
- [Ant Design 组件库](https://ant.design/)
- [X6 图形编辑器](https://x6.antv.vision/)

## 📞 支持与反馈

如果您在使用过程中遇到问题或有建议，请通过以下方式联系：

- 提交 [Issue](../../issues)
- 发送邮件至: [联系邮箱]
- 加入讨论群: [群号/链接]

---

**Ruby UI** - 让自动化操作更简单！
