# 使用 Node.js 22 作为基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 安装 PM2 全局
RUN npm install -g pm2@latest

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建 logs 目录（PM2 需要）
RUN mkdir -p logs

# 暴露端口（从 ecosystem.config.cjs 中获取）
EXPOSE 3001

# 使用 PM2 启动应用
CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--env", "production"]

