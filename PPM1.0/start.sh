#!/bin/bash

# PPM 3.0 Cloud Studio启动脚本
# 无需token令牌和密码认证

echo "================================================"
echo "PPM 3.0 Cloud Studio 启动脚本"
echo "================================================"
echo ""

# 检查Node.js和npm版本
echo "检查Node.js和npm版本..."
node --version
npm --version
echo ""

# 安装项目依赖
echo "安装项目依赖..."
npm install
echo ""

# 创建环境变量文件
echo "创建环境变量文件..."

# 根目录环境变量
cat > .env << EOL
NODE_ENV=development
PORT=3000
EOL

# 客户端环境变量
cat > client/.env << EOL
VITE_API_URL=http://0.0.0.0:3000/api/v1
EOL

# 服务器环境变量
cat > server/.env << EOL
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ppm3
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=ppm3_jwt_secret
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOL

echo "环境变量文件创建成功！"
echo ""

# 创建日志目录
echo "创建日志目录..."
mkdir -p logs
echo ""

# 启动应用
echo "启动PPM 3.0应用..."
echo ""
echo "================================================"
echo "启动完成后，Cloud Studio会自动检测端口并显示访问链接"
echo "前端服务: http://0.0.0.0:3001"
echo "后端服务: http://0.0.0.0:3000"
echo "================================================"
echo ""

npm run dev
