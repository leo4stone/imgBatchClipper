const { createApp } = Vue

// imgBatchClipper 图片批量裁剪应用
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
      
      // 裁剪模式：'shared' | 'individual'
      cropMode: 'shared',
      
      // 显示管理器
      displayManager: new ImageDisplayManager(),
      
      // 交互处理器
      interactionHandler: new CropInteractionHandler(),
      
      // transform状态
      transformState: {
        scale: 1,
        originX: 50,
        originY: 50,
        translateX: 0,
        translateY: 0,
        transformStyle: 'scale(1)',
        transformOriginStyle: '50% 50%'
      },
      
      // 输出设置
      outputSuffix: '_cropped',
      outputDirectory: './',
      
      // 处理状态
      isProcessing: false,
      progress: 0,
      progressText: '',
      statusMessages: [],
      
      // 拖拽状态
      isDragOver: false,
      
      // 目录设置菜单状态
      showDirectoryMenu: false,
      
      // 语言切换菜单状态
      showLanguageMenu: false
    }
  },
  
  computed: {
    // 便捷访问属性
    selectedFiles() {
      return this.fileManager.getFiles()
    },
    
    // 判断输出目录是否为绝对路径
    isAbsolutePath() {
      if (!this.outputDirectory) {
        return false
      }
      
      // 在Node.js环境中使用path模块判断
      if (typeof require !== 'undefined') {
        const path = require('path')
        return path.isAbsolute(this.outputDirectory)
      }
      
      // 浏览器环境的简单判断
      return this.outputDirectory.startsWith('/') || 
             this.outputDirectory.match(/^[A-Za-z]:[\\\/]/) // Windows路径
    },
    
    // 获取当前语言信息
    currentLanguage() {
      const currentCode = window.getCurrentLanguage()
      const languages = window.getAvailableLanguages()
      return languages.find(lang => lang.code === currentCode) || languages[0]
    },
    
    // 获取可用语言列表
    availableLanguages() {
      return window.getAvailableLanguages()
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
      return this.transformState.scale
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
        height: this.displayHeight + 'px',
        transform: this.transformState.transformStyle,
        transformOrigin: this.transformState.transformOriginStyle,
        transition: 'none' // 禁用过渡动画以获得流畅的滚轮缩放
      }
    },
    
    cropOverlayStyle() {
      return CropCalculator.calculateOverlayStyleWithTransform(
        this.currentImage,
        this.displayWidth,
        this.displayHeight,
        this.cropParams,
        this.transformState
      )
    }
  },
  
  mounted() {
    console.log('imgBatchClipper 图片批量裁剪工具已启动')
    this.addStatusMessage(this.$t('status.appStarted'), 'info')
    this.updatePageTitle()
    this.progressText = this.$t('status.ready')
    
    // 检查ImageMagick是否可用
    this.checkImageMagickAvailability()
    
    // 添加键盘快捷键
    document.addEventListener('keydown', this.handleKeyDown)
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (this.showDirectoryMenu) {
        this.showDirectoryMenu = false
      }
      if (this.showLanguageMenu) {
        this.showLanguageMenu = false
      }
    })
    
    // 设置拖拽功能
    this.setupDragAndDrop()
    
    // 监听后端进度更新
    this.setupIPCListeners()
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown)
  },
  
  methods: {
    // 更新页面标题
    updatePageTitle() {
      document.title = this.$t('app.title')
    },
    
    // 文件选择处理
    async handleFileSelect(event) {
      const files = event.target.files
      if (!files || files.length === 0) return
      
      await this.handleFileAddition(files)
      
      // 清空文件输入
      event.target.value = ''
    },
    
    // 通用的文件添加逻辑（按钮和拖拽共用）
    async handleFileAddition(files) {
      if (!files || files.length === 0) return
      
      this.addStatusMessage(this.$t('status.processing', { count: files.length }), 'info')
      
      try {
        const result = await this.fileManager.handleFileAddition(files)
        const { addResult, totalFiles } = result
        
        // 显示添加结果
        if (addResult.added > 0) {
          this.addStatusMessage(this.$t('status.filesAdded', { count: addResult.added }), 'success')
          
          // 如果之前没有选中文件，选择第一个新添加的文件
          if (this.currentFileIndex === -1 && totalFiles > 0) {
            this.selectFile(totalFiles - addResult.added) // 选择第一个新添加的文件
          }
        }
        
        if (addResult.duplicates > 0) {
          this.addStatusMessage(this.$t('status.duplicatesSkipped', { count: addResult.duplicates }), 'info')
        }
        
        if (addResult.added === 0 && addResult.duplicates === 0) {
          this.addStatusMessage(this.$t('status.noValidFiles'), 'warning')
        }
        
      } catch (error) {
        this.addStatusMessage(this.$t('status.fileProcessError', { error: error.message }), 'error')
      }
    },
    
    // 选择文件
    selectFile(index) {
      const selectedFile = this.fileManager.selectFile(index)
      if (selectedFile) {
        this.currentImage = selectedFile
        
        // 重置缩放和transform
        this.displayManager.resetZoom()
        this.transformState = this.displayManager.resetTransform()
        
        // 立即计算显示尺寸
        this.calculateDisplaySize()
        
        // 根据裁剪模式决定是否初始化裁剪参数
        this.initializeCropParams()
        
        // 强制更新显示
        this.$nextTick(() => {
          this.updateCropOverlay()
        })
        
        this.addStatusMessage(this.$t('status.switchedToImage', { name: this.currentImage.name }), 'info')
      }
    },
    
    // 初始化裁剪参数（根据模式）
    initializeCropParams() {
      if (!this.currentImage) return
      
      if (this.cropMode === 'shared') {
        // 统一裁剪模式：使用全局cropParams
        // 如果当前文件没有裁剪参数，或第一次设置，初始化为默认值
        if (!this.currentImage.cropParams || 
            (this.currentImage.cropParams.width === 100 && this.currentImage.cropParams.height === 100)) {
          this.resetCropParams()
          // 同步到当前文件
          this.fileManager.updateCurrentFileCropParams(this.cropParams)
        } else {
          // 使用文件的现有裁剪参数
          this.cropParams = { ...this.currentImage.cropParams }
        }
      } else {
        // 独立裁剪模式：使用文件独立的裁剪参数
        if (!this.currentImage.cropParams || 
            (this.currentImage.cropParams.width === 100 && this.currentImage.cropParams.height === 100)) {
          // 如果文件没有设置过，初始化为默认值
          this.fileManager.initializeFileCropParams(this.currentImage, 100)
        }
        // 加载文件的裁剪参数到界面
        this.cropParams = { ...this.currentImage.cropParams }
      }
    },
    
    // 重置裁剪参数
    resetCropParams() {
      if (this.currentImage) {
        this.cropParams = CropCalculator.getDefaultCropParams(this.currentImage, 100)
      }
    },
    
    // 裁剪模式切换
    onCropModeChange() {
      console.log('裁剪模式切换到:', this.cropMode)
      
      if (this.cropMode === 'shared') {
        // 切换到统一模式：将当前图片的裁剪参数应用到所有图片
        if (this.currentImage) {
          this.fileManager.updateAllFilesCropParams(this.cropParams)
          this.addStatusMessage(this.$t('status.cropModeSharedEnabled'), 'info')
        }
      } else {
        // 切换到独立模式：确保当前图片有自己的裁剪参数
        if (this.currentImage) {
          this.fileManager.updateCurrentFileCropParams(this.cropParams)
          this.addStatusMessage(this.$t('status.cropModeIndividualEnabled'), 'info')
        }
      }
    },
    
    // 更新裁剪参数（根据模式）
    updateCropParams(newCropParams) {
      this.cropParams = newCropParams
      
      if (this.cropMode === 'shared') {
        // 统一模式：更新所有文件的裁剪参数
        this.fileManager.updateAllFilesCropParams(newCropParams)
      } else {
        // 独立模式：只更新当前文件的裁剪参数
        this.fileManager.updateCurrentFileCropParams(newCropParams)
      }
    },
    
    // 检查是否会覆盖原文件
    checkWillOverwriteOriginal() {
      // 判断条件：
      // 1. 输出目录为相对路径 "./" 或空
      // 2. 文件后缀为空
      const outputDirIsCurrentDir = !this.outputDirectory || 
                                   this.outputDirectory.trim() === '' ||
                                   this.outputDirectory.trim() === './' ||
                                   this.outputDirectory.trim() === '.'
      
      const suffixIsEmpty = !this.outputSuffix || this.outputSuffix.trim() === ''
      
      return outputDirIsCurrentDir && suffixIsEmpty
    },
    
    // 显示覆盖原文件警告
    async showOverwriteWarning() {
      if (typeof require !== 'undefined') {
        try {
          const { dialog } = require('electron').remote || require('@electron/remote')
          
          const result = await dialog.showMessageBox({
            type: 'warning',
            title: this.$t('warning.dangerousOperation'),
            message: this.$t('warning.willOverwriteOriginal'),
            detail: this.$t('warning.overwriteDetail'),
            buttons: [this.$t('warning.cancelOperation'), this.$t('warning.continueAnyway')],
            defaultId: 0,
            cancelId: 0,
            icon: 'warning'
          })
          
          return result.response === 1 // 用户选择"继续执行"
        } catch (error) {
          console.error('弹窗显示失败:', error)
          // 如果弹窗失败，默认为取消操作
          return false
        }
      } else {
        // 浏览器环境，使用confirm
        return confirm(this.$t('warning.browserWarning'))
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
    
    // 统一的预览区域鼠标事件处理
    handlePreviewMouseDown(event) {
      if (!this.currentImage) return
      
      const wrapper = this.$refs.previewWrapper
      if (!wrapper) return
      
      const rect = wrapper.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // 首先检查是否点击了调整手柄
      let interactionInfo = null
      if (event.target && event.target.classList.contains('crop-handle')) {
        const handle = event.target.getAttribute('data-handle')
        interactionInfo = {
          zone: 'resize',
          handle: handle,
          cursor: this.interactionHandler.getCursorForHandle(handle)
        }
        console.log('直接点击手柄:', handle)
      } else {
        // 否则通过位置检测交互区域（考虑transform）
        interactionInfo = this.interactionHandler.detectInteractionZoneWithTransform(
          x, y, this.cropParams, this.currentImage, this.displayWidth, this.displayHeight, this.transformState
        )
      }
      
      console.log('检测到交互区域:', interactionInfo)
      
      // 开始相应的交互（考虑transform）
      this.interactionHandler.startDragWithTransform(
        interactionInfo, x, y, this.cropParams, 
        this.currentImage, this.displayWidth, this.displayHeight, this.transformState
      )
      
      // 设置鼠标样式
      wrapper.style.cursor = interactionInfo.cursor
      
      const actionText = {
        'create': this.$t('interaction.createCrop'),
        'move': this.$t('interaction.moveCrop'),
        'resize': this.$t('interaction.resizeCrop', { handle: interactionInfo.handle })
      }
      
      this.addStatusMessage(actionText[interactionInfo.zone] || this.$t('interaction.startOperation'), 'info')
      
      event.preventDefault()
    },
    
    handlePreviewMouseMove(event) {
      if (!this.currentImage) return
      
      const wrapper = this.$refs.previewWrapper
      if (!wrapper) return
      
      const rect = wrapper.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      if (this.interactionHandler.isDraggingActive()) {
        // 正在拖拽，更新操作（考虑transform）
        const newCropParams = this.interactionHandler.updateDragWithTransform(
          x, y, this.currentImage, this.displayWidth, this.displayHeight, this.transformState
        )
        
        if (newCropParams) {
          this.updateCropParams(newCropParams)
          this.updateCropOverlay()
        }
              } else {
          // 悬停状态，更新鼠标样式
          let interactionInfo = null
          if (event.target && event.target.classList.contains('crop-handle')) {
            const handle = event.target.getAttribute('data-handle')
            interactionInfo = {
              zone: 'resize',
              handle: handle,
              cursor: this.interactionHandler.getCursorForHandle(handle)
            }
          } else {
            interactionInfo = this.interactionHandler.detectInteractionZoneWithTransform(
              x, y, this.cropParams, this.currentImage, this.displayWidth, this.displayHeight, this.transformState
            )
          }
          
          wrapper.style.cursor = interactionInfo.cursor
        }
    },
    
    handlePreviewMouseUp(event) {
      if (!this.interactionHandler.isDraggingActive()) return
      
      const mode = this.interactionHandler.getInteractionMode()
      this.interactionHandler.endDrag()
      
      // 确保最小尺寸
      if (this.cropParams.width < 10) this.cropParams.width = 10
      if (this.cropParams.height < 10) this.cropParams.height = 10
      
      // 最终约束检查
      const constrainedParams = CropCalculator.constrainCropParams(this.cropParams, this.currentImage)
      this.updateCropParams(constrainedParams)
      
      const actionText = {
        'create': this.$t('interaction.cropCreated'),
        'move': this.$t('interaction.cropMoved'),
        'resize': this.$t('interaction.cropResized')
      }
      
      this.addStatusMessage(
        `${actionText[mode]}: (${this.cropParams.x}, ${this.cropParams.y}) ${this.cropParams.width}×${this.cropParams.height}`, 
        'success'
      )
      
      this.updateCropOverlay()
      
      // 重置鼠标样式
      const wrapper = this.$refs.previewWrapper
      if (wrapper) {
        wrapper.style.cursor = 'crosshair'
      }
    },
    
    handlePreviewMouseLeave(event) {
      if (this.interactionHandler.isDraggingActive()) {
        this.handlePreviewMouseUp(event)
      }
    },
    
    // 裁剪区域鼠标按下事件（移动操作）
    handleCropMouseDown(event) {
      // 这个事件会冒泡到父级，由handlePreviewMouseDown处理
      // 这里只是为了确保事件正确传递
    },
    
    // 调整手柄鼠标按下事件
    handleResizeStart(event, handle) {
      // 事件会被 @mousedown.stop 阻止冒泡
      // 手柄的resize操作会在detectInteractionZone中检测到
      console.log('调整手柄被点击:', handle)
    },
    
    // 滚轮缩放事件处理
    handleWheel(event) {
      if (!this.currentImage) return
      
      event.preventDefault()
      
      const wrapper = this.$refs.previewWrapper
      if (!wrapper) return
      
      const rect = wrapper.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // 计算缩放因子，向上滚动放大，向下滚动缩小
      const scaleFactor = event.deltaY < 0 ? 1.1 : 1/1.1
      
      // 执行以鼠标位置为中心的缩放
      this.transformState = this.displayManager.wheelZoomAtPoint(
        scaleFactor, 
        mouseX, 
        mouseY, 
        wrapper.clientWidth, 
        wrapper.clientHeight
      )
      
      // 更新裁剪覆盖层
      this.updateCropOverlay()
      
      console.log('滚轮缩放完成:', {
        scale: this.transformState.scale,
        origin: `${this.transformState.originX}% ${this.transformState.originY}%`,
        mouse: { x: mouseX, y: mouseY }
      })
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
      this.transformState = this.displayManager.buttonZoom(1.2)
      this.updateCropOverlay()
    },
    
    zoomOut() {
      this.transformState = this.displayManager.buttonZoom(1/1.2)
      this.updateCropOverlay()
    },
    
    resetZoom() {
      this.transformState = this.displayManager.resetTransform()
      this.updateCropOverlay()
    },
    
    fitToWindow() {
      this.transformState = this.displayManager.resetTransform()
      this.updateCropOverlay()
    },
    
    // 重置裁剪区域（公开方法）
    resetCropToCenter() {
      this.resetCropParams()
      this.updateCropParams(this.cropParams)
      this.updateCropOverlay()
      this.addStatusMessage(this.$t('status.cropAreaReset'), 'info')
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
      
      // 检查是否会覆盖原文件
      const willOverwriteOriginal = this.checkWillOverwriteOriginal()
      if (willOverwriteOriginal) {
        const userConfirmed = await this.showOverwriteWarning()
        if (!userConfirmed) {
          this.addStatusMessage(this.$t('status.userCancelled'), 'info')
          return
        }
      }
      
      this.isProcessing = true
      this.progress = 0
      this.addStatusMessage(this.$t('status.batchCropStarted'), 'info')
      
      try {
        // 优先使用后端ImageMagick处理
        if (typeof require !== 'undefined') {
          await this.batchCropWithBackend()
        } else {
          await this.batchCropWithFrontend()
        }
        
      } catch (error) {
        this.addStatusMessage(this.$t('status.batchProcessError', { error: error.message }), 'error')
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
          this.addStatusMessage(this.$t('status.missingFilePaths', { count: filesWithoutPath.length }), 'info')
          throw new Error('文件缺少路径信息')
        }
        
        // 序列化cropParams以避免Proxy对象无法通过IPC传递
        const serializedCropParams = {
          x: this.cropParams.x,
          y: this.cropParams.y,
          width: this.cropParams.width,
          height: this.cropParams.height
        }
        
        const result = await ipcRenderer.invoke('batch-crop', {
          files: files,
          cropParams: serializedCropParams,
          outputSuffix: this.outputSuffix,
          outputDirectory: this.outputDirectory
        })
        
        if (result.success) {
          this.progressText = this.$t('status.batchCompleted', { count: result.results.length }).replace('✓ ', '')
          this.addStatusMessage(this.$t('status.batchCompleted', { count: result.results.length }), 'success')
          
          // 显示结果详情
          result.results.forEach(res => {
            if (res.success) {
              this.addStatusMessage(this.$t('status.fileSaved', { file: res.outputFile }), 'success')
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
            this.addStatusMessage(this.$t('status.fileSaved', { file: outputPath }), 'success')
          } else {
            this.addStatusMessage(this.$t('status.fileProcessed', { name: file.name }), 'success')
          }
        } catch (error) {
          this.addStatusMessage(this.$t('status.fileProcessFailed', { name: file.name, error: error.message }), 'error')
          console.error('Crop error:', error)
        }
        
        this.progress = Math.round(((i + 1) / this.selectedFiles.length) * 100)
      }
      
      this.progressText = this.$t('status.batchCompleted', { count: this.selectedFiles.length }).replace('✓ ', '')
      this.addStatusMessage(this.$t('status.batchCompleted', { count: this.selectedFiles.length }), 'success')
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
            title: this.$t('dialog.saveImage'),
            defaultPath: `${fileData.name.split('.')[0]}${this.outputSuffix}.png`,
            filters: [
              { name: this.$t('dialog.imageFiles'), extensions: ['png', 'jpg', 'jpeg'] },
              { name: this.$t('dialog.allFiles'), extensions: ['*'] }
            ]
          })
          
          if (result.canceled) {
            throw new Error(this.$t('dialog.userCancelledSave'))
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
    
    // 移除指定文件
    removeFiles(indices) {
      const result = this.fileManager.removeFiles(indices)
      
      if (result.success) {
        this.addStatusMessage(result.message, 'success')
        
        // 如果还有文件，更新当前选中的文件
        if (result.totalFiles > 0 && result.newCurrentIndex >= 0) {
          this.selectFile(result.newCurrentIndex)
        } else {
          // 没有文件了，清空当前图片
          this.currentImage = null
          this.addStatusMessage(this.$t('status.allFilesCleared'), 'info')
        }
      } else {
        this.addStatusMessage(result.message, 'error')
      }
      
      return result
    },
    
    // 移除单个文件（便捷方法）
    removeFile(index) {
      return this.removeFiles(index)
    },
    
    // 清空所有文件
    clearAll() {
      this.fileManager.clearAll()
      this.currentImage = null
      this.progress = 0
      this.progressText = this.$t('status.ready')
      this.statusMessages = []
      
      this.addStatusMessage(this.$t('status.allFilesCleared'), 'info')
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
              this.addStatusMessage(this.$t('status.imageMagickNotAvailable'), 'info')
            } else {
              this.addStatusMessage(this.$t('status.imageMagickReady'), 'success')
            }
          })
        } catch (error) {
          this.addStatusMessage(this.$t('status.clientProcessing'), 'info')
        }
      } else {
        this.addStatusMessage(this.$t('status.clientProcessing'), 'info')
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
        
        let newCropParams = { ...this.cropParams }
        
        switch (event.key) {
          case 'ArrowLeft':
            newCropParams.x = Math.max(0, this.cropParams.x - step)
            updated = true
            break
          case 'ArrowRight':
            newCropParams.x = Math.min(this.currentImage.width - this.cropParams.width, this.cropParams.x + step)
            updated = true
            break
          case 'ArrowUp':
            newCropParams.y = Math.max(0, this.cropParams.y - step)
            updated = true
            break
          case 'ArrowDown':
            newCropParams.y = Math.min(this.currentImage.height - this.cropParams.height, this.cropParams.y + step)
            updated = true
            break
        }
        
        if (updated) {
          event.preventDefault()
          this.updateCropParams(newCropParams)
          this.updateCropOverlay()
        }
      }
    },
    
    // 防止默认拖放行为
    // 切换目录菜单显示状态
    toggleDirectoryMenu() {
      this.showDirectoryMenu = !this.showDirectoryMenu
    },
    
    // 设置为原图片文件夹下
    setToOriginalFolder() {
      this.outputDirectory = './'
      this.showDirectoryMenu = false
      this.addStatusMessage(this.$t('status.outputDirSetToOriginal'), 'info')
    },
    
    // 选择自定义目录
    async selectCustomDirectory() {
      this.showDirectoryMenu = false
      
      if (typeof require !== 'undefined') {
        try {
          const { dialog } = require('electron').remote || require('@electron/remote')
          
          const result = await dialog.showOpenDialog({
            title: this.$t('dialog.selectOutputDir'),
            properties: ['openDirectory', 'createDirectory'],
            buttonLabel: this.$t('dialog.selectDirectory')
          })
          
          if (!result.canceled && result.filePaths.length > 0) {
            this.outputDirectory = result.filePaths[0]
            this.addStatusMessage(this.$t('status.outputDirSet', { dir: this.outputDirectory }), 'success')
          }
        } catch (error) {
          this.addStatusMessage(this.$t('status.dirSelectError', { error: error.message }), 'error')
          console.error('目录选择失败:', error)
        }
      } else {
        this.addStatusMessage(this.$t('status.electronOnlyFeature'), 'info')
      }
    },
    
    // 切换语言菜单显示状态
    toggleLanguageMenu() {
      this.showLanguageMenu = !this.showLanguageMenu
    },
    
    // 切换到指定语言
    switchToLanguage(locale) {
      this.showLanguageMenu = false
      window.switchLanguage(locale)
      
      // 更新页面标题
      this.updatePageTitle()
      
      // 更新状态文本
      if (!this.isProcessing) {
        this.progressText = this.$t('status.ready')
      }
      
      // 重新初始化提示文字等依赖翻译的内容
      this.addStatusMessage(this.$t('status.languageChanged', { language: this.currentLanguage.name }), 'info')
    },
    
    // 设置拖拽功能
    setupDragAndDrop() {
      const appElement = document.body
      
      // 防止整个窗口的默认拖拽行为
      document.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      
      document.addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      
      // 拖拽进入
      appElement.addEventListener('dragenter', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.isDragOver = true
      })
      
      // 拖拽悬停
      appElement.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.isDragOver = true
      })
      
      // 拖拽离开
      appElement.addEventListener('dragleave', (e) => {
        e.preventDefault()
        e.stopPropagation()
        // 只有当拖拽真正离开窗口时才隐藏提示
        if (e.target === appElement) {
          this.isDragOver = false
        }
      })
      
      // 拖拽释放
      appElement.addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.isDragOver = false
        
        const files = e.dataTransfer.files
        if (files && files.length > 0) {
          this.handleFileAddition(files)
        }
      })
    },
    
    // 使用原生文件对话框
    async useNativeFileDialog() {
      if (typeof require !== 'undefined') {
        try {
          const { ipcRenderer } = require('electron')
          const files = await ipcRenderer.invoke('select-files')
          
          if (files.length > 0) {
            this.addStatusMessage(this.$t('status.nativeDialogFiles', { count: files.length }), 'info')
            
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
          this.addStatusMessage(this.$t('status.nativeDialogError', { error: error.message }), 'error')
          console.error('Native file dialog error:', error)
        }
      } else {
        this.addStatusMessage(this.$t('status.nativeDialogElectronOnly'), 'info')
        // 回退到web文件选择
        document.getElementById('fileInput').click()
      }
    },
    
    // 打开输出文件夹
    async openOutputFolder() {
      if (typeof require !== 'undefined') {
        try {
          const { shell } = require('electron')
          const path = require('path')
          
          // 使用用户设置的输出目录
          let targetPath = this.outputDirectory || './'
          
          // 解析路径（支持相对路径和绝对路径）
          targetPath = path.resolve(targetPath)
          
          console.log('尝试打开输出文件夹:', targetPath)
          
          // 确保目录存在
          const fs = require('fs')
          if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true })
            console.log('创建输出目录:', targetPath)
          }
          
          await shell.openPath(targetPath)
          this.addStatusMessage(this.$t('status.outputFolderOpened', { path: targetPath }), 'info')
        } catch (error) {
          this.addStatusMessage(this.$t('status.openFolderError', { error: error.message }), 'error')
          console.error('打开输出文件夹失败:', error)
        }
      } else {
        this.addStatusMessage(this.$t('status.folderFeatureElectronOnly'), 'info')
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

// 使用i18n插件
app.use(window.i18n)

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