#!/usr/bin/env bash
# ====================================
# homepage — MariaDB 数据库备份脚本
# 用法：bash scripts/backup-db.sh [输出目录]
# ====================================
set -euo pipefail

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

# 参数
OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUTPUT_DIR}/homepage_${TIMESTAMP}.sql.gz"

# 检查 .env.docker 是否存在
if [[ ! -f .env.docker ]]; then
  echo -e "${RED}错误：未找到 .env.docker 文件${NC}"
  echo "请先创建环境变量文件：cp docker/.env.example .env.docker"
  exit 1
fi

# 从 .env.docker 读取数据库配置
source .env.docker

DB_CONTAINER="${DB_CONTAINER:-homepage-db}"
DB_USER="${DB_USERNAME:-homepage}"
DB_NAME="${DB_DATABASE:-homepage}"
DB_PASS="${DB_PASSWORD:?DB_PASSWORD 未设置}"

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

echo -e "${YELLOW}正在备份数据库...${NC}"
echo "  容器: ${DB_CONTAINER}"
echo "  数据库: ${DB_NAME}"
echo "  输出: ${BACKUP_FILE}"

# 执行备份（通过 docker exec）
docker exec "${DB_CONTAINER}" \
  mariadb-dump \
    -u "${DB_USER}" \
    -p"${DB_PASS}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "${DB_NAME}" 2>/dev/null \
  | gzip > "${BACKUP_FILE}"

# 验证备份文件
FILE_SIZE=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null || echo "0")
if [[ "${FILE_SIZE}" -lt 100 ]]; then
  echo -e "${RED}错误：备份文件异常（大小 ${FILE_SIZE} 字节），备份可能失败${NC}"
  exit 1
fi

echo -e "${GREEN}备份完成！${NC}"
echo "  文件: ${BACKUP_FILE}"
echo "  大小: $(du -h "${BACKUP_FILE}" | cut -f1)"
echo ""
echo "恢复命令："
echo "  gunzip -c '${BACKUP_FILE}' | docker exec -i ${DB_CONTAINER} mariadb -u ${DB_USER} -p'***' ${DB_NAME}"
echo ""
echo "提示：建议将此脚本加入 crontab 定时执行："
echo "  0 2 * * * cd $(pwd) && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1"
