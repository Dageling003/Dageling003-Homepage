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

echo "==> 5. 等待服务就绪..."
sleep 10

echo "==> 6. 运行冒烟测试..."
if [ -f scripts/smoke-test.sh ]; then
    # 从 .env.docker 读出 DOMAIN，避免用 localhost 命中 Caddy 的 308 自动跳 HTTPS
    SMOKE_TARGET="localhost"
    if [ -f .env.docker ]; then
        ENV_DOMAIN=$(grep -E '^DOMAIN=' .env.docker | tail -n1 | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs || true)
        if [ -n "${ENV_DOMAIN:-}" ] && [ "$ENV_DOMAIN" != "your-domain-or-ip" ]; then
            SMOKE_TARGET="$ENV_DOMAIN"
        fi
    fi
    echo "  目标: $SMOKE_TARGET"
    bash scripts/smoke-test.sh "$SMOKE_TARGET"
else
    echo "  跳过冒烟测试（脚本不存在）"
fi

echo "==> 7. 清理旧镜像..."
docker image prune -f

echo "==> ✅ 更新完成！"
docker compose --env-file .env.docker ps