@echo off

echo ================================================
echo PPM 3.0 Cloud Studio 启动脚本 (Windows版本)
echo ================================================
echo.

:: 检查Node.js和npm版本
echo 检查Node.js和npm版本...
node --version
npm --version
echo.

:: 安装项目依赖
echo 安装项目依赖...
npm install
echo.

:: 创建环境变量文件
echo 创建环境变量文件...

:: 根目录环境变量
echo NODE_ENV=development> .env
echo PORT=3000>> .env

:: 服务器环境变量
echo NODE_ENV=development> server\.env
echo PORT=3000>> server\.env
echo MONGODB_URI=mongodb://localhost:27017/ppm3>> server\.env
echo REDIS_URL=redis://localhost:6379/0>> server\.env
echo JWT_SECRET=ppm3_jwt_secret>> server\.env
echo JWT_EXPIRES_IN=7d>> server\.env
echo LOG_LEVEL=info>> server\.env
echo LOG_FILE=logs/app.log>> server\.env

:: 客户端环境变量
echo VITE_API_URL=http://0.0.0.0:3000/api/v1> client\.env

:: 服务器环境变量
echo NODE_ENV=development> server\.env
echo PORT=3000>> server\.env
echo MONGODB_URI=mongodb://localhost:27017/ppm3>> server\.env
echo REDIS_URL=redis://localhost:6379/0>> server\.env
echo JWT_SECRET=ppm3_jwt_secret>> server\.env
echo JWT_EXPIRES_IN=7d>> server\.env
echo LOG_LEVEL=info>> server\.env
echo LOG_FILE=logs/app.log>> server\.env
echo.

echo 环境变量文件创建成功！
echo.

:: 创建日志目录
echo 创建日志目录...
mkdir logs 2>nul
echo.

:: 启动应用
echo 启动PPM 3.0应用...
echo.
echo ================================================
echo 启动完成后，Cloud Studio会自动检测端口并显示访问链接
echo 前端服务: http://0.0.0.0:3001
echo 后端服务: http://0.0.0.0:3000
echo ================================================
echo.

npm run dev
