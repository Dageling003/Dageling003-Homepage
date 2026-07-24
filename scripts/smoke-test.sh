#!/usr/bin/env bash
# ====================================
# homepage — Docker 部署冒烟测试
# 用法：bash scripts/smoke-test.sh [域名或IP]
# ====================================
set -euo pipefail

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

# 参数
TARGET="${1:-localhost}"
# 允许跳过 TLS 校验（自签或证书刚签发未生效时）：INSECURE=1 bash scripts/smoke-test.sh domain
CURL_OPTS=(-s --connect-timeout 5 --max-time 15)
if [ "${INSECURE:-0}" = "1" ]; then
    CURL_OPTS+=(-k)
fi

# 自动判断协议：已含 http(s):// 则直接使用，IP/localhost 用 http，域名用 https
if [[ "$TARGET" =~ ^https?:// ]]; then
    BASE_URL="${TARGET}"
elif [[ "$TARGET" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] \
   || [[ "$TARGET" == "localhost" || "$TARGET" == "127.0.0.1" ]]; then
    BASE_URL="http://${TARGET}"
else
    BASE_URL="https://${TARGET}"
fi

# 测试计数
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
# expected_status 支持用 | 分隔的多个候选值，例如 "403|404"
test_case() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    TOTAL=$((TOTAL + 1))
    echo -n "  测试 ${TOTAL}: ${name} ... "

    status=$(curl "${CURL_OPTS[@]}" -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [[ "|${expected_status}|" == *"|${status}|"* ]]; then
        echo -e "${GREEN}通过${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}失败${NC} (期望: ${expected_status}, 实际: ${status})"
        FAILED=$((FAILED + 1))
    fi
}

# 测试 API 端点
test_api() {
    local name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"

    test_case "$name" "${BASE_URL}${endpoint}" "$expected_status"
}

echo ""
echo -e "${YELLOW}==> 开始冒烟测试: ${BASE_URL}${NC}"
echo ""

# 1. 健康检查
echo "1. 健康检查端点"
test_api "GET /health" "/health" "200"

# 2. 静态资源
echo ""
echo "2. 静态资源"
test_api "GET /" "/" "200"
test_api "GET /admin/" "/admin/" "200"

# 3. API 端点（公开）
echo ""
echo "3. API 公开端点"
test_api "GET /api/config" "/api/config" "200"
test_api "GET /api/auth/has-users" "/api/auth/has-users" "200"

# 4. API 端点（需要认证）
echo ""
echo "4. API 认证端点（应返回 401）"
test_api "GET /api/auth/profile" "/api/auth/profile" "401"
test_api "PUT /api/auth/profile" "/api/auth/profile" "401"

# 5. 文件上传目录（禁止列目录 / 禁止脚本执行）
#    NestJS useStaticAssets 默认关闭目录索引，命中不到具体文件会返回 404，
#    这与 403 一样都属于安全行为，因此两者都算通过。
echo ""
echo "5. 安全测试"
test_api "GET /files/uploads/" "/files/uploads/" "403|404"

# 6. CORS 测试
#    用当前 BASE_URL 自身作为 Origin（属于白名单允许的来源）来验证 CORS 是否生效。
#    之前用 http://example.com 会被后端 CORS 白名单拒绝、不回 CORS 头，这是安全的正确行为，
#    不能用来判定 CORS 未配置。
echo ""
echo "6. CORS 测试"
TOTAL=$((TOTAL + 1))
CORS_HEADERS=$(curl "${CURL_OPTS[@]}" -I -X OPTIONS "${BASE_URL}/api/config" \
    -H "Origin: ${BASE_URL}" \
    -H "Access-Control-Request-Method: GET" \
    2>/dev/null | grep -i "access-control-allow-origin" || echo "")

if [ -n "$CORS_HEADERS" ]; then
    echo -e "  测试 ${TOTAL}: CORS 配置 ... ${GREEN}通过${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "  测试 ${TOTAL}: CORS 配置 ... ${YELLOW}警告${NC} (未检测到 CORS 头)"
    FAILED=$((FAILED + 1))
fi

# 7. 响应时间测试
echo ""
echo "7. 性能测试"
TOTAL=$((TOTAL + 1))
RESPONSE_TIME=$(curl "${CURL_OPTS[@]}" -o /dev/null -w "%{time_total}" "${BASE_URL}/" 2>/dev/null || echo "0")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null | cut -d. -f1 || echo "0")

if [ "${RESPONSE_TIME_MS:-0}" -lt 2000 ]; then
    echo -e "  测试 ${TOTAL}: 首页响应时间 (${RESPONSE_TIME_MS}ms) ... ${GREEN}通过${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "  测试 ${TOTAL}: 首页响应时间 (${RESPONSE_TIME_MS}ms) ... ${YELLOW}警告${NC} (超过 2 秒)"
    FAILED=$((FAILED + 1))
fi

# 汇总
echo ""
echo -e "${YELLOW}==> 测试结果${NC}"
echo "  总计: ${TOTAL}"
echo -e "  通过: ${GREEN}${PASSED}${NC}"
echo -e "  失败: ${RED}${FAILED}${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 存在失败的测试${NC}"
    exit 1
fi
