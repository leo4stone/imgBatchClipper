/**
 * 裁剪交互处理器
 * 负责处理所有裁剪相关的鼠标交互
 */
class CropInteractionHandler {
  constructor() {
    this.isDragging = false
    this.dragStart = { x: 0, y: 0 }
    this.interactionMode = 'none' // 'none', 'creating', 'moving', 'resizing'
    this.resizeHandle = null // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
    this.isHoveringCrop = false
    this.hoverHandle = null
  }
  
  /**
   * 检测鼠标位置相对于裁剪区域的状态
   * @param {number} mouseX - 鼠标X坐标（相对于图片）
   * @param {number} mouseY - 鼠标Y坐标（相对于图片）
   * @param {Object} cropParams - 裁剪参数
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   * @returns {Object} 交互状态信息
   */
  detectInteractionZone(mouseX, mouseY, cropParams, currentImage, displayWidth, displayHeight) {
    // 转换为原图坐标进行判断
    const originalCoords = CropCalculator.displayToOriginal(
      mouseX, mouseY, currentImage, displayWidth, displayHeight
    )
    
    const { x, y, width, height } = cropParams
    const handleSize = 8 // 调整手柄的大小（像素）
    
    // 检查是否在调整手柄上
    const handles = {
      nw: { x: x - handleSize/2, y: y - handleSize/2, width: handleSize, height: handleSize },
      ne: { x: x + width - handleSize/2, y: y - handleSize/2, width: handleSize, height: handleSize },
      sw: { x: x - handleSize/2, y: y + height - handleSize/2, width: handleSize, height: handleSize },
      se: { x: x + width - handleSize/2, y: y + height - handleSize/2, width: handleSize, height: handleSize },
      n: { x: x + width/2 - handleSize/2, y: y - handleSize/2, width: handleSize, height: handleSize },
      s: { x: x + width/2 - handleSize/2, y: y + height - handleSize/2, width: handleSize, height: handleSize },
      w: { x: x - handleSize/2, y: y + height/2 - handleSize/2, width: handleSize, height: handleSize },
      e: { x: x + width - handleSize/2, y: y + height/2 - handleSize/2, width: handleSize, height: handleSize }
    }
    
    // 检查调整手柄
    for (const [handleName, handle] of Object.entries(handles)) {
      if (originalCoords.x >= handle.x && originalCoords.x <= handle.x + handle.width &&
          originalCoords.y >= handle.y && originalCoords.y <= handle.y + handle.height) {
        return {
          zone: 'resize',
          handle: handleName,
          cursor: this.getCursorForHandle(handleName)
        }
      }
    }
    
    // 检查是否在裁剪区域内部
    if (originalCoords.x >= x && originalCoords.x <= x + width &&
        originalCoords.y >= y && originalCoords.y <= y + height) {
      return {
        zone: 'move',
        handle: null,
        cursor: 'move'
      }
    }
    
    // 在裁剪区域外部
    return {
      zone: 'create',
      handle: null,
      cursor: 'crosshair'
    }
  }
  
  /**
   * 根据调整手柄类型获取对应的鼠标样式
   * @param {string} handle - 手柄类型
   * @returns {string} CSS cursor 值
   */
  getCursorForHandle(handle) {
    const cursorMap = {
      'nw': 'nw-resize',
      'ne': 'ne-resize',
      'sw': 'sw-resize',
      'se': 'se-resize',
      'n': 'n-resize',
      's': 's-resize',
      'w': 'w-resize',
      'e': 'e-resize'
    }
    return cursorMap[handle] || 'default'
  }
  
  /**
   * 开始拖拽操作
   * @param {Object} interactionInfo - 交互信息
   * @param {number} mouseX - 鼠标X坐标
   * @param {number} mouseY - 鼠标Y坐标
   * @param {Object} cropParams - 当前裁剪参数
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   */
  startDrag(interactionInfo, mouseX, mouseY, cropParams, currentImage, displayWidth, displayHeight) {
    this.isDragging = true
    this.interactionMode = interactionInfo.zone
    this.resizeHandle = interactionInfo.handle
    
    // 记录起始位置（原图坐标）
    const originalCoords = CropCalculator.displayToOriginal(
      mouseX, mouseY, currentImage, displayWidth, displayHeight
    )
    
    this.dragStart = {
      x: originalCoords.x,
      y: originalCoords.y,
      cropX: cropParams.x,
      cropY: cropParams.y,
      cropWidth: cropParams.width,
      cropHeight: cropParams.height
    }
    
    console.log('开始拖拽:', this.interactionMode, this.resizeHandle)
  }
  
  /**
   * 更新拖拽操作
   * @param {number} mouseX - 当前鼠标X坐标
   * @param {number} mouseY - 当前鼠标Y坐标
   * @param {Object} currentImage - 当前图片信息
   * @param {number} displayWidth - 显示宽度
   * @param {number} displayHeight - 显示高度
   * @returns {Object|null} 新的裁剪参数，如果没有变化则返回null
   */
  updateDrag(mouseX, mouseY, currentImage, displayWidth, displayHeight) {
    if (!this.isDragging) return null
    
    const currentCoords = CropCalculator.displayToOriginal(
      mouseX, mouseY, currentImage, displayWidth, displayHeight
    )
    
    const deltaX = currentCoords.x - this.dragStart.x
    const deltaY = currentCoords.y - this.dragStart.y
    
    let newCropParams = null
    
    switch (this.interactionMode) {
      case 'create':
        newCropParams = this.handleCreateDrag(currentCoords)
        break
      case 'move':
        newCropParams = this.handleMoveDrag(deltaX, deltaY)
        break
      case 'resize':
        newCropParams = this.handleResizeDrag(deltaX, deltaY)
        break
    }
    
    if (newCropParams) {
      return CropCalculator.constrainCropParams(newCropParams, currentImage)
    }
    
    return null
  }
  
  /**
   * 处理创建新选区的拖拽
   * @param {Object} currentCoords - 当前坐标
   * @returns {Object} 新的裁剪参数
   */
  handleCreateDrag(currentCoords) {
    const x = Math.min(this.dragStart.x, currentCoords.x)
    const y = Math.min(this.dragStart.y, currentCoords.y)
    const width = Math.abs(currentCoords.x - this.dragStart.x)
    const height = Math.abs(currentCoords.y - this.dragStart.y)
    
    return { x, y, width, height }
  }
  
  /**
   * 处理移动选区的拖拽
   * @param {number} deltaX - X方向偏移
   * @param {number} deltaY - Y方向偏移
   * @returns {Object} 新的裁剪参数
   */
  handleMoveDrag(deltaX, deltaY) {
    return {
      x: this.dragStart.cropX + deltaX,
      y: this.dragStart.cropY + deltaY,
      width: this.dragStart.cropWidth,
      height: this.dragStart.cropHeight
    }
  }
  
  /**
   * 处理调整选区大小的拖拽
   * @param {number} deltaX - X方向偏移
   * @param {number} deltaY - Y方向偏移
   * @returns {Object} 新的裁剪参数
   */
  handleResizeDrag(deltaX, deltaY) {
    const { cropX, cropY, cropWidth, cropHeight } = this.dragStart
    let newParams = { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
    
    switch (this.resizeHandle) {
      case 'nw':
        newParams.x = cropX + deltaX
        newParams.y = cropY + deltaY
        newParams.width = cropWidth - deltaX
        newParams.height = cropHeight - deltaY
        break
      case 'ne':
        newParams.y = cropY + deltaY
        newParams.width = cropWidth + deltaX
        newParams.height = cropHeight - deltaY
        break
      case 'sw':
        newParams.x = cropX + deltaX
        newParams.width = cropWidth - deltaX
        newParams.height = cropHeight + deltaY
        break
      case 'se':
        newParams.width = cropWidth + deltaX
        newParams.height = cropHeight + deltaY
        break
      case 'n':
        newParams.y = cropY + deltaY
        newParams.height = cropHeight - deltaY
        break
      case 's':
        newParams.height = cropHeight + deltaY
        break
      case 'w':
        newParams.x = cropX + deltaX
        newParams.width = cropWidth - deltaX
        break
      case 'e':
        newParams.width = cropWidth + deltaX
        break
    }
    
    return newParams
  }
  
  /**
   * 结束拖拽操作
   */
  endDrag() {
    this.isDragging = false
    this.interactionMode = 'none'
    this.resizeHandle = null
    console.log('结束拖拽')
  }
  
  /**
   * 检查是否正在拖拽
   */
  isDraggingActive() {
    return this.isDragging
  }
  
  /**
   * 获取当前交互模式
   */
  getInteractionMode() {
    return this.interactionMode
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CropInteractionHandler
} else {
  window.CropInteractionHandler = CropInteractionHandler
}
