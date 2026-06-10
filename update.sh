#!/bin/bash
set -e

echo "==> 1. 拉取最新代码..."
git pull origin main

echo "==> 2. 重新构建 app 镜像..."
docker compose --env-file .env.docker build app

echo "==> 3. 重新构建 caddy 镜像..."
docker compose --env-file .env.docker build caddy

echo "==> 4. 重启容器..."
docker compose --env-file .env.docker up -d

echo "==> 5. 清理旧镜像..."
docker image prune -f

echo "==> ✅ 更新完成！"
docker compose --env-file .env.docker ps