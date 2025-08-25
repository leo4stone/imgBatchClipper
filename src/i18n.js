// 使用全局引入的Vue I18n
const { createI18n } = VueI18n

// 获取用户的语言偏好
function getLocale() {
  // 优先从localStorage获取用户设置
  const saved = localStorage.getItem('imgBatchClipper-locale')
  if (saved && ['zh-CN', 'en-US'].includes(saved)) {
    return saved
  }
  
  // 然后从浏览器语言判断
  const browserLang = navigator.language || navigator.userLanguage
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  
  // 默认使用中文
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': {
      // 应用标题和基本信息
      app: {
        title: 'imgBatchClipper - 图片批量裁剪工具',
        name: 'imgBatchClipper',
        subtitle: '图片批量裁剪工具'
      },
      // 文件操作
      file: {
        selectButton: '选择图片文件',
        clearButton: '清空',
        removeButton: '移除此图片',
        removeTooltip: '移除此图片',
        noFiles: '还没有选择图片文件',
        supportedFormats: '支持 JPG, PNG, GIF, BMP 等格式',
        dragHint: '请将想要裁剪的图片拖拽到当前区域',
        dragSubHint: '支持多张图片同时拖拽'
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
        processing: '处理中...'
      },
      // 预览控制
      preview: {
        noImage: '请先选择图片文件',
        instruction: '图片将在这里显示，您可以通过拖拽设置裁剪区域'
      },
      // 缩放控制
      zoom: {
        zoomOut: '缩小',
        zoomIn: '放大', 
        reset: '重置',
        fitWindow: '适应窗口'
      },
      // 调试功能
      debug: {
        forceRefresh: '强制刷新显示'
      },
      // 进度显示
      progress: {
        title: '处理进度'
      },
      // 拖拽提示
      drag: {
        instruction: '请将想要裁剪的图片拖拽到当前区域',
        multiple: '支持多张图片同时拖拽'
      },
      // 警告对话框
      warning: {
        dangerousOperation: '危险操作警告',
        willOverwriteOriginal: '即将覆盖原文件！',
        overwriteDetail: '当前设置：\n• 输出目录：原图片文件夹\n• 文件后缀：空\n\n这将直接覆盖原始图片文件，无法恢复！\n\n建议：\n• 设置文件后缀（如：_cropped）\n• 或选择其他输出目录',
        cancelOperation: '取消操作',
        continueAnyway: '继续执行（危险）',
        browserWarning: '⚠️ 危险操作警告！\n\n当前设置将直接覆盖原始图片文件：\n• 输出目录：原图片文件夹\n• 文件后缀：空\n\n覆盖后原文件将无法恢复！\n\n建议设置文件后缀或选择其他输出目录。\n\n确定要继续吗？'
      },
      // 操作提示
      interaction: {
        createCrop: '创建新选区',
        moveCrop: '移动选区',
        resizeCrop: '调整选区大小 ({handle})',
        startOperation: '开始操作',
        cropCreated: '选区创建完成',
        cropMoved: '选区移动完成',
        cropResized: '选区调整完成'
      },
      // 文件对话框
      dialog: {
        selectOutputDir: '选择输出目录',
        selectDirectory: '选择目录',
        saveImage: '保存裁剪后的图片',
        imageFiles: '图片文件',
        allFiles: '所有文件',
        userCancelledSave: '用户取消保存'
      },
      // 状态消息
      status: {
        ready: '准备就绪',
        languageChanged: '语言已切换为 {language}',
        appStarted: '应用已启动，请选择图片文件',
        processing: '正在处理 {count} 个文件...',
        filesAdded: '成功添加 {count} 个图片',
        duplicatesSkipped: '跳过 {count} 个重复文件',
        noValidFiles: '未找到有效的图片文件',
        fileProcessError: '文件处理失败: {error}',
        switchedToImage: '切换到图片: {name}',
        cropModeSharedEnabled: '已切换到统一裁剪模式，当前裁剪参数已应用到所有图片',
        cropModeIndividualEnabled: '已切换到独立裁剪模式，每个图片将使用独立的裁剪参数',
        userCancelled: '用户取消操作，未执行批量裁剪',
        batchCropStarted: '开始批量裁剪...',
        batchProcessError: '批量处理失败: {error}',
        missingFilePaths: '{count} 个文件缺少路径信息，使用前端处理',
        batchCompleted: '✓ 批量裁剪完成！共处理 {count} 个文件',
        fileSaved: '✓ 已保存: {file}',
        fileProcessed: '✓ 成功处理: {name}',
        fileProcessFailed: '✗ 处理失败: {name} - {error}',
        allFilesCleared: '已清空所有文件',
        imageMagickNotAvailable: 'ImageMagick未安装或不可用，使用客户端处理',
        imageMagickReady: 'ImageMagick已就绪',
        clientProcessing: '使用客户端图片处理',
        outputDirSetToOriginal: '输出目录已设置为原图片文件夹下',
        outputDirSet: '输出目录已设置为: {dir}',
        dirSelectError: '选择目录失败: {error}',
        electronOnlyFeature: '目录选择功能仅在Electron环境中可用',
        nativeDialogFiles: '通过原生对话框选择了 {count} 个文件',
        nativeDialogError: '原生文件选择失败: {error}',
        nativeDialogElectronOnly: '原生文件对话框仅在Electron环境中可用',
        outputFolderOpened: '已打开输出文件夹: {path}',
        openFolderError: '打开文件夹失败: {error}',
        folderFeatureElectronOnly: '文件夹功能仅在Electron环境中可用',
        cropAreaReset: '裁剪区域已重置到图片中心'
      },
    },
    'en-US': {
      // Application title and basic info
      app: {
        title: 'imgBatchClipper - Batch Image Cropping Tool',
        name: 'imgBatchClipper',
        subtitle: 'Batch Image Cropping Tool'
      },
      // File operations
      file: {
        selectButton: 'Select Image Files',
        clearButton: 'Clear',
        removeButton: 'Remove this image',
        removeTooltip: 'Remove this image',
        noFiles: 'No image files selected yet',
        supportedFormats: 'Supports JPG, PNG, GIF, BMP and other formats',
        dragHint: 'Drag images to be cropped to this area',
        dragSubHint: 'Multiple images supported'
      },
      // Crop parameters
      crop: {
        title: 'Crop Parameters',
        mode: 'Crop Mode',
        modeShared: 'Unified Crop Area',
        modeIndividual: 'Individual Crop Area',
        xCoord: 'X Coordinate',
        yCoord: 'Y Coordinate',
        width: 'Width',
        height: 'Height',
        resetButton: 'Reset Crop',
        resetTooltip: 'Reset Crop Area'
      },
      // Output settings
      output: {
        title: 'Output Settings',
        directory: 'Output Directory',
        directoryPlaceholder: 'e.g: ./ or /Users/xxx/Pictures/',
        directoryHint: 'Supports absolute path (/a/b/c) or relative path (./a/b/c), default is ./',
        suffix: 'File Suffix',
        suffixPlaceholder: 'e.g: _cropped',
        setDirectory: 'Set Directory',
        openFolder: 'Open Output Folder',
        originalFolder: 'Original Image Folder',
        customFolder: 'Custom Directory'
      },
      // Action buttons
      action: {
        startCrop: 'Start Batch Crop',
        processing: 'Processing...'
      },
      // Preview controls
      preview: {
        noImage: 'Please select image files first',
        instruction: 'Images will be displayed here, you can drag to set crop area'
      },
      // Zoom controls
      zoom: {
        zoomOut: 'Zoom Out',
        zoomIn: 'Zoom In',
        reset: 'Reset',
        fitWindow: 'Fit Window'
      },
      // Debug features
      debug: {
        forceRefresh: 'Force Refresh Display'
      },
      // Progress display
      progress: {
        title: 'Processing Progress'
      },
      // Drag hints
      drag: {
        instruction: 'Please drag images to crop to this area',
        multiple: 'Multiple images drag supported'
      },
      // Warning dialogs
      warning: {
        dangerousOperation: 'Dangerous Operation Warning',
        willOverwriteOriginal: 'About to overwrite original files!',
        overwriteDetail: 'Current settings:\n• Output directory: Original image folder\n• File suffix: Empty\n\nThis will directly overwrite original image files and cannot be recovered!\n\nRecommendations:\n• Set file suffix (e.g., _cropped)\n• Or select another output directory',
        cancelOperation: 'Cancel Operation',
        continueAnyway: 'Continue Anyway (Dangerous)',
        browserWarning: '⚠️ Dangerous Operation Warning!\n\nCurrent settings will directly overwrite original image files:\n• Output directory: Original image folder\n• File suffix: Empty\n\nOriginal files cannot be recovered after overwriting!\n\nRecommend setting file suffix or selecting another output directory.\n\nAre you sure to continue?'
      },
      // Interaction hints
      interaction: {
        createCrop: 'Create new crop area',
        moveCrop: 'Move crop area',
        resizeCrop: 'Resize crop area ({handle})',
        startOperation: 'Start operation',
        cropCreated: 'Crop area created',
        cropMoved: 'Crop area moved',
        cropResized: 'Crop area resized'
      },
      // File dialogs
      dialog: {
        selectOutputDir: 'Select Output Directory',
        selectDirectory: 'Select Directory',
        saveImage: 'Save Cropped Image',
        imageFiles: 'Image Files',
        allFiles: 'All Files',
        userCancelledSave: 'User cancelled save'
      },
      // Status messages
      status: {
        ready: 'Ready',
        languageChanged: 'Language switched to {language}',
        appStarted: 'Application started, please select image files',
        processing: 'Processing {count} files...',
        filesAdded: 'Successfully added {count} images',
        duplicatesSkipped: 'Skipped {count} duplicate files',
        noValidFiles: 'No valid image files found',
        fileProcessError: 'File processing failed: {error}',
        switchedToImage: 'Switched to image: {name}',
        cropModeSharedEnabled: 'Switched to shared crop mode, current crop parameters applied to all images',
        cropModeIndividualEnabled: 'Switched to individual crop mode, each image will use independent crop parameters',
        userCancelled: 'User cancelled operation, batch crop not executed',
        batchCropStarted: 'Starting batch crop...',
        batchProcessError: 'Batch processing failed: {error}',
        missingFilePaths: '{count} files missing path information, using frontend processing',
        batchCompleted: '✓ Batch crop completed! Processed {count} files',
        fileSaved: '✓ Saved: {file}',
        fileProcessed: '✓ Successfully processed: {name}',
        fileProcessFailed: '✗ Processing failed: {name} - {error}',
        allFilesCleared: 'All files cleared',
        imageMagickNotAvailable: 'ImageMagick not installed or unavailable, using client-side processing',
        imageMagickReady: 'ImageMagick ready',
        clientProcessing: 'Using client-side image processing',
        outputDirSetToOriginal: 'Output directory set to original image folder',
        outputDirSet: 'Output directory set to: {dir}',
        dirSelectError: 'Directory selection failed: {error}',
        electronOnlyFeature: 'Directory selection feature only available in Electron environment',
        nativeDialogFiles: 'Selected {count} files through native dialog',
        nativeDialogError: 'Native file selection failed: {error}',
        nativeDialogElectronOnly: 'Native file dialog only available in Electron environment',
        outputFolderOpened: 'Output folder opened: {path}',
        openFolderError: 'Failed to open folder: {error}',
        folderFeatureElectronOnly: 'Folder feature only available in Electron environment',
        cropAreaReset: 'Crop area reset to image center'
      },
    }
  }
})

// 语言切换方法
function switchLanguage(locale) {
  if (['zh-CN', 'en-US'].includes(locale)) {
    i18n.global.locale.value = locale
    localStorage.setItem('imgBatchClipper-locale', locale)
    console.log('语言已切换到:', locale)
  }
}

// 获取当前语言
function getCurrentLanguage() {
  return i18n.global.locale.value
}

// 获取语言列表
function getAvailableLanguages() {
  return [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ]
}

// 全局暴露i18n实例和方法
window.i18n = i18n
window.switchLanguage = switchLanguage
window.getCurrentLanguage = getCurrentLanguage
window.getAvailableLanguages = getAvailableLanguages
