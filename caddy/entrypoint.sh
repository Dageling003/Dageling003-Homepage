#!/bin/sh
# Caddy entrypoint — handles optional ACME_EMAIL
# 规则：
#   - 空          → 移除 email 指令，Caddy 自动生成账号（ZeroSSL 有时会失败但不会拒绝启动）
#   - 占位符 / 明显无效 → fail-fast 拒绝启动，避免证书申请阶段才发现（那时已经 Rate-limit 计数）
#   - 合法邮箱    → 直接使用
#
# 与 apps/backend/src/main.ts 里 JWT_SECRET / SETUP_TOKEN 的守护逻辑同一思路：
# 关键配置为占位符 = 立即报错，不给你在生产上跑起来的机会。

set -eu

PLACEHOLDER_EMAILS="your-email@example.com you@example.com admin@example.com"

if [ -z "${ACME_EMAIL:-}" ]; then
    sed -i '/email.*ACME_EMAIL/d' /etc/caddy/Caddyfile
else
    # 占位符检查
    for placeholder in $PLACEHOLDER_EMAILS; do
        if [ "$ACME_EMAIL" = "$placeholder" ]; then
            echo ""
            echo "  ⛔  CONFIG ERROR: ACME_EMAIL is still the placeholder value ('$ACME_EMAIL')."
            echo ""
            echo "     Using this to request a real TLS certificate will fail and count"
            echo "     against ACME rate limits (ZeroSSL / Let's Encrypt). Either:"
            echo "       • Set ACME_EMAIL to your real email in docker/.env.docker, OR"
            echo "       • Leave ACME_EMAIL empty to let Caddy auto-generate an anonymous account."
            echo ""
            exit 1
        fi
    done
    # 基本邮箱格式校验（不做完整 RFC5322，只挡明显错的）
    case "$ACME_EMAIL" in
        *@*.*) : ;;
        *)
            echo ""
            echo "  ⛔  CONFIG ERROR: ACME_EMAIL='$ACME_EMAIL' does not look like an email address."
            echo "     Expected format: user@example.com   (or leave empty to auto-generate)"
            echo ""
            exit 1
            ;;
    esac
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
