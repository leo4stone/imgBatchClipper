const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const ImageProcessor = require('./imageProcessor')

// 初始化remote模块
require('@electron/remote/main').initialize()

// 保持对window对象的全局引用，避免被垃圾回收
let mainWindow
let imageProcessor

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'), // 可选的应用图标
    title: 'ImageMagick 批量图片裁剪工具'
  })

  // 加载应用的index.html
  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  // 启用remote模块for this window
  require('@electron/remote/main').enable(mainWindow.webContents)

  // 当窗口被关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 设置菜单栏
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            console.log('打开文件功能待实现')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '切换开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            console.log('关于信息功能待实现')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow)

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用程序及其菜单栏通常保持活动状态
  // 直到用户明确使用Cmd + Q退出
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时
  // 通常会在应用程序中重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 安全设置：阻止新窗口创建
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault()
    console.log('阻止创建新窗口:', url)
  })
})

// 当应用准备好时初始化ImageProcessor
app.whenReady().then(() => {
  imageProcessor = new ImageProcessor()
  
  // 设置进度回调
  imageProcessor.setProgressCallback((progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('crop-progress', progress)
    }
  })
})

// IPC通信处理
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  })
  
  if (!result.canceled) {
    const files = []
    for (const filePath of result.filePaths) {
      try {
        const imageInfo = await imageProcessor.getImageInfo(filePath)
        files.push({
          path: filePath,
          name: path.basename(filePath),
          ...imageInfo
        })
      } catch (error) {
        console.error(`获取图片信息失败 ${filePath}:`, error)
      }
    }
    return files
  }
  
  return []
})

ipcMain.handle('batch-crop', async (event, { files, cropParams, outputSuffix }) => {
  try {
    const results = await imageProcessor.batchCropImages(files, cropParams, outputSuffix)
    return { success: true, results }
  } catch (error) {
    console.error('批量裁剪失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-image-info', async (event, filePath) => {
  try {
    const info = await imageProcessor.getImageInfo(filePath)
    return { success: true, info }
  } catch (error) {
    console.error('获取图片信息失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('open-output-folder', async () => {
  const outputDir = imageProcessor.getOutputDirectory()
  const { shell } = require('electron')
  shell.openPath(outputDir)
})

ipcMain.handle('cleanup-temp', async () => {
  try {
    await imageProcessor.cleanupTempFiles()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
