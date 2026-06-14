#!/usr/bin/env bash
# ====================================
# homepage — 域名访问验证脚本
# 用法：bash scripts/domain-check.sh [域名]
# ====================================
set -euo pipefail

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

# 参数
DOMAIN="${1:-}"
ENV_FILE=".env.docker"

if [ -z "$DOMAIN" ]; then
    if [ -f "$ENV_FILE" ]; then
        DOMAIN=$(grep "^DOMAIN=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' || echo "")
    fi
fi

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}错误：请提供域名参数或确保 .env.docker 存在${NC}"
    echo "用法: bash scripts/domain-check.sh [域名]"
    exit 1
fi

echo ""
echo -e "${YELLOW}==> 验证域名访问: ${DOMAIN}${NC}"
echo ""

# 检测协议
if [[ "$DOMAIN" =~ ^https?:// ]]; then
    URL="${DOMAIN}"
elif [[ "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] \
   || [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
    URL="http://${DOMAIN}"
else
    URL="https://${DOMAIN}"
fi

# 1. HTTP/HTTPS 访问
echo "1. HTTP/HTTPS 访问"

echo -n "  主页面 ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}通过${NC} (${STATUS})"
else
    echo -e "${RED}失败${NC} (${STATUS})"
fi

echo -n "  管理后台 ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${URL}/admin/" 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}通过${NC} (${STATUS})"
else
    echo -e "${RED}失败${NC} (${STATUS})"
fi

echo -n "  API 端点 ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${URL}/api/config" 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}通过${NC} (${STATUS})"
else
    echo -e "${RED}失败${NC} (${STATUS})"
fi

# 2. 性能测试
echo ""
echo "2. 性能测试"

echo -n "  首页响应时间 ... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$URL" 2>/dev/null || echo "0")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null | cut -d. -f1 || echo "0")

if [ "${RESPONSE_TIME_MS:-0}" -lt 1000 ]; then
    echo -e "${GREEN}优秀${NC} (${RESPONSE_TIME_MS}ms)"
elif [ "${RESPONSE_TIME_MS:-0}" -lt 2000 ]; then
    echo -e "${YELLOW}一般${NC} (${RESPONSE_TIME_MS}ms)"
else
    echo -e "${RED}较慢${NC} (${RESPONSE_TIME_MS}ms)"
fi

echo -n "  API 响应时间 ... "
API_TIME=$(curl -s -o /dev/null -w "%{time_total}" "${URL}/api/config" 2>/dev/null || echo "0")
API_TIME_MS=$(echo "$API_TIME * 1000" | bc 2>/dev/null | cut -d. -f1 || echo "0")

if [ "${API_TIME_MS:-0}" -lt 500 ]; then
    echo -e "${GREEN}优秀${NC} (${API_TIME_MS}ms)"
elif [ "${API_TIME_MS:-0}" -lt 1000 ]; then
    echo -e "${YELLOW}一般${NC} (${API_TIME_MS}ms)"
else
    echo -e "${RED}较慢${NC} (${API_TIME_MS}ms)"
fi

echo ""
echo -e "${YELLOW}==> 验证完成${NC}"
