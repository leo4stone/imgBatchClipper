/**
 * 裁剪计算器模块
 * 负责所有与裁剪相关的数学计算
 */
class CropCalculator {
  /**
   * 计算裁剪覆盖层的样式
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   * @param {Object} cropParams - 裁剪参数 {x, y, width, height}
   * @returns {Object} 样式对象
   */
  static calculateOverlayStyle(currentImage, displayWidth, displayHeight, cropParams) {
    // 检查必要条件
    if (!currentImage || !displayWidth || !displayHeight) {
      return { display: 'none' }
    }
    
    // 确保裁剪参数有效
    if (cropParams.width <= 0 || cropParams.height <= 0) {
      return { display: 'none' }
    }
    
    // 计算缩放比例
    const scaleX = displayWidth / currentImage.width
    const scaleY = displayHeight / currentImage.height
    
    const overlayX = cropParams.x * scaleX
    const overlayY = cropParams.y * scaleY
    const overlayWidth = cropParams.width * scaleX
    const overlayHeight = cropParams.height * scaleY
    
    // 添加边界检查，确保覆盖层在合理范围内
    if (overlayWidth < 1 || overlayHeight < 1) {
      return { display: 'none' }
    }
    
    return {
      display: 'block',
      left: Math.round(overlayX) + 'px',
      top: Math.round(overlayY) + 'px',
      width: Math.round(overlayWidth) + 'px',
      height: Math.round(overlayHeight) + 'px'
    }
  }
  
  /**
   * 将显示坐标转换为原图坐标
   * @param {number} displayX - 显示坐标X
   * @param {number} displayY - 显示坐标Y
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   * @returns {Object} 原图坐标 {x, y}
   */
  static displayToOriginal(displayX, displayY, currentImage, displayWidth, displayHeight) {
    const scaleX = currentImage.width / displayWidth
    const scaleY = currentImage.height / displayHeight
    
    return {
      x: Math.floor(displayX * scaleX),
      y: Math.floor(displayY * scaleY)
    }
  }
  
  /**
   * 将原图坐标转换为显示坐标
   * @param {number} originalX - 原图坐标X
   * @param {number} originalY - 原图坐标Y
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   * @returns {Object} 显示坐标 {x, y}
   */
  static originalToDisplay(originalX, originalY, currentImage, displayWidth, displayHeight) {
    const scaleX = displayWidth / currentImage.width
    const scaleY = displayHeight / currentImage.height
    
    return {
      x: originalX * scaleX,
      y: originalY * scaleY
    }
  }
  
  /**
   * 限制裁剪参数在图片范围内
   * @param {Object} cropParams - 裁剪参数
   * @param {Object} currentImage - 当前图片信息
   * @returns {Object} 限制后的裁剪参数
   */
  static constrainCropParams(cropParams, currentImage) {
    const constrained = { ...cropParams }
    
    // 限制位置
    constrained.x = Math.max(0, Math.min(constrained.x, currentImage.width - 1))
    constrained.y = Math.max(0, Math.min(constrained.y, currentImage.height - 1))
    
    // 限制尺寸
    constrained.width = Math.min(constrained.width, currentImage.width - constrained.x)
    constrained.height = Math.min(constrained.height, currentImage.height - constrained.y)
    
    // 确保最小尺寸
    constrained.width = Math.max(10, constrained.width)
    constrained.height = Math.max(10, constrained.height)
    
    return constrained
  }
  
  /**
   * 生成默认的裁剪参数（居中）
   * @param {Object} currentImage - 当前图片信息
   * @param {number} defaultSize - 默认尺寸
   * @returns {Object} 裁剪参数
   */
  static getDefaultCropParams(currentImage, defaultSize = 100) {
    const centerX = Math.max(0, Math.floor((currentImage.width - defaultSize) / 2))
    const centerY = Math.max(0, Math.floor((currentImage.height - defaultSize) / 2))
    
    return {
      x: centerX,
      y: centerY,
      width: Math.min(defaultSize, currentImage.width),
      height: Math.min(defaultSize, currentImage.height)
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CropCalculator
} else {
  window.CropCalculator = CropCalculator
}
