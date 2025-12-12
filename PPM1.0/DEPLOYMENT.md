# PPM 3.0 项目部署指南

本指南将帮助您将PPM 3.0项目部署到Render平台。

## 1. 准备工作

### 1.1 克隆仓库

首先，您需要将项目克隆到本地：

```bash
git clone <your-repository-url>
cd PPM1.0
```

### 1.2 安装依赖

确保您已安装Node.js和npm。然后安装项目依赖：

```bash
npm install
```

### 1.3 配置环境变量

项目需要以下环境变量：

- `MONGODB_URI`: MongoDB数据库连接字符串
- `REDIS_URL`: Redis连接字符串
- `JWT_SECRET`: JWT令牌加密密钥
- `PORT`: 服务器端口（默认3000）

这些变量将在Render平台上自动配置，无需手动设置。

## 2. 部署到Render平台

### 2.1 使用Render Blueprint部署

Render支持使用Blueprint文件自动部署应用程序。我们已经创建了`render.yaml`文件，其中包含了所有必要的配置。

1. 访问[Render平台](https://render.com/)并登录
2. 点击"New +"按钮，选择"Blueprint"
3. 粘贴您的GitHub仓库URL
4. 点击"Apply"按钮，Render将自动部署您的应用程序

### 2.2 手动部署

如果您想手动部署应用程序，可以按照以下步骤操作：

#### 2.2.1 部署后端服务

1. 点击"New +"按钮，选择"Web Service"
2. 粘贴您的GitHub仓库URL
3. 选择Node.js环境
4. 设置Root Directory为`server`
5. 设置Build Command为`npm install`
6. 设置Start Command为`npm start`
7. 配置环境变量
8. 点击"Create Web Service"按钮

#### 2.2.2 部署前端服务

1. 点击"New +"按钮，选择"Static Site"
2. 粘贴您的GitHub仓库URL
3. 选择Node.js环境
4. 设置Root Directory为`client`
5. 设置Build Command为`npm install && npm run build`
6. 设置Publish Directory为`dist`
7. 配置环境变量
8. 点击"Create Static Site"按钮

#### 2.2.3 部署数据库

1. 点击"New +"按钮，选择"Database"
2. 选择MongoDB
3. 配置数据库设置
4. 点击"Create Database"按钮

#### 2.2.4 部署Redis

1. 点击"New +"按钮，选择"Redis"
2. 配置Redis设置
3. 点击"Create Redis"按钮

## 3. 访问应用程序

部署完成后，您可以通过以下URL访问应用程序：

- 前端服务：`https://ppm3-frontend.onrender.com`
- 后端服务：`https://ppm3-backend.onrender.com`

## 4. 常见问题

### 4.1 部署失败

如果部署失败，请检查以下内容：

1. 确保所有依赖项都已正确安装
2. 检查环境变量是否正确配置
3. 查看部署日志以获取更多信息

### 4.2 应用程序无法连接到数据库

确保您已正确配置`MONGODB_URI`环境变量，并且数据库服务正在运行。

### 4.3 应用程序无法连接到Redis

确保您已正确配置`REDIS_URL`环境变量，并且Redis服务正在运行。

## 5. 性能优化

### 5.1 前端优化

1. 使用生产构建：`npm run build`
2. 启用代码分割
3. 优化图像和资源

### 5.2 后端优化

1. 使用生产环境：`NODE_ENV=production`
2. 启用缓存
3. 优化数据库查询

## 6. 监控和维护

### 6.1 日志

您可以在Render平台上查看应用程序日志：

1. 进入应用程序页面
2. 点击"Logs"标签
3. 查看实时日志

### 6.2 健康检查

您可以在Render平台上配置健康检查：

1. 进入应用程序页面
2. 点击"Settings"标签
3. 配置健康检查路径

### 6.3 自动部署

您可以配置Render在代码提交时自动部署应用程序：

1. 进入应用程序页面
2. 点击"Settings"标签
3. 启用"Auto-Deploy"

## 7. 扩展

### 7.1 增加资源

如果您需要更多资源，可以升级您的Render计划：

1. 进入应用程序页面
2. 点击"Settings"标签
3. 选择"Change Plan"

### 7.2 添加自定义域名

您可以为您的应用程序添加自定义域名：

1. 进入应用程序页面
2. 点击"Settings"标签
3. 配置自定义域名

## 8. 支持

如果您遇到任何问题，可以查看[Render文档](https://render.com/docs)或联系Render支持团队。

---

**作者**：Lenovo PPM Team
**版本**：1.0.0
**更新日期**：2024-01-20