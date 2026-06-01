# 多阶段构建：第一阶段 - 构建前端
FROM node:20-alpine AS builder

# 更换Alpine镜像源为清华大学
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 安装构建工具
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package.json package-lock.json ./

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装所有依赖（包括开发依赖用于构建前端）
RUN npm ci

# 复制应用代码
COPY . .

# 构建前端（包含代码压缩和图片优化）
RUN npm run build:prod

# 第二阶段：生产运行环境
FROM node:20-alpine

# 更换Alpine镜像源为清华大学
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 只安装生产环境必要的系统依赖
RUN apk add --no-cache tini

# --- Puppeteer 相关的配置和安装 ---
ENV PUPPETEER_SKIP_DOWNLOAD=true
# 如果不需要PDF生成功能，可以移除chromium以减小镜像体积
# RUN apk add --no-cache chromium
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# --- Puppeteer 相关的配置和安装 ---

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# 设置npm镜像源并安装生产依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci --omit=dev && \
    npm cache clean --force

# 创建数据目录用于SQLite数据库
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8000

# 暴露端口
EXPOSE 8000

# 使用tini作为init系统，正确处理信号
ENTRYPOINT ["/sbin/tini", "--"]

# 启动应用
CMD ["node", "server/index.cjs"]
