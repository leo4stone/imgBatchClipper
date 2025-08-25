# imgBatchClipper 应用图标

本目录包含为 imgBatchClipper 应用生成的各种规格图标文件。

## 图标文件说明

### PNG 格式图标
- `icon-16.png` - 16×16像素，系统托盘、小图标
- `icon-32.png` - 32×32像素，文件关联图标
- `icon-48.png` - 48×48像素，Windows 任务栏
- `icon-64.png` - 64×64像素，Windows 大图标
- `icon-72.png` - 72×72像素，Android LDPI
- `icon-96.png` - 96×96像素，Android MDPI
- `icon-128.png` - 128×128像素，macOS Dock，Chrome 扩展
- `icon-144.png` - 144×144像素，Android HDPI
- `icon-192.png` - 192×192像素，Android XHDPI，PWA
- `icon-256.png` - 256×256像素，macOS 大图标，Windows 高分辨率
- `icon-512.png` - 512×512像素，macOS Retina，Linux 应用图标
- `icon-1024.png` - 1024×1024像素，App Store，最高质量图标

### 平台特定格式
- `icon.icns` - macOS 原生图标格式（包含多种尺寸）
- `icon.ico` - Windows 原生图标格式（包含多种尺寸）

## 使用场景

### Electron 应用
- 应用窗口图标：`icon-256.png`
- 应用打包图标：`icon.icns` (macOS)、`icon.ico` (Windows)、`icon-512.png` (Linux)

### 应用商店
- Mac App Store：`icon-1024.png`
- Microsoft Store：`icon-512.png`
- Linux 软件中心：`icon-512.png`

### Web 应用
- Favicon：`icon-32.png`、`icon-16.png`
- PWA 图标：`icon-192.png`、`icon-512.png`

### 移动应用
- iOS App：需要额外生成 iOS 特定尺寸
- Android App：`icon-72.png`、`icon-96.png`、`icon-144.png`、`icon-192.png`

## 技术规范

- **源图片**：840×840像素 PNG，24位颜色+Alpha通道
- **缩放算法**：ImageMagick Lanczos 滤镜，保证最佳质量
- **格式**：PNG（透明背景支持）、ICNS（macOS）、ICO（Windows）
- **颜色空间**：sRGB

## 图标设计特点

- 🎨 现代扁平化设计风格
- ✂️ 裁剪工具主题，清晰辨识
- 📱 多平台兼容，在各种尺寸下保持清晰
- 🔍 高对比度设计，适合深色和浅色主题

## 更新图标

如需更新图标，请：
1. 修改源文件 `logo.png`（建议使用 1024×1024 或更高分辨率）
2. 运行图标生成脚本重新生成所有尺寸
3. 确保在各种背景下测试图标的可见性

---
生成时间：$(date)
工具：ImageMagick + macOS iconutil
