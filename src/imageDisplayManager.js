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
    // transform相关属性
    this.transformScale = 1
    this.transformOriginX = 50  // 百分比
    this.transformOriginY = 50  // 百分比
    this.translateX = 0
    this.translateY = 0
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
  
  /**
   * 基于鼠标位置进行滚轮缩放
   * @param {number} scaleFactor - 缩放因子
   * @param {number} mouseX - 鼠标X坐标（相对于图片容器）
   * @param {number} mouseY - 鼠标Y坐标（相对于图片容器）
   * @param {number} containerWidth - 容器宽度
   * @param {number} containerHeight - 容器高度
   * @returns {Object} 新的transform状态
   */
  wheelZoomAtPoint(scaleFactor, mouseX, mouseY, containerWidth, containerHeight) {
    const minScale = 0.1
    const maxScale = 5
    
    // 计算新的缩放值
    const newTransformScale = Math.max(minScale, Math.min(this.transformScale * scaleFactor, maxScale))
    
    if (newTransformScale === this.transformScale) {
      // 缩放值没有改变，直接返回当前状态
      return this.getTransformState()
    }
    
    // 计算鼠标位置相对于图片的百分比
    const mousePercentX = (mouseX / this.displayWidth) * 100
    const mousePercentY = (mouseY / this.displayHeight) * 100
    
    // 计算缩放前后鼠标位置的变化
    const scaleChange = newTransformScale / this.transformScale
    
    // 使用transform-origin和translate来实现以鼠标位置为中心的缩放
    // 设置transform-origin为鼠标位置
    this.transformOriginX = Math.max(0, Math.min(mousePercentX, 100))
    this.transformOriginY = Math.max(0, Math.min(mousePercentY, 100))
    
    // 更新缩放值
    this.transformScale = newTransformScale
    
    console.log('滚轮缩放:', {
      scaleFactor,
      newScale: this.transformScale,
      mousePercent: { x: this.transformOriginX, y: this.transformOriginY },
      mouse: { x: mouseX, y: mouseY }
    })
    
    return this.getTransformState()
  }
  
  /**
   * 按钮缩放（重置transform-origin到中心）
   * @param {number} scaleFactor - 缩放因子
   * @returns {Object} 新的transform状态
   */
  buttonZoom(scaleFactor) {
    const minScale = 0.1
    const maxScale = 5
    
    // 重置到中心缩放
    this.transformOriginX = 50
    this.transformOriginY = 50
    this.translateX = 0
    this.translateY = 0
    
    // 计算新的缩放值
    this.transformScale = Math.max(minScale, Math.min(this.transformScale * scaleFactor, maxScale))
    
    return this.getTransformState()
  }
  
  /**
   * 重置所有transform状态
   */
  resetTransform() {
    this.transformScale = 1
    this.transformOriginX = 50
    this.transformOriginY = 50
    this.translateX = 0
    this.translateY = 0
    return this.getTransformState()
  }
  
  /**
   * 获取当前的transform状态
   * @returns {Object} transform相关的所有状态
   */
  getTransformState() {
    return {
      scale: this.transformScale,
      originX: this.transformOriginX,
      originY: this.transformOriginY,
      translateX: this.translateX,
      translateY: this.translateY,
      transformStyle: `scale(${this.transformScale}) translate(${this.translateX}px, ${this.translateY}px)`,
      transformOriginStyle: `${this.transformOriginX}% ${this.transformOriginY}%`
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageDisplayManager
} else {
  window.ImageDisplayManager = ImageDisplayManager
}
