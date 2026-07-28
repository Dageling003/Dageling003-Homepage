#!/usr/bin/env bash
# ===================================================
# homepage — 首次部署一键脚本
# ===================================================
# 用法：
#   bash scripts/first-deploy.sh                    # 向导模式
#   DOMAIN=dageling003.top bash scripts/first-deploy.sh  # 指定域名
#   CI=true bash scripts/first-deploy.sh            # 全自动模式
# ===================================================
set -euo pipefail

# ====== 颜色 ======
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }

# ====== 工具函数 ======
rand_hex() {
    openssl rand -hex "$1" 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | head -c "$(( $1 * 2 ))"
}

derive_proto() {
    local d="${1:-localhost}"
    if [[ "$d" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] \
       || [[ "$d" == "localhost" || "$d" == "127.0.0.1" ]]; then
        echo "http"
    else
        echo "https"
    fi
}

can_prompt() {
    [ -e /dev/tty ] && [ -r /dev/tty ]
}

ask() {
    local prompt="$1"
    local __var="$2"
    if can_prompt; then
        read -rp "$prompt" "$__var" </dev/tty
    else
        eval "$__var=\"\""
    fi
}

# ====== 1. 环境检查 ======
echo ""
echo -e "${BOLD}==> 1/4 检查运行环境${NC}"

if command -v docker &>/dev/null; then
    ok "Docker $(docker --version 2>/dev/null | grep -o '[0-9.]*' | head -1)"
else
    err "Docker 未安装"
    echo "  安装命令: curl -fsSL https://get.docker.com | bash"
    exit 1
fi

COMPOSE_CMD=""
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
    ok "Docker Compose (v2)"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
    ok "Docker Compose (v1)"
else
    err "Docker Compose 未安装"
    exit 1
fi

# ====== 2. 配置生成 ======
echo ""
echo -e "${BOLD}==> 2/4 生成配置${NC}"

ENV_FILE=".env.docker"

# 如果已有 .env.docker，先备份
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%s)"
    ok "已备份现有 .env.docker"
fi

# 域名
DOMAIN="${DOMAIN:-}"
if [ -z "$DOMAIN" ]; then
    if can_prompt; then
        echo ""
        echo -e "  ${CYAN}域名 / IP${NC}"
        read -rp "  → DOMAIN: " DOMAIN </dev/tty
    else
        err "非交互模式必须通过 DOMAIN=xxx 传入域名"
        exit 1
    fi
fi
DOMAIN="${DOMAIN:-localhost}"
ok "域名: $DOMAIN"

# 自动生成安全参数
JWT_SECRET=$(rand_hex 32)
SETUP_TOKEN=$(rand_hex 24)
DEFAULT_ADMIN_PASSWORD=$(rand_hex 12)
DB_ROOT_PASSWORD=$(rand_hex 20)
DB_USERNAME="homepage"
DB_PASSWORD=$(rand_hex 20)
DB_DATABASE="homepage"

ok "JWT_SECRET 已生成"
ok "SETUP_TOKEN 已生成"
ok "DEFAULT_ADMIN_PASSWORD 已生成"

# ACME 邮箱
ACME_EMAIL="${ACME_EMAIL:-}"
if can_prompt && [[ ! "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && [[ "$DOMAIN" != "localhost" ]]; then
    echo ""
    echo -e "  ${CYAN}HTTPS 证书邮箱${NC} (推荐，用于证书到期提醒)"
    read -rp "  → ACME_EMAIL (回车跳过): " ACME_EMAIL </dev/tty
fi

if [ -n "$ACME_EMAIL" ]; then
    ACME_CA="https://acme.zerossl.com/v2/DV90"
    ok "ACME: ZeroSSL ($ACME_EMAIL)"
else
    ACME_CA="https://acme-v02.api.letsencrypt.org/directory"
    ok "ACME: Let's Encrypt (匿名)"
fi

# 写入 .env.docker
cat > "$ENV_FILE" <<EOF
# homepage Docker 部署环境变量 — $(date '+%Y-%m-%d %H:%M:%S') 自动生成
# 包含敏感信息，请妥善保管！切勿提交至 Git。
DOMAIN=${DOMAIN}
JWT_SECRET=${JWT_SECRET}
DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD}
SETUP_TOKEN=${SETUP_TOKEN}
ACME_CA=${ACME_CA}
ACME_EMAIL=${ACME_EMAIL}
DB_TYPE=sqlite
DB_SQLITE_PATH=/app/data/homepage.sqlite
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}
DB_SYNCHRONIZE=true
BUILDER_IMAGE=
RUNTIME_IMAGE=
MARIADB_IMAGE=docker.1ms.run/library/mariadb:11.4
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_REJECT_UNAUTHORIZED=true
PUBLIC_ADMIN_URL=
EOF

ok ".env.docker 已生成"

# ====== 3. 构建 & 启动 ======
echo ""
echo -e "${BOLD}==> 3/4 构建镜像 & 启动服务${NC}"

info "构建 app 镜像..."
$COMPOSE_CMD --env-file "$ENV_FILE" build app
ok "app 镜像构建完成"

info "构建 caddy 镜像..."
$COMPOSE_CMD --env-file "$ENV_FILE" build caddy
ok "caddy 镜像构建完成"

info "启动服务..."
$COMPOSE_CMD --env-file "$ENV_FILE" up -d
ok "服务已启动"

# 等待就绪
echo ""
info "等待服务就绪 (最多 90s)..."
ATTEMPTS=0
READY=false
while [ $ATTEMPTS -lt 45 ]; do
    if $COMPOSE_CMD --env-file "$ENV_FILE" ps 2>/dev/null | grep -qE 'homepage-app.*healthy'; then
        READY=true
        break
    fi
    printf "."
    sleep 2
    ATTEMPTS=$((ATTEMPTS + 1))
done
echo ""

if "$READY"; then
    ok "服务就绪 (${ATTEMPTS} 次检查)"
else
    warn "服务未在 90s 内就绪，请手动检查: $COMPOSE_CMD --env-file $ENV_FILE logs app"
fi

# ====== 4. 结果输出 ======
PROTO=$(derive_proto "$DOMAIN")
ROOT="${PROTO}://${DOMAIN}"
ADMIN_URL="${ROOT}/admin/"
SETUP_URL="${ROOT}/admin/setup"

echo ""
echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}  ║          🎉 部署完成！                    ║${NC}"
echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}📌  网站主页${NC}"
echo -e "  ──────────────────────────────────"
echo -e "  ${CYAN}${ROOT}/${NC}"
echo ""
echo -e "  ${BOLD}📌  后台管理${NC}"
echo -e "  ──────────────────────────────────"
echo -e "  ${CYAN}${ADMIN_URL}${NC}"
echo ""
echo -e "  ${YELLOW}${BOLD}🔐  管理员账号（首次登录后请修改密码）${NC}"
echo -e "  ──────────────────────────────────"
echo -e "  用户名：    ${YELLOW}admin${NC}"
echo -e "  密  码：    ${YELLOW}${DEFAULT_ADMIN_PASSWORD}${NC}"
echo ""
echo -e "  ${BOLD}🔑  Setup Token${NC}"
echo -e "  ──────────────────────────────────"
echo -e "  ${YELLOW}${SETUP_TOKEN}${NC}"
echo ""
echo -e "  ${BOLD}🛠   常用命令${NC}"
echo -e "  ──────────────────────────────────"
echo "    $COMPOSE_CMD --env-file $ENV_FILE ps             # 服务状态"
echo "    $COMPOSE_CMD --env-file $ENV_FILE logs -f app    # 实时日志"
echo "    $COMPOSE_CMD --env-file $ENV_FILE down           # 停止"
echo ""

# 清理旧镜像
docker image prune -f &>/dev/null || true
