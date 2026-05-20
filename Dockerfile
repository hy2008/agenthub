# ==================== 构建阶段 ====================
FROM node:22-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

# ---- 第1层：只复制依赖配置文件（缓存稳定层） ----
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/memory-engine/package.json packages/memory-engine/
COPY packages/shared/package.json packages/shared/
COPY packages/vector/package.json packages/vector/

# ---- 第2层：依赖安装（仅 package.json 变化才重跑） ----
RUN pnpm install --frozen-lockfile

# ---- 第3层：复制全部源码 ----
COPY . .

# ---- 第4层：类型检查 + 编译 ----
RUN pnpm -r exec tsc --noEmit
RUN pnpm --filter @agenthub/api build

# ==================== 运行阶段 ====================
FROM node:22-alpine AS runner
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

# 复制生产依赖和编译产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

EXPOSE 3001

# 启动 API 服务（生产模式）
CMD ["pnpm", "--filter", "@agenthub/api", "start"]
