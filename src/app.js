const { createApp } = Vue

// ImageMagick 批量裁剪应用
const app = createApp({
  data() {
    return {
      // 文件相关 - 现在使用FileManager管理
      fileManager: new FileManager(),
      currentImage: null,
      
      // 裁剪参数
      cropParams: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      },
      
      // 显示管理器
      displayManager: new ImageDisplayManager(),
      
      // 交互处理器
      interactionHandler: new CropInteractionHandler(),
      
      // 输出设置
      outputSuffix: '_cropped',
      
      // 处理状态
      isProcessing: false,
      progress: 0,
      progressText: '准备就绪',
      statusMessages: []
    }
  },
  
  computed: {
    // 便捷访问属性
    selectedFiles() {
      return this.fileManager.getFiles()
    },
    
    currentFileIndex() {
      return this.fileManager.getCurrentFileIndex()
    },
    
    displayWidth() {
      return this.displayManager.getDisplaySize().width
    },
    
    displayHeight() {
      return this.displayManager.getDisplaySize().height
    },
    
    imageScale() {
      return this.displayManager.getScale()
    },
    
    canStartCrop() {
      return this.selectedFiles.length > 0 && 
             this.cropParams.width > 0 && 
             this.cropParams.height > 0 && 
             !this.isProcessing
    },
    
    previewWrapperStyle() {
      if (!this.currentImage) return {}
      
      return {
        width: this.displayWidth + 'px',
        height: this.displayHeight + 'px'
      }
    },
    
    previewImageStyle() {
      if (!this.currentImage) return {}
      
      return {
        width: this.displayWidth + 'px',
        height: this.displayHeight + 'px'
      }
    },
    
    cropOverlayStyle() {
      return CropCalculator.calculateOverlayStyle(
        this.currentImage,
        this.displayWidth,
        this.displayHeight,
        this.cropParams
      )
    }
  },
  
  mounted() {
    console.log('ImageMagick 批量裁剪工具已启动')
    this.addStatusMessage('应用已启动，请选择图片文件', 'info')
    
    // 检查ImageMagick是否可用
    this.checkImageMagickAvailability()
    
    // 添加键盘快捷键
    document.addEventListener('keydown', this.handleKeyDown)
    
    // 防止拖拽文件到窗口
    this.preventDefaultDrop()
    
    // 监听后端进度更新
    this.setupIPCListeners()
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown)
  },
  
  methods: {
    // 文件选择处理
    async handleFileSelect(event) {
      const files = event.target.files
      if (!files || files.length === 0) return
      
      this.addStatusMessage(`选择了 ${files.length} 个文件`, 'info')
      
      try {
        const processedFiles = await this.fileManager.handleFileSelection(files)
        this.fileManager.setFiles(processedFiles)
        
        // 选择第一个文件
        if (processedFiles.length > 0) {
          this.selectFile(0)
        }
        
        this.addStatusMessage(`成功加载 ${processedFiles.length} 个图片文件`, 'success')
      } catch (error) {
        this.addStatusMessage(`文件处理失败: ${error.message}`, 'error')
      }
      
      // 清空文件输入
      event.target.value = ''
    },
    
    // 选择文件
    selectFile(index) {
      const selectedFile = this.fileManager.selectFile(index)
      if (selectedFile) {
        this.currentImage = selectedFile
        
        // 重置缩放
        this.displayManager.resetZoom()
        
        // 立即计算显示尺寸
        this.calculateDisplaySize()
        this.resetCropParams()
        
        // 强制更新显示
        this.$nextTick(() => {
          this.updateCropOverlay()
        })
        
        this.addStatusMessage(`切换到图片: ${this.currentImage.name}`, 'info')
      }
    },
    
    // 重置裁剪参数
    resetCropParams() {
      if (this.currentImage) {
        this.cropParams = CropCalculator.getDefaultCropParams(this.currentImage, 100)
      }
    },
    
    // 图片加载完成
    onImageLoad() {
      console.log('图片加载完成，开始计算尺寸...')
      
      // 确保容器已经渲染
      this.$nextTick(() => {
        this.calculateDisplaySize()
        
        // 如果还没有设置裁剪参数，则设置默认值
        if (this.cropParams.width <= 0 || this.cropParams.height <= 0) {
          this.resetCropParams()
        }
        
        // 再次确保覆盖层更新
        this.$nextTick(() => {
          this.updateCropOverlay()
          console.log('覆盖层已更新，显示尺寸:', this.displayWidth, 'x', this.displayHeight)
        })
      })
    },
    
    // 计算图片显示尺寸
    calculateDisplaySize() {
      if (!this.currentImage) {
        console.log('calculateDisplaySize: 没有当前图片')
        return
      }
      
      const container = this.$refs.previewContainer
      if (!container) {
        console.log('calculateDisplaySize: 容器未找到')
        return
      }
      
      const displaySize = this.displayManager.calculateDisplaySize(
        this.currentImage,
        container,
        this.displayManager.getScale()
      )
      
      this.displayManager.setDisplaySize(displaySize.width, displaySize.height)
    },
    
    // 开始裁剪拖拽
    startCrop(event) {
      if (!this.currentImage) return
      
      const wrapper = this.$refs.previewWrapper
      if (!wrapper) return
      
      const rect = wrapper.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // 使用CropCalculator转换坐标
      const originalCoords = CropCalculator.displayToOriginal(
        x, y, this.currentImage, this.displayWidth, this.displayHeight
      )
      
      this.cropParams.x = originalCoords.x
      this.cropParams.y = originalCoords.y
      
      // 暂时使用简单的拖拽逻辑
      this.interactionHandler.isDragging = true
      this.interactionHandler.dragStart = { 
        x: originalCoords.x, 
        y: originalCoords.y 
      }
      
      this.addStatusMessage(`开始选择裁剪区域: (${this.cropParams.x}, ${this.cropParams.y})`, 'info')
      
      event.preventDefault()
    },
    
    // 更新裁剪拖拽
    updateCrop(event) {
      if (!this.interactionHandler.isDragging || !this.currentImage) return
      
      const wrapper = this.$refs.previewWrapper
      if (!wrapper) return
      
      const rect = wrapper.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const currentCoords = CropCalculator.displayToOriginal(
        x, y, this.currentImage, this.displayWidth, this.displayHeight
      )
      
      // 计算裁剪框参数
      this.cropParams.x = Math.min(this.interactionHandler.dragStart.x, currentCoords.x)
      this.cropParams.y = Math.min(this.interactionHandler.dragStart.y, currentCoords.y)
      this.cropParams.width = Math.abs(currentCoords.x - this.interactionHandler.dragStart.x)
      this.cropParams.height = Math.abs(currentCoords.y - this.interactionHandler.dragStart.y)
      
      // 使用CropCalculator约束参数
      this.cropParams = CropCalculator.constrainCropParams(this.cropParams, this.currentImage)
      
      this.updateCropOverlay()
    },
    
    // 结束裁剪拖拽
    endCrop(event) {
      if (!this.interactionHandler.isDragging) return
      
      this.interactionHandler.isDragging = false
      
      // 确保最小尺寸
      if (this.cropParams.width < 10) this.cropParams.width = 10
      if (this.cropParams.height < 10) this.cropParams.height = 10
      
      // 最终约束检查
      this.cropParams = CropCalculator.constrainCropParams(this.cropParams, this.currentImage)
      
      this.addStatusMessage(
        `裁剪区域已设置: (${this.cropParams.x}, ${this.cropParams.y}) ${this.cropParams.width}×${this.cropParams.height}`, 
        'success'
      )
      
      this.updateCropOverlay()
    },
    
    // 更新裁剪覆盖层
    updateCropOverlay() {
      this.$nextTick(() => {
        // 强制更新计算属性
        console.log('更新裁剪覆盖层:', {
          displaySize: `${this.displayWidth}x${this.displayHeight}`,
          cropParams: this.cropParams,
          currentImage: this.currentImage ? `${this.currentImage.width}x${this.currentImage.height}` : 'null'
        })
        this.$forceUpdate()
      })
    },
    
    // 缩放控制功能
    zoomIn() {
      this.displayManager.zoom(1.2)
      this.calculateDisplaySize()
      this.updateCropOverlay()
    },
    
    zoomOut() {
      this.displayManager.zoom(1/1.2)
      this.calculateDisplaySize()
      this.updateCropOverlay()
    },
    
    resetZoom() {
      this.displayManager.resetZoom()
      this.calculateDisplaySize()
      this.updateCropOverlay()
    },
    
    fitToWindow() {
      this.displayManager.resetZoom()
      this.calculateDisplaySize()
      this.updateCropOverlay()
    },
    
    // 重置裁剪区域（公开方法）
    resetCropToCenter() {
      this.resetCropParams()
      this.updateCropOverlay()
      this.addStatusMessage('裁剪区域已重置到图片中心', 'info')
    },
    
    // 强制刷新显示（调试用）
    forceRefreshDisplay() {
      if (!this.currentImage) return
      
      console.log('强制刷新显示...')
      this.calculateDisplaySize()
      this.updateCropOverlay()
      
      // 多次尝试确保生效
      setTimeout(() => {
        this.calculateDisplaySize()
        this.updateCropOverlay()
      }, 100)
      
      setTimeout(() => {
        this.calculateDisplaySize()
        this.updateCropOverlay()
      }, 500)
    },
    
    // 开始批量裁剪
    async startBatchCrop() {
      if (!this.canStartCrop) return
      
      this.isProcessing = true
      this.progress = 0
      this.addStatusMessage('开始批量裁剪...', 'info')
      
      try {
        // 优先使用后端ImageMagick处理
        if (typeof require !== 'undefined') {
          await this.batchCropWithBackend()
        } else {
          await this.batchCropWithFrontend()
        }
        
      } catch (error) {
        this.addStatusMessage(`批量处理失败: ${error.message}`, 'error')
        console.error('Batch processing error:', error)
      } finally {
        this.isProcessing = false
      }
    },
    
    // 使用后端ImageMagick处理
    async batchCropWithBackend() {
      try {
        const { ipcRenderer } = require('electron')
        
        const files = this.selectedFiles.map(file => ({
          path: file.file ? file.file.path : file.path,
          name: file.name
        }))
        
        // 检查是否所有文件都有路径信息
        const filesWithoutPath = files.filter(f => !f.path)
        if (filesWithoutPath.length > 0) {
          this.addStatusMessage(`${filesWithoutPath.length} 个文件缺少路径信息，使用前端处理`, 'info')
          throw new Error('文件缺少路径信息')
        }
        
        const result = await ipcRenderer.invoke('batch-crop', {
          files: files,
          cropParams: this.cropParams,
          outputSuffix: this.outputSuffix
        })
        
        if (result.success) {
          this.progressText = '批量处理完成'
          this.addStatusMessage(`✓ 批量裁剪完成！共处理 ${result.results.length} 个文件`, 'success')
          
          // 显示结果详情
          result.results.forEach(res => {
            if (res.success) {
              this.addStatusMessage(`✓ 已保存: ${res.outputFile}`, 'success')
            } else {
              this.addStatusMessage(`✗ ${res.inputFile}: ${res.error}`, 'error')
            }
          })
        } else {
          throw new Error(result.error)
        }
        
      } catch (error) {
        console.log('后端处理失败，使用前端处理:', error)
        await this.batchCropWithFrontend()
      }
    },
    
    // 使用前端Canvas处理
    async batchCropWithFrontend() {
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i]
        this.progressText = `正在处理: ${file.name} (${i + 1}/${this.selectedFiles.length})`
        
        try {
          await this.cropSingleImage(file)
          // 获取输出路径信息
          const originalPath = file.file ? file.file.path : file.path
          if (originalPath) {
            const path = require('path')
            const parsedPath = path.parse(originalPath)
            const outputFileName = `${parsedPath.name}${this.outputSuffix}${parsedPath.ext}`
            const outputPath = path.join(parsedPath.dir, outputFileName)
            this.addStatusMessage(`✓ 已保存: ${outputPath}`, 'success')
          } else {
            this.addStatusMessage(`✓ 成功处理: ${file.name}`, 'success')
          }
        } catch (error) {
          this.addStatusMessage(`✗ 处理失败: ${file.name} - ${error.message}`, 'error')
          console.error('Crop error:', error)
        }
        
        this.progress = Math.round(((i + 1) / this.selectedFiles.length) * 100)
      }
      
      this.progressText = '批量处理完成'
      this.addStatusMessage(`✓ 批量裁剪完成！共处理 ${this.selectedFiles.length} 个文件`, 'success')
    },
    
    // 裁剪单个图片（前端Canvas处理）
    async cropSingleImage(fileData) {
      return new Promise((resolve, reject) => {
        // 如果在Electron环境中，尝试使用文件系统保存
        if (typeof require !== 'undefined') {
          this.cropSingleImageToFile(fileData).then(resolve).catch(reject)
          return
        }
        
        // 浏览器环境下载到默认下载目录
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const img = new Image()
        img.onload = () => {
          try {
            // 设置canvas尺寸
            canvas.width = this.cropParams.width
            canvas.height = this.cropParams.height
            
            // 裁剪图片
            ctx.drawImage(
              img,
              this.cropParams.x, this.cropParams.y, this.cropParams.width, this.cropParams.height,
              0, 0, this.cropParams.width, this.cropParams.height
            )
            
            // 转换为blob并下载
            canvas.toBlob((blob) => {
              if (blob) {
                this.downloadImage(blob, fileData.name)
                resolve()
              } else {
                reject(new Error('无法生成裁剪后的图片'))
              }
            }, 'image/png')
            
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = () => reject(new Error('无法加载图片'))
        img.src = fileData.url
      })
    },
    
    // 在Electron环境中将Canvas结果保存到文件系统
    async cropSingleImageToFile(fileData) {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const img = new Image()
        img.onload = async () => {
          try {
            // 设置canvas尺寸
            canvas.width = this.cropParams.width
            canvas.height = this.cropParams.height
            
            // 裁剪图片
            ctx.drawImage(
              img,
              this.cropParams.x, this.cropParams.y, this.cropParams.width, this.cropParams.height,
              0, 0, this.cropParams.width, this.cropParams.height
            )
            
            // 转换为buffer并保存到文件
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  await this.saveCanvasBlobToFile(blob, fileData)
                  resolve()
                } catch (error) {
                  reject(error)
                }
              } else {
                reject(new Error('无法生成裁剪后的图片'))
              }
            }, 'image/png')
            
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = () => reject(new Error('无法加载图片'))
        img.src = fileData.url
      })
    },
    
    // 保存Canvas Blob到文件系统
    async saveCanvasBlobToFile(blob, fileData) {
      try {
        const fs = require('fs').promises
        const path = require('path')
        const { dialog } = require('@electron/remote')
        
        // 生成输出文件路径
        const originalPath = fileData.file ? fileData.file.path : fileData.path
        
        let outputPath
        if (originalPath) {
          // 如果有原始路径，保存到同一目录
          const parsedPath = path.parse(originalPath)
          const outputFileName = `${parsedPath.name}${this.outputSuffix}${parsedPath.ext}`
          outputPath = path.join(parsedPath.dir, outputFileName)
        } else {
          // 如果没有原始路径，让用户选择保存位置
          const result = await dialog.showSaveDialog({
            title: '保存裁剪后的图片',
            defaultPath: `${fileData.name.split('.')[0]}${this.outputSuffix}.png`,
            filters: [
              { name: '图片文件', extensions: ['png', 'jpg', 'jpeg'] },
              { name: '所有文件', extensions: ['*'] }
            ]
          })
          
          if (result.canceled) {
            throw new Error('用户取消保存')
          }
          
          outputPath = result.filePath
        }
        
        // 将blob转换为buffer
        const arrayBuffer = await blob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // 写入文件
        await fs.writeFile(outputPath, buffer)
        
        console.log(`文件已保存: ${outputPath}`)
        
      } catch (error) {
        console.error('保存文件失败:', error)
        throw new Error(`保存文件失败: ${error.message}`)
      }
    },
    
    // 下载图片（浏览器环境）
    downloadImage(blob, originalName) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      
      // 生成新文件名
      const nameParts = originalName.split('.')
      const extension = nameParts.pop()
      const baseName = nameParts.join('.')
      const newName = `${baseName}${this.outputSuffix}.${extension}`
      
      a.href = url
      a.download = newName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // 清理URL
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
    
    // 清空所有文件
    clearAll() {
      this.fileManager.clearAll()
      this.currentImage = null
      this.progress = 0
      this.progressText = '准备就绪'
      this.statusMessages = []
      
      this.addStatusMessage('已清空所有文件', 'info')
    },
    
    // 添加状态消息
    addStatusMessage(text, type = 'info') {
      const message = {
        text: `[${new Date().toLocaleTimeString()}] ${text}`,
        type: type,
        timestamp: Date.now()
      }
      
      this.statusMessages.unshift(message)
      
      // 限制消息数量
      if (this.statusMessages.length > 50) {
        this.statusMessages = this.statusMessages.slice(0, 50)
      }
      
      // 自动滚动到顶部
      this.$nextTick(() => {
        const container = this.$refs.statusMessages
        if (container) {
          container.scrollTop = 0
        }
      })
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      return FileManager.formatFileSize(bytes)
    },
    
    // 检查ImageMagick可用性
    async checkImageMagickAvailability() {
      if (typeof require !== 'undefined') {
        try {
          // 在Electron环境中检查ImageMagick
          const { exec } = require('child_process')
          exec('magick -version', (error, stdout, stderr) => {
            if (error) {
              this.addStatusMessage('ImageMagick未安装或不可用，使用客户端处理', 'info')
            } else {
              this.addStatusMessage('ImageMagick已就绪', 'success')
            }
          })
        } catch (error) {
          this.addStatusMessage('使用客户端图片处理', 'info')
        }
      } else {
        this.addStatusMessage('使用客户端图片处理', 'info')
      }
    },
    
    // 键盘快捷键处理
    handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'o':
            event.preventDefault()
            document.getElementById('fileInput').click()
            break
          case 'Enter':
            event.preventDefault()
            if (this.canStartCrop) {
              this.startBatchCrop()
            }
            break
          case 'Delete':
          case 'Backspace':
            event.preventDefault()
            this.clearAll()
            break
        }
      }
      
      // 方向键调整裁剪参数
      if (this.currentImage && !event.ctrlKey && !event.metaKey) {
        const step = event.shiftKey ? 10 : 1
        let updated = false
        
        switch (event.key) {
          case 'ArrowLeft':
            this.cropParams.x = Math.max(0, this.cropParams.x - step)
            updated = true
            break
          case 'ArrowRight':
            this.cropParams.x = Math.min(this.currentImage.width - this.cropParams.width, this.cropParams.x + step)
            updated = true
            break
          case 'ArrowUp':
            this.cropParams.y = Math.max(0, this.cropParams.y - step)
            updated = true
            break
          case 'ArrowDown':
            this.cropParams.y = Math.min(this.currentImage.height - this.cropParams.height, this.cropParams.y + step)
            updated = true
            break
        }
        
        if (updated) {
          event.preventDefault()
          this.updateCropOverlay()
        }
      }
    },
    
    // 防止默认拖放行为
    preventDefaultDrop() {
      const preventDefault = (e) => {
        e.preventDefault()
        e.stopPropagation()
      }
      
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefault, false)
      })
    },
    
    // 使用原生文件对话框
    async useNativeFileDialog() {
      if (typeof require !== 'undefined') {
        try {
          const { ipcRenderer } = require('electron')
          const files = await ipcRenderer.invoke('select-files')
          
          if (files.length > 0) {
            this.addStatusMessage(`通过原生对话框选择了 ${files.length} 个文件`, 'info')
            
            // 转换文件格式
            for (const file of files) {
              const fileData = {
                file: { path: file.path },
                name: file.name,
                size: 0, // 原生选择的文件无法直接获取size
                url: `file://${file.path}`,
                width: file.width,
                height: file.height
              }
              
              this.selectedFiles.push(fileData)
            }
            
            // 选择第一个文件
            if (this.currentFileIndex === -1) {
              this.selectFile(0)
            }
          }
          
        } catch (error) {
          this.addStatusMessage(`原生文件选择失败: ${error.message}`, 'error')
          console.error('Native file dialog error:', error)
        }
      } else {
        this.addStatusMessage('原生文件对话框仅在Electron环境中可用', 'info')
        // 回退到web文件选择
        document.getElementById('fileInput').click()
      }
    },
    
    // 打开输出文件夹
    async openOutputFolder() {
      if (typeof require !== 'undefined') {
        try {
          const { shell } = require('electron')
          
          // 如果有选中的文件，打开该文件所在的文件夹
          if (this.currentImage) {
            const originalPath = this.currentImage.file ? this.currentImage.file.path : this.currentImage.path
            if (originalPath) {
              const path = require('path')
              const folderPath = path.dirname(originalPath)
              await shell.openPath(folderPath)
              this.addStatusMessage(`已打开文件夹: ${folderPath}`, 'info')
              return
            }
          }
          
          // 备用方案：打开默认输出文件夹
          const { ipcRenderer } = require('electron')
          await ipcRenderer.invoke('open-output-folder')
          this.addStatusMessage('已打开默认输出文件夹', 'info')
        } catch (error) {
          this.addStatusMessage(`打开文件夹失败: ${error.message}`, 'error')
        }
      } else {
        this.addStatusMessage('文件夹功能仅在Electron环境中可用', 'info')
      }
    },
    
    // 设置IPC监听器
    setupIPCListeners() {
      if (typeof require !== 'undefined') {
        try {
          const { ipcRenderer } = require('electron')
          
          // 监听裁剪进度
          ipcRenderer.on('crop-progress', (event, progress) => {
            this.progress = progress.progress
            this.progressText = `正在处理: ${progress.currentFile} (${progress.current}/${progress.total})`
          })
          
        } catch (error) {
          console.log('IPC监听器设置失败:', error)
        }
      }
    }
  }
})

// 挂载应用
app.mount('#app')

// 全局错误处理
window.addEventListener('error', (e) => {
  console.error('应用错误:', e.error)
})

// 页面加载完成
window.addEventListener('load', () => {
  console.log('批量图片裁剪工具加载完成')
})

// 性能监控
if (typeof performance !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0]
      console.log(`页面加载时间: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`)
    }, 0)
  })
}