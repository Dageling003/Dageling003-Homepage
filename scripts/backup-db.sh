#!/usr/bin/env bash
# ====================================
# homepage — 数据库备份脚本（SQLite / MariaDB 双支持）
# 用法：bash scripts/backup-db.sh [输出目录]
#
# 根据 .env.docker 中 DB_TYPE 自动选择备份方式：
#   DB_TYPE=sqlite  → docker cp 单文件 + gzip
#   DB_TYPE=mariadb → docker exec mariadb-dump | gzip
# 无 .env.docker（本地开发场景）时按 DB_TYPE 环境变量或 sqlite 默认处理。
# ====================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ====== 加载配置 ======
if [[ -f .env.docker ]]; then
    # 只 source 变量赋值行，避免注释里的中文触发 shell 报错
    set -a
    # shellcheck disable=SC1091
    source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.docker)
    set +a
elif [[ -f apps/backend/.env ]]; then
    set -a
    # shellcheck disable=SC1091
    source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' apps/backend/.env)
    set +a
fi

DB_TYPE="${DB_TYPE:-sqlite}"

mkdir -p "${OUTPUT_DIR}"

backup_sqlite() {
    local container="${APP_CONTAINER:-homepage-app}"
    local sqlite_path="${DB_SQLITE_PATH:-/app/data/homepage.sqlite}"
    local backup_file="${OUTPUT_DIR}/homepage_${TIMESTAMP}.sqlite.gz"

    echo -e "${YELLOW}正在备份 SQLite 数据库...${NC}"
    echo "  容器: ${container}"
    echo "  路径: ${sqlite_path}"
    echo "  输出: ${backup_file}"

    if ! docker inspect "${container}" >/dev/null 2>&1; then
        echo -e "${RED}错误：容器 ${container} 不存在，是否已启动？${NC}"
        echo "  运行：docker compose --env-file .env.docker up -d"
        exit 1
    fi

    # 用 docker cp 走磁盘，避免大文件走 stdout OOM
    local tmp
    tmp=$(mktemp)
    trap 'rm -f "$tmp"' EXIT
    docker cp "${container}:${sqlite_path}" "${tmp}"
    gzip -c "${tmp}" > "${backup_file}"

    local size
    size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}" 2>/dev/null || echo "0")
    if [[ "${size}" -lt 100 ]]; then
        echo -e "${RED}错误：备份文件异常（大小 ${size} 字节），备份可能失败${NC}"
        exit 1
    fi

    echo -e "${GREEN}备份完成！${NC}"
    echo "  文件: ${backup_file}"
    echo "  大小: $(du -h "${backup_file}" | cut -f1)"
    echo ""
    echo "恢复命令："
    echo "  gunzip -c '${backup_file}' > /tmp/homepage.sqlite"
    echo "  docker cp /tmp/homepage.sqlite ${container}:${sqlite_path}"
    echo "  docker compose --env-file .env.docker restart app"
}

backup_mariadb() {
    local container="${DB_CONTAINER:-homepage-db}"
    local user="${DB_USERNAME:-homepage}"
    local name="${DB_DATABASE:-homepage}"
    local pass="${DB_PASSWORD:?DB_PASSWORD 未设置（MariaDB 模式必填）}"
    local backup_file="${OUTPUT_DIR}/homepage_${TIMESTAMP}.sql.gz"

    echo -e "${YELLOW}正在备份 MariaDB 数据库...${NC}"
    echo "  容器: ${container}"
    echo "  数据库: ${name}"
    echo "  输出: ${backup_file}"

    if ! docker inspect "${container}" >/dev/null 2>&1; then
        echo -e "${RED}错误：容器 ${container} 不存在${NC}"
        echo "  MariaDB 模式需要 --profile mariadb 启动："
        echo "  docker compose --profile mariadb --env-file .env.docker up -d"
        exit 1
    fi

    docker exec "${container}" \
        mariadb-dump \
            -u "${user}" \
            -p"${pass}" \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            "${name}" 2>/dev/null \
        | gzip > "${backup_file}"

    local size
    size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}" 2>/dev/null || echo "0")
    if [[ "${size}" -lt 100 ]]; then
        echo -e "${RED}错误：备份文件异常（大小 ${size} 字节），备份可能失败${NC}"
        exit 1
    fi

    echo -e "${GREEN}备份完成！${NC}"
    echo "  文件: ${backup_file}"
    echo "  大小: $(du -h "${backup_file}" | cut -f1)"
    echo ""
    echo "恢复命令："
    echo "  gunzip -c '${backup_file}' | docker exec -i ${container} mariadb -u ${user} -p'***' ${name}"
}

case "${DB_TYPE,,}" in
    sqlite|better-sqlite3|sqljs)
        backup_sqlite
        ;;
    mariadb|mysql)
        backup_mariadb
        ;;
    *)
        echo -e "${RED}错误：未知 DB_TYPE='${DB_TYPE}'（仅支持 sqlite / mariadb）${NC}"
        exit 1
        ;;
esac

echo ""
echo "提示：建议将此脚本加入 crontab 定时执行："
echo "  0 2 * * * cd $(pwd) && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1"
