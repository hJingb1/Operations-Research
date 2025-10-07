#!/bin/bash
# project-blueprint/entrypoint.sh

app_env=${1:-development}

# 定义我们后端服务的启动文件
# 注意：这里是相对于执行目录 backend/ 的路径
build_target="server.js"

# 进入后端工作目录
cd backend

# Development environment commands
dev_commands() {
    echo "Running development environment commands..."
    NODE_ENV=development node "${build_target}"
}

# Production environment commands
prod_commands() {
    echo "Running production environment commands..."
    NODE_ENV=production node "${build_target}"
}

# Check environment variables to determine the running environment
if [ "$app_env" = "production" ] || [ "$app_env" = "prod" ] ; then
    echo "Production environment detected"
    prod_commands
else
    echo "Development environment detected"
    dev_commands
fi