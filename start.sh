#!/bin/bash

echo "🚀 启动 ImageMagick Viewer (Electron + Vue.js)"
echo "================================================"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "❌ 依赖未安装，正在安装..."
    npm install
fi

echo "✅ 依赖检查完成"
echo "🔄 启动应用..."

# 启动应用
npm run dev
