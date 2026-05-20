# AgentHub 部署 Runbook

## 前置条件
- Docker & docker-compose
- PostgreSQL 17+
- Node.js 22+ (本地开发)

## 首次部署
1. 克隆代码库
2. 复制环境配置: `cp .env.example .env`
3. 编辑 `.env`，设置 JWT_SECRET(≥32字符)、DATABASE_URL 等
4. 构建并启动: `docker-compose up -d --build`
5. 初始化数据库: `docker-compose exec api pnpm --filter @agenthub/db drizzle-kit migrate`
6. 验证: `curl http://localhost:3001/health`

## 更新部署
1. `git pull`
2. `docker-compose up -d --build api`
3. 运行新 migration: `docker-compose exec api pnpm --filter @agenthub/db drizzle-kit migrate`

## 回滚
1. `docker-compose stop api`  — 停止 API 服务
2. 回滚 API 代码版本:
   - 如有镜像标签: `docker-compose up -d api:<previous-tag>`
   - 如无标签: `git checkout <previous-tag> && docker-compose up -d --build api`
3. DB 回滚: 从备份恢复 `psql <DATABASE_URL> < <备份文件>`
4. 验证服务正常运行: `curl http://localhost:3001/health`

## 监控
- 健康检查: GET /health
- 指标: GET /metrics (Prometheus 格式)
- 日志: `docker-compose logs -f api`

## 故障处理
### API 无法启动
- 检查数据库连接: `pg_isready`
- 检查 JWT_SECRET 配置
- 检查端口冲突: `lsof -i :3001`

### 搜索降级
- Qdrant 不可用时自动降级 ILIKE 搜索
- 检查 Qdrant: `curl http://localhost:6333/healthz`

## 备份
- 每日自动备份: `crontab -e` 添加 `0 2 * * * cd /app && ./scripts/db-backup.sh`
- 手动备份: `./scripts/db-backup.sh`
