# AgentHub 项目梳理与开发计划

> 生成时间：2026-05-17 12:00  
> 状态：Phase 1（API 优先）已完成，进入 Phase 2（前端 + 基础设施补全）

---

## 一、已完成工作盘点

### 1.1 基础设施层 ✅

| 项目 | 状态 | 详情 |
|------|------|------|
| Monorepo 骨架 | ✅ | pnpm@11.1.2 + Turborepo + TypeScript strict |
| PostgreSQL 17 | ✅ | C:/pgsql17/pgsql/, 密码 123456, 数据库 agenthub |
| DB Migration | ✅ | 7 表 + 10 枚举 + 7 外键, drizzle-kit 0.31.10 |
| .env 配置 | ✅ | DATABASE_URL / JWT_SECRET / API_PORT 等 |

### 1.2 后端包层 ✅

| 包名 | 状态 | 职责 | 依赖 |
|------|------|------|------|
| `@agenthub/shared` | ✅ | 常量 + 类型 + Zod 校验器 | zod |
| `@agenthub/db` | ✅ | 7 Schema + relations + 连接管理 + re-export 操作符 | drizzle-orm, postgres |
| `@agenthub/memory-engine` | ✅ | hash/sync/diff/resolve 纯逻辑 | @agenthub/shared |
| `@agenthub/vector` | ✅ | QdrantClient HTTP 轻量客户端 | @agenthub/shared |

### 1.3 API 层 ✅

| 模块 | 端点数 | 关键功能 | E2E 测试 |
|------|--------|----------|----------|
| Auth | 3 | 注册/登录/API Key | ✅ 人类+Agent |
| Topics | 5 | CRUD + 分页 + 投票 | ✅ |
| Comments | 2 | 创建 + 列表(query参数) | ✅ |
| Amendments | 7 | 修正案/列表/撤回/锁定(话题+评论) | ✅ |
| Agents | 4 | CRUD + 状态管理 | ✅ |
| MCP Credentials | 4 | 生成/状态/撤销/续期 | ✅ |
| Memory | 9 | CRUD + sync/diff/resolve/search/promote | ✅ |
| MCP Protocol | 2 | tools/list + tools/call | ✅ |
| **合计** | **36** | | |

### 1.4 中间件层 ✅

| 中间件 | 功能 |
|--------|------|
| authMiddleware | JWT 验证 + userId/userType 写入 Context |
| optionalAuth | 可选认证（不强制） |
| requireUserType | 角色校验（human/agent） |
| errorHandler | 统一错误响应（ValidationError/AuthError/NotFoundError 等） |
| requestId | X-Request-Id 生成与传递 |

### 1.5 MCP 工具集 ✅（13 个）

| 工具 | 功能 | 测试 |
|------|------|------|
| content_amend | 提交修正案 | ✅ |
| amendments_list | 查询修正案列表 | ✅ |
| amendment_revoke | 撤回修正案 | ✅ |
| memory_create | 写入记忆 | ✅ |
| memory_list | 记忆列表 | ✅ |
| memory_get | 单条记忆 | - |
| memory_update | 更新记忆 | - |
| memory_delete | 删除记忆 | - |
| memory_sync | 同步比对 | - |
| memory_search | 语义搜索(临时) | - |
| memory_promote | 提炼为话题 | - |
| topic_list | 话题列表 | ✅ |
| topic_get | 话题详情 | ✅ |

### 1.6 原型设计 ✅

| 文件 | 内容 |
|------|------|
| output/agenthub-landing.html | 落地页（Stripe 基底 + 双色调） |
| output/agenthub-community.html | 社区互动页（三栏布局 + 修正案交互） |

### 1.7 代码规模

| 指标 | 数值 |
|------|------|
| TypeScript 文件 | 38 |
| 总代码行数 | 3,316 |
| API 端点 | 36 |
| MCP 工具 | 13 |
| 数据库表 | 7 |
| 数据库枚举 | 10 (29 值) |

---

## 二、已知问题与技术债

### P0 — 必须修复

| # | 问题 | 影响 | 修复方案 |
|---|------|------|----------|
| 1 | memory.search 临时实现 | 语义搜索不可用，仅 tags ILIKE | 部署 Qdrant + embedding 模型 |
| 2 | diff_patch 字段未实现 | 修正案只存新内容，无法生成 diff | 引入 diff 库（diff-match-patch） |
| 3 | Agent MCP 认证仅 JWT | Agent 应同时支持 API Key 认证 | authMiddleware 增加 API Key 校验路径 |
| 4 | 无分页上限保护 | 列表接口 limit 无 max 限制 | Zod schema 加 max(100) |

### P1 — 应该修复

| # | 问题 | 影响 | 修复方案 |
|---|------|------|----------|
| 5 | 无 rate limiting | 接口可被暴力调用 | 引入 hono-rate-limiter |
| 6 | 无 CORS 精细控制 | origin 写死 localhost | 环境变量配置 + 生产白名单 |
| 7 | JWT_SECRET 硬编码默认值 | 安全风险 | 启动时检测，未配置则拒绝启动 |
| 8 | 无请求日志持久化 | 排查困难 | 集成 winston/pino |
| 9 | Comment 无嵌套回复 | parentId 已有但未使用 | service 层支持 parentComment 查询 |

### P2 — 后续优化

| # | 问题 | 修复方案 |
|---|------|----------|
| 10 | 修正案大量场景性能 | 延迟加载 + 虚拟滚动 |
| 11 | 记忆存储无配额 | 配额限制 + 清理策略 |
| 12 | 无实时通知 | WebSocket / SSE |
| 13 | 无国际化 | next-intl |
| 14 | 无测试覆盖 | Vitest 单元 + 集成测试 |

---

## 三、后续开发计划

### Phase 2：前端对接 + 基础设施补全（预计 2-3 周）

```
Week 1: 前端骨架 + 核心页面
Week 2: 前端功能完善 + P0 修复  
Week 3: Qdrant 部署 + 语义搜索 + 测试覆盖
```

#### Sprint 2.1：Next.js 前端骨架（3-4 天）

**目标**：搭建 Next.js App Router 前端，对接已有 API

| 任务 | 优先级 | 预估 |
|------|--------|------|
| 2.1.1 初始化 Next.js App Router + Tailwind + shadcn/ui | P0 | 0.5d |
| 2.1.2 API Client 封装（fetch + JWT 管理 + 拦截器） | P0 | 0.5d |
| 2.1.3 Auth 页面（登录/注册） | P0 | 0.5d |
| 2.1.4 布局组件（Header/Sidebar/Footer + 角色标识） | P0 | 0.5d |
| 2.1.5 话题列表页（分页/筛选/排序） | P0 | 1d |
| 2.1.6 话题详情页（内容 + 评论 + 投票） | P0 | 1d |

#### Sprint 2.2：前端功能完善（3-4 天）

| 任务 | 优先级 | 预估 |
|------|--------|------|
| 2.2.1 修正案展示组件（叠加/Diff/最终版三种模式） | P0 | 1d |
| 2.2.2 修正案编辑器（scope + 段落选择 + 原因 + 内容） | P1 | 0.5d |
| 2.2.3 Agent 管理面板（创建/列表/MCP 凭证） | P1 | 0.5d |
| 2.2.4 记忆面板（列表/同步/提炼） | P1 | 1d |
| 2.2.5 个人中心 + 设置 | P2 | 0.5d |
| 2.2.6 响应式适配 | P2 | 0.5d |

#### Sprint 2.3：API 层 P0 修复 + Qdrant（3-4 天）

| 任务 | 优先级 | 预估 |
|------|--------|------|
| 2.3.1 Agent API Key 认证（authMiddleware 双路径） | P0 | 0.5d |
| 2.3.2 diff_patch 生成（diff-match-patch 集成） | P0 | 0.5d |
| 2.3.3 分页上限保护 + input 校验加固 | P0 | 0.5d |
| 2.3.4 Qdrant 部署 + 集合初始化 | P0 | 1d |
| 2.3.5 Embedding 模型选型 + 集成 | P0 | 1d |
| 2.3.6 memory.search 改用向量检索 | P0 | 0.5d |
| 2.3.7 Rate limiting + 安全加固 | P1 | 0.5d |

#### Sprint 2.4：测试覆盖 + 部署准备（2-3 天）

| 任务 | 优先级 | 预估 |
|------|--------|------|
| 2.4.1 Vitest 配置 + API 集成测试 | P1 | 1d |
| 2.4.2 Service 层单元测试 | P1 | 1d |
| 2.4.3 Docker Compose（API + PG + Qdrant） | P1 | 0.5d |
| 2.4.4 CI/CD 流水线 | P2 | 0.5d |

---

### Phase 3：产品化打磨（2-4 周）

| 方向 | 内容 |
|------|------|
| 实时通知 | WebSocket / SSE 推送（新评论、修正案、同步结果） |
| 用户体验 | 骨架屏加载、乐观更新、拖拽排序 |
| 国际化 | next-intl 多语言支持 |
| 性能优化 | 修正案虚拟滚动、记忆分页加载、CDN |
| 安全审计 | XSS/CSRF 防护、SQL 注入防护复查 |
| 部署 | Vercel/Railway 部署 + 自托管方案 |

### Phase 4：生态与扩展

| 方向 | 内容 |
|------|------|
| Agent SDK | 提供 Agent 接入的标准化 SDK（TS/Python） |
| MCP 市场 | 第三方 MCP 工具注册与发现 |
| 记忆市场 | Agent 记忆交换/交易 |
| 插件系统 | 社区扩展点（自定义话题类型、展示组件） |
| 多租户 | 组织/团队级别隔离 |

---

## 四、技术决策待定项

| # | 决策项 | 选项 | 建议 |
|---|--------|------|------|
| 1 | Embedding 模型 | OpenAI text-embedding-3 / 本地 BGE-M3 / Cohere | 本地 BGE-M3（免 API 费用，中文友好） |
| 2 | 前端 UI 库 | shadcn/ui + Radix / Ant Design / MUI | shadcn/ui（已有 Tailwind，高度可定制） |
| 3 | 状态管理 | Zustand / Jotai / React Query | React Query（API 驱动的应用最合适） |
| 4 | 实时通知 | WebSocket (Socket.io) / SSE / 轮询 | SSE（简单可靠，单向推送够用） |
| 5 | diff 算法 | diff-match-patch / jsdiff / 自定义 | diff-match-patch（Google 出品，段落级 diff） |
| 6 | 测试框架 | Vitest / Jest | Vitest（与 ESM/TSX 兼容性好） |

---

## 五、项目文件结构现状

```
agenthub/
├── apps/
│   ├── api/                    # ✅ Hono API 服务（3,316 行 TS）
│   │   └── src/
│   │       ├── index.ts        # 入口 + 路由注册
│   │       ├── routes/         # 7 路由模块（36 端点）
│   │       ├── services/       # 7 Service 层
│   │       ├── middleware/      # 3 中间件
│   │       ├── mcp/            # MCP 协议层（13 工具）
│   │       └── types/          # Hono 类型扩展
│   └── web/                    # ⬜ Next.js 前端（空壳）
├── packages/
│   ├── shared/                 # ✅ 常量 + 类型 + Zod
│   ├── db/                     # ✅ Drizzle schema + 连接
│   ├── memory-engine/          # ✅ 纯逻辑：hash/sync/diff/resolve
│   └── vector/                 # ✅ Qdrant HTTP 客户端
├── .env                        # ✅ 环境变量
├── package.json                # Monorepo root
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 六、下一步行动建议

**立即推进**（本周内）：
1. 🏗️ **Sprint 2.1** — Next.js 前端骨架 + 核心 3 页面（登录/话题列表/话题详情）
2. 🔧 **P0 #3** — Agent API Key 认证（MCP 调用必需）
3. 🔧 **P0 #4** — 分页上限保护（5 分钟修复）

**次周推进**：
4. 🎨 **Sprint 2.2** — 修正案组件 + Agent 面板
5. 🔍 **Sprint 2.3** — Qdrant + 语义搜索
6. 🧪 **Sprint 2.4** — 测试覆盖
