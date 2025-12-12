# PPM 3.0 前端国内部署指南

## 🇨🇳 国内可访问的部署方案

### 方案1：Gitee Pages（推荐新手）

#### 步骤：
1. **创建Gitee仓库**
   - 访问 [gitee.com](https://gitee.com)
   - 创建新仓库 `ppm3-client`

2. **推送代码到Gitee**
   ```bash
   git remote add gitee https://gitee.com/your-username/ppm3-client.git
   git add .
   git commit -m "Init PPM 3.0 client"
   git push gitee main
   ```

3. **启用Pages服务**
   - 进入仓库 → 服务 → Gitee Pages
   - 选择分支 `main`
   - 部署目录 `/dist`
   - 点击启动

4. **访问地址**
   - `https://your-username.gitee.io/ppm3-client`

### 方案2：腾讯云静态网站托管（推荐企业）

#### 步骤：
1. **登录腾讯云**
   - 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
   - 搜索"静态网站托管"

2. **创建托管环境**
   - 新建环境
   - 选择免费版（1GB存储）

3. **上传文件**
   ```bash
   # 使用腾讯云CLI
   npm install -g @cloudbase/cli
   tcb hosting deploy ./dist -e your-env-id
   ```

4. **访问地址**
   - `https://your-env-id.service.tcloudbase.com`

### 方案3：阿里云OSS + CDN（推荐大型项目）

#### 步骤：
1. **创建OSS Bucket**
   - 访问 [阿里云OSS控制台](https://oss.console.aliyun.com/)
   - 创建Bucket，选择"公共读"

2. **配置静态网站**
   - 在Bucket设置中启用"静态网站托管"
   - 默认首页：`index.html`

3. **上传文件**
   ```bash
   # 安装阿里云CLI
   npm install -g @alicloud/oss-cli
   ossutil cp ./dist oss://your-bucket/ --recursive
   ```

4. **配置CDN（可选）**
   - 添加CDN域名加速

### 方案4：GitHub + 国内镜像（推荐开发者）

#### 步骤：
1. **GitHub源码托管**
   - 使用GitHub作为代码仓库
   - 配置自动化构建

2. **使用国内CDN服务**
   - 腾讯云CDN
   - 阿里云CDN
   - 又拍云CDN

## 🔧 构建优化配置

### Vite配置优化（vite.config.js）
```javascript
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          utils: ['axios', 'react-router-dom']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### 环境变量配置
创建 `.env.production`：
```env
VITE_API_URL=https://your-api-domain.com/api/v1
VITE_APP_TITLE=PPM 3.0
VITE_APP_ENV=production
```

## 📊 方案对比

| 方案 | 免费额度 | 速度 | 配置复杂度 | 推荐场景 |
|------|----------|------|------------|----------|
| Gitee Pages | 1GB | 快 | 简单 | 个人项目 |
| 腾讯云静态托管 | 1GB/月 | 很快 | 中等 | 企业项目 |
| 阿里云OSS | 5GB | 很快 | 复杂 | 大型项目 |
| GitHub+CDN | 无限制 | 一般 | 复杂 | 开发者 |

## 🚀 快速部署脚本

选择任意方案后，执行：

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 部署（选择对应方案）
# Gitee: 手动上传dist文件夹
# 腾讯云: tcb hosting deploy ./dist -e your-env-id
# 阿里云: ossutil cp ./dist oss://your-bucket/ --recursive
```

## 📱 移动端优化建议

1. **启用PWA**：添加manifest.json
2. **图片优化**：使用WebP格式
3. **懒加载**：优化首屏加载速度
4. **CDN加速**：使用国内CDN服务

---

📞 如需帮助，请联系开发团队