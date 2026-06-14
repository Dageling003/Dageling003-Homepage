#!/usr/bin/env bash
# ====================================
# homepage — Docker 服务健康检查
# 用法：bash scripts/docker-health.sh
# ====================================
set -euo pipefail

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

ENV_FILE=".env.docker"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}错误：未找到 ${ENV_FILE} 文件${NC}"
    echo "请先运行: bash deploy.sh"
    exit 1
fi

echo ""
echo -e "${YELLOW}==> 检查 Docker 服务状态${NC}"
echo ""

# 检查容器状态
echo "1. 容器状态"
docker compose --env-file "$ENV_FILE" ps

# 检查健康状态
echo ""
echo "2. 健康状态"
HEALTHY=$(docker compose --env-file "$ENV_FILE" ps --format json 2>/dev/null | grep -c '"healthy"' || echo "0")
UNHEALTHY=$(docker compose --env-file "$ENV_FILE" ps --format json 2>/dev/null | grep -c '"unhealthy"' || echo "0")
TOTAL=$(docker compose --env-file "$ENV_FILE" ps --format json 2>/dev/null | wc -l || echo "0")

echo -e "  总容器数: ${TOTAL}"
echo -e "  健康:     ${GREEN}${HEALTHY}${NC}"
echo -e "  不健康:   ${RED}${UNHEALTHY}${NC}"

# 检查端口监听
echo ""
echo "3. 端口监听"
if command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | grep -E ':(80|443|8000)\s' || echo "  未检测到服务端口"
elif command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -E ':(80|443|8000)\s' || echo "  未检测到服务端口"
else
    echo -e "  ${YELLOW}警告：无法检测端口状态${NC}"
fi

# 检查日志错误
echo ""
echo "4. 最近错误日志"
docker compose --env-file "$ENV_FILE" logs --tail=50 2>&1 | grep -i "error\|fail\|exception" | tail -5 || echo "  未发现错误"

# 健康检查端点
echo ""
echo "5. API 健康检查"
if curl -s http://localhost/health 2>/dev/null | grep -q '"status":"ok"'; then
    echo -e "  ${GREEN}✓${NC} API 健康检查通过"
else
    echo -e "  ${RED}✗${NC} API 健康检查失败"
fi

echo ""
echo -e "${YELLOW}==> 检查完成${NC}"
