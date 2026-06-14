#!/bin/bash
set -e

ENV_FILE=".env.docker"

echo "==> 构建 app 镜像..."
docker compose --env-file $ENV_FILE build app

echo "==> 构建 caddy 镜像..."
docker compose --env-file $ENV_FILE build caddy

echo "==> 启动服务..."
docker compose --env-file $ENV_FILE up -d

echo "==> 完成！"
docker compose --env-file $ENV_FILE ps
