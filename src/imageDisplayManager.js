/**
 * 图片显示管理器
 * 负责图片显示、缩放等功能
 */
class ImageDisplayManager {
  constructor() {
    this.imageScale = 1
    this.displayWidth = 0
    this.displayHeight = 0
    this.maxDisplaySize = 800
  }
  
  /**
   * 计算图片显示尺寸
   * @param {Object} currentImage - 当前图片信息
   * @param {HTMLElement} container - 容器元素
   * @param {number} imageScale - 图片缩放比例
   * @returns {Object} 显示尺寸 {width, height}
   */
  calculateDisplaySize(currentImage, container, imageScale = 1) {
    if (!currentImage || !container) {
      console.log('calculateDisplaySize: 缺少必要参数')
      return { width: 0, height: 0 }
    }
    
    // 获取容器尺寸，留出边距
    const containerWidth = container.clientWidth - 40
    const containerHeight = container.clientHeight - 40
    
    console.log('容器尺寸:', containerWidth, 'x', containerHeight)
    console.log('原图尺寸:', currentImage.width, 'x', currentImage.height)
    
    // 计算缩放比例以适应容器
    const scaleX = containerWidth / currentImage.width
    const scaleY = containerHeight / currentImage.height
    const autoScale = Math.min(scaleX, scaleY, 1) // 不超过原图大小
    
    // 应用当前缩放
    const finalScale = autoScale * imageScale
    
    const newDisplayWidth = Math.round(currentImage.width * finalScale)
    const newDisplayHeight = Math.round(currentImage.height * finalScale)
    
    console.log('计算得出显示尺寸:', newDisplayWidth, 'x', newDisplayHeight, '缩放比例:', finalScale)
    
    // 确保尺寸有效
    if (newDisplayWidth <= 0 || newDisplayHeight <= 0) {
      console.warn('显示尺寸无效，使用默认值')
      return { width: 300, height: 200 }
    }
    
    return { width: newDisplayWidth, height: newDisplayHeight }
  }
  
  /**
   * 缩放图片
   * @param {number} scaleFactor - 缩放因子
   * @param {number} minScale - 最小缩放比例
   * @param {number} maxScale - 最大缩放比例
   * @returns {number} 新的缩放比例
   */
  zoom(scaleFactor, minScale = 0.1, maxScale = 5) {
    this.imageScale = Math.max(minScale, Math.min(this.imageScale * scaleFactor, maxScale))
    return this.imageScale
  }
  
  /**
   * 重置缩放
   */
  resetZoom() {
    this.imageScale = 1
    return this.imageScale
  }
  
  /**
   * 获取当前缩放比例
   */
  getScale() {
    return this.imageScale
  }
  
  /**
   * 设置缩放比例
   * @param {number} scale - 缩放比例
   */
  setScale(scale) {
    this.imageScale = Math.max(0.1, Math.min(scale, 5))
    return this.imageScale
  }
  
  /**
   * 获取显示尺寸
   */
  getDisplaySize() {
    return {
      width: this.displayWidth,
      height: this.displayHeight
    }
  }
  
  /**
   * 设置显示尺寸
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  setDisplaySize(width, height) {
    this.displayWidth = width
    this.displayHeight = height
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageDisplayManager
} else {
  window.ImageDisplayManager = ImageDisplayManager
}
