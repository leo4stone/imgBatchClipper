const fs = require('fs').promises
const path = require('path')
const os = require('os')

class ImageProcessor {
  constructor() {
    this.outputDirectory = path.join(os.homedir(), 'Pictures', 'ImageMagick_Output')
    this.tempDirectory = path.join(os.tmpdir(), 'imagemagick_temp')
    this.progressCallback = null
    
    // 初始化输出目录
    this.ensureDirectories()
    
    // 检测可用的图片处理库
    this.setupProcessor()
  }
  
  async ensureDirectories() {
    try {
      await fs.mkdir(this.outputDirectory, { recursive: true })
      await fs.mkdir(this.tempDirectory, { recursive: true })
      console.log('输出目录已创建:', this.outputDirectory)
    } catch (error) {
      console.error('创建目录失败:', error)
    }
  }
  
  async setupProcessor() {
    // 尝试使用不同的图片处理库
    this.processorType = await this.detectBestProcessor()
    console.log(`使用图片处理器: ${this.processorType}`)
  }
  
  async detectBestProcessor() {
    // 按优先级检测可用的处理器
    const processors = [
      { name: 'imagemagick', test: () => this.testImageMagick() },
      { name: 'gm', test: () => this.testGraphicsMagick() },
      { name: 'sharp', test: () => this.testSharp() },
      { name: 'canvas', test: () => this.testCanvas() }
    ]
    
    for (const processor of processors) {
      try {
        await processor.test()
        return processor.name
      } catch (error) {
        console.log(`${processor.name} 不可用:`, error.message)
      }
    }
    
    return 'canvas' // 默认使用canvas
  }
  
  async testImageMagick() {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    try {
      await execAsync('magick -version')
      return true
    } catch (error) {
      throw new Error('ImageMagick命令行工具不可用')
    }
  }
  
  async testGraphicsMagick() {
    try {
      const gm = require('gm')
      return new Promise((resolve, reject) => {
        // 创建一个简单的测试图片来验证GM是否工作
        gm(1, 1, '#000000')
          .format('png')
          .toBuffer((err, buffer) => {
            if (err) reject(err)
            else resolve(true)
          })
      })
    } catch (error) {
      throw new Error('GraphicsMagick库不可用')
    }
  }
  
  async testSharp() {
    try {
      const sharp = require('sharp')
      // 创建一个简单的测试图片
      await sharp({
        create: {
          width: 1,
          height: 1,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      }).png().toBuffer()
      return true
    } catch (error) {
      throw new Error('Sharp库不可用')
    }
  }
  
  async testCanvas() {
    try {
      const { createCanvas } = require('canvas')
      const canvas = createCanvas(1, 1)
      return !!canvas
    } catch (error) {
      throw new Error('Canvas库不可用')
    }
  }
  
  setProgressCallback(callback) {
    this.progressCallback = callback
  }
  
  updateProgress(current, total, currentFile = '') {
    if (this.progressCallback) {
      const progress = Math.round((current / total) * 100)
      this.progressCallback({
        progress,
        current,
        total,
        currentFile
      })
    }
  }
  
  async getImageInfo(filePath) {
    try {
      switch (this.processorType) {
        case 'imagemagick':
          return await this.getImageInfoWithImageMagick(filePath)
        case 'gm':
          return await this.getImageInfoWithGM(filePath)
        case 'sharp':
          return await this.getImageInfoWithSharp(filePath)
        default:
          return await this.getImageInfoWithCanvas(filePath)
      }
    } catch (error) {
      console.error('获取图片信息失败:', error)
      // 备用方案
      return await this.getImageInfoWithCanvas(filePath)
    }
  }
  
  async getImageInfoWithImageMagick(filePath) {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    const command = `magick identify -format "%w %h %b" "${filePath}"`
    const { stdout } = await execAsync(command)
    const [width, height, size] = stdout.trim().split(' ')
    
    return {
      width: parseInt(width),
      height: parseInt(height),
      size: size
    }
  }
  
  async getImageInfoWithGM(filePath) {
    const gm = require('gm')
    
    return new Promise((resolve, reject) => {
      gm(filePath).size((err, size) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            width: size.width,
            height: size.height,
            size: '未知'
          })
        }
      })
    })
  }
  
  async getImageInfoWithSharp(filePath) {
    const sharp = require('sharp')
    const metadata = await sharp(filePath).metadata()
    
    return {
      width: metadata.width,
      height: metadata.height,
      size: metadata.size ? `${Math.round(metadata.size / 1024)}KB` : '未知'
    }
  }
  
  async getImageInfoWithCanvas(filePath) {
    const { loadImage } = require('canvas')
    const img = await loadImage(filePath)
    
    return {
      width: img.width,
      height: img.height,
      size: '未知'
    }
  }
  
  async batchCropImages(files, cropParams, outputSuffix = '_cropped') {
    const results = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      this.updateProgress(i, files.length, file.name)
      
      try {
        const result = await this.cropSingleImage(file, cropParams, outputSuffix)
        results.push({
          success: true,
          inputFile: file.name,
          outputFile: result.outputPath,
          ...result
        })
      } catch (error) {
        console.error(`裁剪失败 ${file.name}:`, error)
        results.push({
          success: false,
          inputFile: file.name,
          error: error.message
        })
      }
    }
    
    this.updateProgress(files.length, files.length, '完成')
    return results
  }
  
  async cropSingleImage(file, cropParams, outputSuffix) {
    const inputPath = file.path
    const parsedPath = path.parse(inputPath)
    const outputFileName = `${parsedPath.name}${outputSuffix}${parsedPath.ext}`
    const outputPath = path.join(this.outputDirectory, outputFileName)
    
    try {
      switch (this.processorType) {
        case 'imagemagick':
          await this.cropWithImageMagick(inputPath, outputPath, cropParams)
          break
        case 'gm':
          await this.cropWithGM(inputPath, outputPath, cropParams)
          break
        case 'sharp':
          await this.cropWithSharp(inputPath, outputPath, cropParams)
          break
        default:
          await this.cropWithCanvas(inputPath, outputPath, cropParams)
      }
      
      return { outputPath, processorUsed: this.processorType }
    } catch (error) {
      // 如果主要处理器失败，尝试canvas备用方案
      if (this.processorType !== 'canvas') {
        console.log(`${this.processorType}处理失败，尝试canvas备用方案`)
        await this.cropWithCanvas(inputPath, outputPath, cropParams)
        return { outputPath, processorUsed: 'canvas' }
      }
      throw error
    }
  }
  
  async cropWithImageMagick(inputPath, outputPath, cropParams) {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    const { x, y, width, height } = cropParams
    const command = `magick "${inputPath}" -crop ${width}x${height}+${x}+${y} "${outputPath}"`
    
    await execAsync(command)
  }
  
  async cropWithGM(inputPath, outputPath, cropParams) {
    const gm = require('gm')
    const { x, y, width, height } = cropParams
    
    return new Promise((resolve, reject) => {
      gm(inputPath)
        .crop(width, height, x, y)
        .write(outputPath, (err) => {
          if (err) reject(err)
          else resolve()
        })
    })
  }
  
  async cropWithSharp(inputPath, outputPath, cropParams) {
    const sharp = require('sharp')
    const { x, y, width, height } = cropParams
    
    await sharp(inputPath)
      .extract({
        left: x,
        top: y,
        width: width,
        height: height
      })
      .toFile(outputPath)
  }
  
  async cropWithCanvas(inputPath, outputPath, cropParams) {
    const { createCanvas, loadImage } = require('canvas')
    const fs = require('fs')
    const { x, y, width, height } = cropParams
    
    // 加载原图
    const img = await loadImage(inputPath)
    
    // 创建canvas
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    
    // 裁剪图片
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
    
    // 保存图片
    const buffer = canvas.toBuffer('image/png')
    await fs.promises.writeFile(outputPath, buffer)
  }
  
  getOutputDirectory() {
    return this.outputDirectory
  }
  
  async cleanupTempFiles() {
    try {
      const files = await fs.readdir(this.tempDirectory)
      for (const file of files) {
        await fs.unlink(path.join(this.tempDirectory, file))
      }
      console.log('临时文件清理完成')
    } catch (error) {
      console.error('清理临时文件失败:', error)
      throw error
    }
  }
}

module.exports = ImageProcessor
