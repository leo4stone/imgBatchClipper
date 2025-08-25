export default {
  // Application title and basic info
  app: {
    title: 'imgBatchClipper - Batch Image Cropping Tool',
    name: 'imgBatchClipper',
    subtitle: 'Batch Image Cropping Tool'
  },

  // File operations
  file: {
    selectButton: 'Select Image Files',
    nativeSelectButton: 'Native File Select',
    clearButton: 'Clear',
    removeButton: 'Remove this image',
    noFiles: 'No image files selected yet',
    supportedFormats: 'Supports JPG, PNG, GIF, BMP and other formats',
    dragHint: 'Drag images to be cropped to this area',
    dragSubHint: 'Multiple images supported',
    fileCount: 'Selected {count} files'
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
    processing: 'Processing...',
    cancel: 'Cancel Operation',
    continue: 'Continue (Dangerous)'
  },

  // Preview controls
  preview: {
    noImage: 'Please select image files first',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset',
    fitWindow: 'Fit to Window',
    forceRefresh: 'Force Refresh Display'
  },

  // Status messages
  status: {
    ready: 'Ready',
    appStarted: 'Application started, please select image files',
    imagemagickAvailable: 'ImageMagick available, will use high-quality backend processing',
    imagemagickUnavailable: 'ImageMagick unavailable, will use frontend Canvas processing',
    startingCrop: 'Starting batch crop...',
    cropComplete: '✓ Batch crop completed! Processed {count} files',
    cropFailed: 'Batch processing failed: {error}',
    switchToImage: 'Switched to image: {name}',
    cropReset: 'Crop area reset to image center',
    filesCleared: 'All files cleared',
    fileRemoved: 'File removed: {name}',
    directorySet: 'Output directory set to: {path}',
    directorySetToOriginal: 'Output directory set to original image folder',
    modeSwithToShared: 'Switched to unified crop mode, current crop parameters applied to all images',
    modeSwitchToIndividual: 'Switched to individual crop mode, each image will use independent crop parameters',
    userCancelled: 'User cancelled operation, batch crop not executed'
  },

  // Crop action status
  cropAction: {
    created: 'Selection area created',
    moved: 'Selection area moved',
    resized: 'Selection area resized',
    coordinates: '(${x}, ${y}) ${width}×${height}'
  },

  // Warnings and errors
  warning: {
    overwriteTitle: 'Dangerous Operation Warning',
    overwriteMessage: 'About to overwrite original files!',
    overwriteDetail: 'Current settings:\n• Output directory: Original image folder\n• File suffix: Empty\n\nThis will directly overwrite original image files, cannot be recovered!\n\nSuggestions:\n• Set file suffix (e.g: _cropped)\n• Or select another output directory',
    overwriteWebMessage: '⚠️ Dangerous Operation Warning!\n\nCurrent settings will directly overwrite original image files:\n• Output directory: Original image folder\n• File suffix: Empty\n\nOriginal files cannot be recovered after overwriting!\n\nIt is recommended to set file suffix or select another output directory.\n\nDo you want to continue?'
  },

  // Dialogs
  dialog: {
    selectDirectory: 'Select Output Directory',
    selectDirectoryButton: 'Select Directory',
    selectDirectoryFailed: 'Directory selection failed: {error}',
    directorySelectUnavailable: 'Directory selection is only available in Electron environment',
    folderOpenUnavailable: 'Folder function is only available in Electron environment',
    folderOpenFailed: 'Failed to open folder: {error}',
    nativeDialogUnavailable: 'Native file dialog is only available in Electron environment'
  },

  // File processing
  fileProcess: {
    added: 'Successfully added {count} files',
    duplicatesSkipped: 'Skipped {count} duplicate files',
    noValidFiles: 'No valid image files found',
    missingPathInfo: '{count} files missing path information, using frontend processing',
    processingFile: 'Processing: {name} ({current}/{total})',
    saved: '✓ Saved: {path}',
    saveSuccess: '✓ Successfully processed: {name}',
    saveFailed: '✗ Processing failed: {name} - {error}',
    folderOpened: 'Folder opened: {path}',
    folderOpenedOutput: 'Output folder opened: {path}',
    folderOpenedDefault: 'Default output folder opened'
  },

  // Keyboard shortcuts
  keyboard: {
    openFile: 'Ctrl+O Open File',
    startCrop: 'Enter Start Crop',
    clearFiles: 'Delete Clear Files',
    moveLeft: '← Move Left',
    moveRight: '→ Move Right',
    moveUp: '↑ Move Up',
    moveDown: '↓ Move Down',
    holdShift: 'Hold Shift for fast movement'
  },

  // Menu items
  menu: {
    file: 'File',
    edit: 'Edit',
    view: 'View',
    help: 'Help',
    open: 'Open',
    exit: 'Exit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    reload: 'Reload',
    forceReload: 'Force Reload',
    toggleDevTools: 'Toggle Developer Tools',
    resetZoom: 'Reset Zoom',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    toggleFullscreen: 'Toggle Fullscreen',
    about: 'About'
  }
}
