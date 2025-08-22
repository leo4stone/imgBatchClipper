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
   * 计算考虑transform的裁剪覆盖层样式
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   * @param {Object} cropParams - 裁剪参数 {x, y, width, height}
   * @param {Object} transformState - transform状态
   * @returns {Object} 样式对象
   */
  static calculateOverlayStyleWithTransform(currentImage, displayWidth, displayHeight, cropParams, transformState) {
    // 检查必要条件
    if (!currentImage || !displayWidth || !displayHeight) {
      return { display: 'none' }
    }
    
    // 确保裁剪参数有效
    if (cropParams.width <= 0 || cropParams.height <= 0) {
      return { display: 'none' }
    }
    
    // 计算基础缩放比例（图片原始尺寸到显示尺寸）
    const baseScaleX = displayWidth / currentImage.width
    const baseScaleY = displayHeight / currentImage.height
    
    // 计算裁剪区域在基础显示坐标系中的位置和尺寸
    const baseCropX = cropParams.x * baseScaleX
    const baseCropY = cropParams.y * baseScaleY
    const baseCropWidth = cropParams.width * baseScaleX
    const baseCropHeight = cropParams.height * baseScaleY
    
    // 应用transform缩放
    const finalScale = transformState.scale
    const finalCropWidth = baseCropWidth * finalScale
    const finalCropHeight = baseCropHeight * finalScale
    
    // 计算transform-origin的像素位置
    const originX = (transformState.originX / 100) * displayWidth
    const originY = (transformState.originY / 100) * displayHeight
    
    // 计算裁剪区域左上角相对于transform-origin的偏移
    const offsetFromOriginX = baseCropX - originX
    const offsetFromOriginY = baseCropY - originY
    
    // 应用缩放到偏移量
    const scaledOffsetX = offsetFromOriginX * finalScale
    const scaledOffsetY = offsetFromOriginY * finalScale
    
    // 计算最终位置
    const finalCropX = originX + scaledOffsetX
    const finalCropY = originY + scaledOffsetY
    
    // 添加边界检查
    if (finalCropWidth < 1 || finalCropHeight < 1) {
      return { display: 'none' }
    }
    
    return {
      display: 'block',
      left: Math.round(finalCropX) + 'px',
      top: Math.round(finalCropY) + 'px',
      width: Math.round(finalCropWidth) + 'px',
      height: Math.round(finalCropHeight) + 'px'
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
   * 将考虑transform的显示坐标转换为原图坐标
   * @param {number} displayX - 显示坐标X
   * @param {number} displayY - 显示坐标Y
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   * @param {Object} transformState - transform状态
   * @returns {Object} 原图坐标 {x, y}
   */
  static displayToOriginalWithTransform(displayX, displayY, currentImage, displayWidth, displayHeight, transformState) {
    // 计算transform-origin的像素位置
    const originX = (transformState.originX / 100) * displayWidth
    const originY = (transformState.originY / 100) * displayHeight
    
    // 计算鼠标位置相对于transform-origin的偏移
    const offsetFromOriginX = displayX - originX
    const offsetFromOriginY = displayY - originY
    
    // 反向应用transform缩放
    const unscaledOffsetX = offsetFromOriginX / transformState.scale
    const unscaledOffsetY = offsetFromOriginY / transformState.scale
    
    // 计算在基础显示坐标系中的位置
    const baseDisplayX = originX + unscaledOffsetX
    const baseDisplayY = originY + unscaledOffsetY
    
    // 转换为原图坐标
    const scaleX = currentImage.width / displayWidth
    const scaleY = currentImage.height / displayHeight
    
    return {
      x: Math.floor(baseDisplayX * scaleX),
      y: Math.floor(baseDisplayY * scaleY)
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
    
    // 确保最小尺寸
    constrained.width = Math.max(10, constrained.width)
    constrained.height = Math.max(10, constrained.height)
    
    // 限制位置，确保裁剪区域不会超出图片边界
    constrained.x = Math.max(0, constrained.x)
    constrained.y = Math.max(0, constrained.y)
    
    // 如果位置+尺寸超出边界，优先保持尺寸，调整位置
    if (constrained.x + constrained.width > currentImage.width) {
      constrained.x = Math.max(0, currentImage.width - constrained.width)
    }
    if (constrained.y + constrained.height > currentImage.height) {
      constrained.y = Math.max(0, currentImage.height - constrained.height)
    }
    
    // 最终确保尺寸不会超出图片范围
    constrained.width = Math.min(constrained.width, currentImage.width - constrained.x)
    constrained.height = Math.min(constrained.height, currentImage.height - constrained.y)
    
    // 再次确保最小尺寸
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
