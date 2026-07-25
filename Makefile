# ==========================================
# Dageling003-Homepage — 一条命令部署入口
# ==========================================
# make up        # 部署 / 启动（首次自动配置 + 构建 + 拉起）
# make down      # 停止（保留数据）
# make restart   # 重启 app
# make logs      # 实时看日志
# make ps        # 查看容器
# make update    # 拉最新代码 + 重建
# make backup    # 备份数据库
# make smoke     # 冒烟测试
# make dev       # 本地 pnpm 三端并行
# make clean     # 停并清卷（危险，需二次确认）
# ==========================================

ENV_FILE ?= .env.docker

COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
DC := $(COMPOSE) --env-file $(ENV_FILE)

.DEFAULT_GOAL := help
.PHONY: help up down restart logs ps update backup smoke dev clean install lint build

help:
	@echo ""
	@echo "  Dageling003-Homepage — 常用命令"
	@echo "  ──────────────────────────────────"
	@echo "  make up        部署 / 启动（首次自动向导 + 构建 + 拉起）"
	@echo "  make down      停止（保留数据）"
	@echo "  make restart   重启 app 容器"
	@echo "  make logs      实时看日志"
	@echo "  make ps        查看容器"
	@echo "  make update    拉最新代码 + 重建"
	@echo "  make backup    备份数据库到 ./backups/"
	@echo "  make smoke     冒烟测试"
	@echo "  make dev       本地 pnpm 开发（三端并行）"
	@echo "  make clean     停并清卷（危险，会问 y/N）"
	@echo ""

up:
	@bash scripts/deploy.sh

down:
	@$(DC) down

restart:
	@$(DC) restart app

logs:
	@$(DC) logs -f

ps:
	@$(DC) ps

update:
	@bash scripts/update.sh

backup:
	@bash scripts/backup-db.sh

smoke:
	@bash scripts/smoke-test.sh

dev:
	@pnpm dev

install:
	@pnpm install

lint:
	@pnpm lint

build:
	@pnpm build

clean:
	@read -p "⚠  会停止服务并删除数据卷，输入 y 继续: " ans; \
	if [ "$$ans" = "y" ]; then \
		$(DC) down -v; \
		rm -f $(ENV_FILE); \
		echo "已清空 $(ENV_FILE) 与数据卷"; \
	else \
		echo "已取消"; \
	fi
