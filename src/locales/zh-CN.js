export default {
  // 应用标题和基本信息
  app: {
    title: 'imgBatchClipper - 图片批量裁剪工具',
    name: 'imgBatchClipper',
    subtitle: '图片批量裁剪工具'
  },

  // 文件操作
  file: {
    selectButton: '选择图片文件',
    nativeSelectButton: '原生文件选择',
    clearButton: '清空',
    removeButton: '移除此图片',
    noFiles: '还没有选择图片文件',
    supportedFormats: '支持 JPG, PNG, GIF, BMP 等格式',
    dragHint: '请将想要裁剪的图片拖拽到当前区域',
    dragSubHint: '支持多张图片同时拖拽',
    fileCount: '选择了 {count} 个文件'
  },

  // 裁剪参数
  crop: {
    title: '裁剪参数',
    mode: '裁剪模式',
    modeShared: '统一裁剪区域',
    modeIndividual: '独立裁剪区域',
    xCoord: 'X坐标',
    yCoord: 'Y坐标',
    width: '宽度',
    height: '高度',
    resetButton: '重置裁剪',
    resetTooltip: '重置裁剪区域'
  },

  // 输出设置
  output: {
    title: '输出设置',
    directory: '输出目录',
    directoryPlaceholder: '例如: ./ 或 /Users/xxx/Pictures/',
    directoryHint: '支持绝对路径 (/a/b/c) 或相对路径 (./a/b/c)，默认为 ./',
    suffix: '文件后缀',
    suffixPlaceholder: '例如: _cropped',
    setDirectory: '设置目录',
    openFolder: '打开输出文件夹',
    originalFolder: '原图片文件夹下',
    customFolder: '指定目录'
  },

  // 操作按钮
  action: {
    startCrop: '开始批量裁剪',
    processing: '处理中...',
    cancel: '取消操作',
    continue: '继续执行（危险）'
  },

  // 预览控制
  preview: {
    noImage: '请先选择图片文件',
    zoomIn: '放大',
    zoomOut: '缩小',
    resetZoom: '重置',
    fitWindow: '适应窗口',
    forceRefresh: '强制刷新显示'
  },

  // 状态消息
  status: {
    ready: '准备就绪',
    appStarted: '应用已启动，请选择图片文件',
    imagemagickAvailable: 'ImageMagick 可用，将使用高质量后端处理',
    imagemagickUnavailable: 'ImageMagick 不可用，将使用前端Canvas处理',
    startingCrop: '开始批量裁剪...',
    cropComplete: '✓ 批量裁剪完成！共处理 {count} 个文件',
    cropFailed: '批量处理失败: {error}',
    switchToImage: '切换到图片: {name}',
    cropReset: '裁剪区域已重置到图片中心',
    filesCleared: '已清空所有文件',
    fileRemoved: '已移除文件: {name}',
    directorySet: '输出目录已设置为: {path}',
    directorySetToOriginal: '输出目录已设置为原图片文件夹下',
    modeSwithToShared: '已切换到统一裁剪模式，当前裁剪参数已应用到所有图片',
    modeSwitchToIndividual: '已切换到独立裁剪模式，每个图片将使用独立的裁剪参数',
    userCancelled: '用户取消操作，未执行批量裁剪'
  },

  // 裁剪操作状态
  cropAction: {
    created: '选区创建完成',
    moved: '选区移动完成',
    resized: '选区调整完成',
    coordinates: '(${x}, ${y}) ${width}×${height}'
  },

  // 警告和错误
  warning: {
    overwriteTitle: '危险操作警告',
    overwriteMessage: '即将覆盖原文件！',
    overwriteDetail: '当前设置：\n• 输出目录：原图片文件夹\n• 文件后缀：空\n\n这将直接覆盖原始图片文件，无法恢复！\n\n建议：\n• 设置文件后缀（如：_cropped）\n• 或选择其他输出目录',
    overwriteWebMessage: '⚠️ 危险操作警告！\n\n当前设置将直接覆盖原始图片文件：\n• 输出目录：原图片文件夹\n• 文件后缀：空\n\n覆盖后原文件将无法恢复！\n\n建议设置文件后缀或选择其他输出目录。\n\n确定要继续吗？'
  },

  // 对话框
  dialog: {
    selectDirectory: '选择输出目录',
    selectDirectoryButton: '选择目录',
    selectDirectoryFailed: '选择目录失败: {error}',
    directorySelectUnavailable: '目录选择功能仅在Electron环境中可用',
    folderOpenUnavailable: '文件夹功能仅在Electron环境中可用',
    folderOpenFailed: '打开文件夹失败: {error}',
    nativeDialogUnavailable: '原生文件对话框仅在Electron环境中可用'
  },

  // 文件处理
  fileProcess: {
    added: '成功添加 {count} 个文件',
    duplicatesSkipped: '跳过 {count} 个重复文件',
    noValidFiles: '未找到有效的图片文件',
    missingPathInfo: '{count} 个文件缺少路径信息，使用前端处理',
    processingFile: '正在处理: {name} ({current}/{total})',
    saved: '✓ 已保存: {path}',
    saveSuccess: '✓ 成功处理: {name}',
    saveFailed: '✗ 处理失败: {name} - {error}',
    folderOpened: '已打开文件夹: {path}',
    folderOpenedOutput: '已打开输出文件夹: {path}',
    folderOpenedDefault: '已打开默认输出文件夹'
  },

  // 键盘快捷键提示
  keyboard: {
    openFile: 'Ctrl+O 打开文件',
    startCrop: 'Enter 开始裁剪',
    clearFiles: 'Delete 清空文件',
    moveLeft: '← 向左移动',
    moveRight: '→ 向右移动',
    moveUp: '↑ 向上移动',
    moveDown: '↓ 向下移动',
    holdShift: '按住Shift键快速移动'
  },

  // 菜单项
  menu: {
    file: '文件',
    edit: '编辑',
    view: '视图',
    help: '帮助',
    open: '打开',
    exit: '退出',
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    selectAll: '全选',
    reload: '重新加载',
    forceReload: '强制重新加载',
    toggleDevTools: '切换开发者工具',
    resetZoom: '重置缩放',
    zoomIn: '放大',
    zoomOut: '缩小',
    toggleFullscreen: '切换全屏',
    about: '关于'
  }
}
