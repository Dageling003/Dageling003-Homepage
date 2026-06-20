#!/bin/bash
set -e

ENV_FILE=".env.docker"

echo "==> 构建 app 镜像..."
docker compose --env-file $ENV_FILE build app

echo "==> 构建 caddy 镜像..."
docker compose --env-file $ENV_FILE build caddy

echo "==> 启动服务..."
docker compose --env-file $ENV_FILE up -d

echo "==> 等待服务就绪..."
sleep 10

echo "==> 运行冒烟测试..."
if [ -f scripts/smoke-test.sh ]; then
    bash scripts/smoke-test.sh localhost
else
    echo "  跳过冒烟测试（脚本不存在）"
fi

echo "==> 完成！"
docker compose --env-file $ENV_FILE ps
