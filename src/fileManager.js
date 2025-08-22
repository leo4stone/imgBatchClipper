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
   * 添加文件到列表
   * @param {Array} files - 文件数组
   */
  addFiles(files) {
    this.selectedFiles = [...this.selectedFiles, ...files]
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
