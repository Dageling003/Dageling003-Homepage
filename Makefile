# ==========================================
# Dageling003-Homepage — 一条命令部署入口
# ==========================================
# make up        # 部署 / 启动（首次自动配置 + 构建 + 拉起）
# make down      # 停止（保留数据）
# make logs      # 实时看日志
# make backup    # 备份数据库
# make dev       # 本地 pnpm 三端并行
# ==========================================

ENV_FILE ?= .env.docker

COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
DC := $(COMPOSE) --env-file $(ENV_FILE)

.DEFAULT_GOAL := help
.PHONY: help up down logs backup dev

help:
	@echo ""
	@echo "  Dageling003-Homepage — 常用命令"
	@echo "  ──────────────────────────────────"
	@echo "  make up        部署 / 启动（首次自动向导 + 构建 + 拉起）"
	@echo "  make down      停止（保留数据）"
	@echo "  make logs      实时看日志"
	@echo "  make backup    备份数据库到 ./backups/"
	@echo "  make dev       本地 pnpm 开发（三端并行）"
	@echo ""
	@echo "  高级用法直接调 scripts/*.sh 或 docker compose，不再包装。"
	@echo ""

up:
	@bash scripts/deploy.sh

down:
	@$(DC) down

logs:
	@$(DC) logs -f

backup:
	@bash scripts/backup-db.sh

dev:
	@pnpm dev
