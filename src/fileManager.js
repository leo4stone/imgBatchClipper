/**
 * 文件管理器
 * 负责文件选择、图片信息获取等功能
 */
class FileManager {
  constructor() {
    this.selectedFiles = []
    this.currentFileIndex = -1
    this.imageCache = new Map()
  }
  
  /**
   * 处理文件选择
   * @param {FileList} files - 选择的文件列表
   * @returns {Promise<Array>} 处理后的文件数组
   */
  async handleFileSelection(files) {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return []
    
    console.log(`选择了 ${fileArray.length} 个文件`)
    
    // 过滤图片文件
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length !== fileArray.length) {
      console.log(`过滤了 ${fileArray.length - imageFiles.length} 个非图片文件`)
    }
    
    const processedFiles = []
    
    // 处理每个文件
    for (const file of imageFiles) {
      try {
        const fileData = {
          file: file,
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file)
        }
        
        // 获取图片尺寸
        const dimensions = await this.getImageDimensions(fileData.url)
        fileData.width = dimensions.width
        fileData.height = dimensions.height
        
        processedFiles.push(fileData)
      } catch (error) {
        console.error(`无法加载图片: ${file.name}`, error)
      }
    }
    
    return processedFiles
  }
  
  /**
   * 获取图片尺寸
   * @param {string} url - 图片URL
   * @returns {Promise<Object>} 图片尺寸 {width, height}
   */
  getImageDimensions(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = reject
      img.src = url
    })
  }
  
  /**
   * 添加文件到列表（追加模式，防重复）
   * @param {Array} files - 文件数组
   * @returns {Object} 添加结果统计
   */
  addFiles(files) {
    let addedCount = 0
    let duplicateCount = 0
    
    for (const newFile of files) {
      // 检查是否重复（基于文件名和大小）
      const isDuplicate = this.selectedFiles.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )
      
      if (!isDuplicate) {
        // 为每个文件添加独立的裁剪参数
        newFile.cropParams = {
          x: 0,
          y: 0, 
          width: 100,
          height: 100
        }
        
        this.selectedFiles.push(newFile)
        addedCount++
      } else {
        duplicateCount++
      }
    }
    
    return {
      total: files.length,
      added: addedCount,
      duplicates: duplicateCount
    }
  }
  
  /**
   * 处理并追加新文件
   * @param {FileList|Array} files - 文件列表
   * @returns {Promise<Object>} 处理结果
   */
  async handleFileAddition(files) {
    const processedFiles = await this.handleFileSelection(files)
    const addResult = this.addFiles(processedFiles)
    
    return {
      processedFiles,
      addResult,
      totalFiles: this.selectedFiles.length
    }
  }
  
  /**
   * 设置文件列表
   * @param {Array} files - 文件数组
   */
  setFiles(files) {
    // 释放之前的URL对象
    this.selectedFiles.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    })
    
    this.selectedFiles = files
    this.currentFileIndex = files.length > 0 ? 0 : -1
  }
  
  /**
   * 获取当前选中的文件
   * @returns {Object|null} 当前文件
   */
  getCurrentFile() {
    if (this.currentFileIndex >= 0 && this.currentFileIndex < this.selectedFiles.length) {
      return this.selectedFiles[this.currentFileIndex]
    }
    return null
  }
  
  /**
   * 选择文件
   * @param {number} index - 文件索引
   * @returns {Object|null} 选中的文件
   */
  selectFile(index) {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.currentFileIndex = index
      return this.selectedFiles[index]
    }
    return null
  }
  
  /**
   * 获取文件列表
   * @returns {Array} 文件列表
   */
  getFiles() {
    return this.selectedFiles
  }
  
  /**
   * 获取当前文件索引
   * @returns {number} 当前文件索引
   */
  getCurrentFileIndex() {
    return this.currentFileIndex
  }
  
  /**
   * 移除指定的文件
   * @param {number|Array} indices - 要移除的文件索引（单个数字或数组）
   * @returns {Object} 移除结果
   */
  removeFiles(indices) {
    // 处理参数，统一为数组格式
    const indexArray = Array.isArray(indices) ? indices : [indices]
    
    // 验证索引有效性
    const validIndices = indexArray.filter(index => 
      Number.isInteger(index) && index >= 0 && index < this.selectedFiles.length
    )
    
    if (validIndices.length === 0) {
      return { 
        success: false, 
        message: '没有有效的文件索引',
        removed: 0,
        totalFiles: this.selectedFiles.length
      }
    }
    
    // 按索引从大到小排序，避免删除时索引变化的问题
    const sortedIndices = validIndices.sort((a, b) => b - a)
    const removedFiles = []
    
    // 依次移除文件
    for (const index of sortedIndices) {
      const removedFile = this.selectedFiles[index]
      
      // 释放URL对象
      if (removedFile.url) {
        URL.revokeObjectURL(removedFile.url)
      }
      
      // 从列表中移除
      this.selectedFiles.splice(index, 1)
      removedFiles.push(removedFile)
    }
    
    // 调整当前文件索引
    this.adjustCurrentFileIndex(sortedIndices)
    
    return { 
      success: true, 
      message: `已移除 ${removedFiles.length} 个文件`,
      removed: removedFiles.length,
      removedFiles,
      newCurrentIndex: this.currentFileIndex,
      totalFiles: this.selectedFiles.length
    }
  }
  
  /**
   * 调整当前文件索引（移除文件后）
   * @param {Array} removedIndices - 已移除的索引数组（从大到小排序）
   */
  adjustCurrentFileIndex(removedIndices) {
    if (this.selectedFiles.length === 0) {
      this.currentFileIndex = -1
      return
    }
    
    let adjustedIndex = this.currentFileIndex
    
    // 计算需要减少的索引数量
    let reduction = 0
    for (const removedIndex of removedIndices.reverse()) { // 从小到大处理
      if (removedIndex < this.currentFileIndex) {
        reduction++
      } else if (removedIndex === this.currentFileIndex) {
        // 当前文件被移除，选择合适的替代文件
        adjustedIndex = Math.min(this.currentFileIndex, this.selectedFiles.length - 1)
        reduction = 0 // 重置减少量，因为已经重新设置了索引
        break
      }
    }
    
    this.currentFileIndex = Math.max(0, adjustedIndex - reduction)
    
    // 确保索引在有效范围内
    if (this.currentFileIndex >= this.selectedFiles.length) {
      this.currentFileIndex = this.selectedFiles.length - 1
    }
  }
  
  /**
   * 初始化文件的裁剪参数
   * @param {Object} file - 文件对象
   * @param {number} defaultSize - 默认裁剪尺寸
   */
  initializeFileCropParams(file, defaultSize = 100) {
    if (file.width && file.height) {
      // 计算中心位置的默认裁剪区域
      const cropSize = Math.min(file.width, file.height, defaultSize)
      file.cropParams = {
        x: Math.max(0, Math.floor((file.width - cropSize) / 2)),
        y: Math.max(0, Math.floor((file.height - cropSize) / 2)),
        width: cropSize,
        height: cropSize
      }
    } else {
      // 备用默认值
      file.cropParams = {
        x: 0,
        y: 0,
        width: defaultSize,
        height: defaultSize
      }
    }
  }
  
  /**
   * 获取当前文件的裁剪参数
   * @returns {Object|null} 裁剪参数
   */
  getCurrentFileCropParams() {
    const currentFile = this.getCurrentFile()
    return currentFile ? currentFile.cropParams : null
  }
  
  /**
   * 更新当前文件的裁剪参数
   * @param {Object} newCropParams - 新的裁剪参数
   */
  updateCurrentFileCropParams(newCropParams) {
    const currentFile = this.getCurrentFile()
    if (currentFile) {
      currentFile.cropParams = { ...newCropParams }
    }
  }
  
  /**
   * 更新所有文件的裁剪参数（共用模式）
   * @param {Object} newCropParams - 新的裁剪参数
   */
  updateAllFilesCropParams(newCropParams) {
    this.selectedFiles.forEach(file => {
      file.cropParams = { ...newCropParams }
    })
  }
  
  /**
   * 清空所有文件
   */
  clearAll() {
    // 释放URL对象
    this.selectedFiles.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    })
    
    this.selectedFiles = []
    this.currentFileIndex = -1
    this.imageCache.clear()
  }
  
  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  
  /**
   * 检查文件是否为图片
   * @param {File} file - 文件对象
   * @returns {boolean} 是否为图片
   */
  static isImageFile(file) {
    return file.type.startsWith('image/')
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileManager
} else {
  window.FileManager = FileManager
}
