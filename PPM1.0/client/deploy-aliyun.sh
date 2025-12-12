#!/bin/bash

# 阿里云OSS部署脚本
# 需要先安装阿里云CLI: npm install -g @alicloud/cli

# 配置信息（请替换为您的实际信息）
ACCESS_KEY_ID="your_access_key_id"
ACCESS_KEY_SECRET="your_access_key_secret"
BUCKET_NAME="your-bucket-name"
REGION="oss-cn-hangzhou"
DOMAIN="your-domain.com"  # 可选：自定义域名

# 1. 构建项目
echo "🔨 构建项目..."
npm install
npm run build

# 2. 上传到阿里云OSS
echo "📦 上传到阿里云OSS..."
aliyun oss cp ./dist oss://${BUCKET_NAME}/ --recursive

# 3. 配置静态网站托管
echo "🌐 配置静态网站托管..."
aliyun oss website --bucket ${BUCKET_NAME} --index index.html --error index.html

# 4. 设置读写权限
echo "🔒 设置权限..."
aliyun oss bucket-policy --bucket ${BUCKET_NAME} --policy '{"Version":"1","Statement":[{"Effect":"Allow","Principal":{"RAM":["*"]},"Action":["oss:GetObject"],"Resource":["acs:oss:*:*:'${BUCKET_NAME}'/*"]}]}'

echo "✅ 部署完成！"
echo "🌍 访问地址: https://${BUCKET_NAME}.${REGION}.aliyuncs.com"
if [ ! -z "$DOMAIN" ]; then
    echo "🌍 自定义域名: https://${DOMAIN}"
fi