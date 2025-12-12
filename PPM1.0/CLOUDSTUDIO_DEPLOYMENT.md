# 腾讯云Cloud Studio 部署指南

本指南将帮助您在腾讯云Cloud Studio上部署PPM 3.0项目，无需任何token令牌和密码认证即可直接访问应用。

## 1. 准备工作

### 1.1 登录Cloud Studio

1. 访问[腾讯云Cloud Studio官网](https://cloud.tencent.com/product/cloudstudio)
2. 点击"立即使用"按钮
3. 使用微信扫码或腾讯云账号登录

### 1.2 创建工作空间

1. 登录后，点击"新建工作空间"按钮
2. 选择"自定义模板"
3. 输入工作空间名称（如`ppm3`）
4. 选择"Node.js"环境
5. 选择工作空间规格（免费版1核2G即可）
6. 点击"创建"按钮

## 2. 部署项目

### 2.1 克隆代码

在Cloud Studio终端中执行以下命令：

```bash
# 克隆项目代码
git clone <your-repository-url>
cd PPM1.0
```

### 2.2 安装依赖

```bash
# 安装项目依赖
npm install
```

### 2.3 配置环境变量

1. 在项目根目录创建`.env`文件：

```bash
# 根目录环境变量配置
NODE_ENV=development
PORT=3000
```

2. 在`client`目录创建`.env`文件：

```bash
# 客户端环境变量配置
VITE_API_URL=http://localhost:3000/api/v1
```

3. 在`server`目录创建`.env`文件：

```bash
# 服务器环境变量配置
NODE_ENV=development
PORT=3000

# 数据库配置（使用内存数据库或本地MongoDB）
MONGODB_URI=mongodb://localhost:27017/ppm3

# Redis配置（使用内存缓存或本地Redis）
REDIS_URL=redis://localhost:6379/0

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 2.4 启动应用

在项目根目录执行以下命令，同时启动前端和后端服务：

```bash
# 启动开发服务器
npm run dev
```

### 2.5 访问应用

启动成功后，Cloud Studio会自动检测到端口并显示访问链接：

1. 后端服务：`http://localhost:3000`
2. 前端服务：`http://localhost:3001`

点击链接即可访问应用。

## 3. 配置持久化存储（可选）

如果您希望数据持久化，可以配置Cloud Studio的持久化存储：

1. 点击工作空间右上角的"设置"按钮
2. 选择"存储配置"
3. 启用"持久化存储"
4. 配置存储路径和大小
5. 点击"保存"按钮

## 4. 常见问题

### 4.1 端口冲突

如果端口被占用，可以修改环境变量中的端口配置：

```bash
# 修改服务器端口
PORT=3002

# 修改客户端端口
DEV_PORT=3003
```

### 4.2 依赖安装失败

如果依赖安装失败，可以尝试清理npm缓存：

```bash
# 清理npm缓存
npm cache clean --force

# 重新安装依赖
npm install
```

### 4.3 服务启动失败

检查日志文件以了解失败原因：

```bash
# 查看服务器日志
cat logs/app.log

# 查看前端构建日志
npm run build
```

## 5. 部署到生产环境（可选）

如果您需要部署到生产环境，可以执行以下步骤：

### 5.1 构建前端

```bash
# 构建前端应用
npm run build --workspace=client
```

### 5.2 启动生产服务器

```bash
# 启动生产服务器
NODE_ENV=production npm start
```

### 5.3 配置反向代理

可以使用Nginx配置反向代理，将前端和后端服务映射到同一域名：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端配置
    location / {
        root /path/to/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端配置
    location /api/v1 {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 6. 总结

通过本指南，您可以在腾讯云Cloud Studio上成功部署PPM 3.0项目，无需任何token令牌和密码认证即可直接访问应用。Cloud Studio提供了免费的开发环境和50000分钟的免费使用时长，非常适合个人开发和测试。

如果您在部署过程中遇到任何问题，可以查看Cloud Studio的官方文档或联系腾讯云技术支持。

---

**作者**：Lenovo PPM Team
**版本**：1.0.0
**更新日期**：2024-01-20