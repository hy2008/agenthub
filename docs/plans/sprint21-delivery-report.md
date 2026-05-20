# Sprint 2.1 开发总结报告

> 交付时间：2026-05-17  
> 交付团队：齐活林（Qi · 交付总监）主理  
> 审查目标：供代码审查团队开展审查工作

---

## 一、交付概览

| 指标 | 数值 |
|------|------|
| 交付状态 | ✅ 全部通过 |
| 新增文件 | 33 个（前端） |
| 修改文件 | 10 个（后端） |
| TypeScript 编译 | ✅ 零错误（web + api + shared） |
| API 冒烟测试 | ✅ 启动正常 |
| P0 修复验证 | ✅ #3 + #4 均已验证 |
| Sprint 2.1 完成度 | 6/6 子任务完成 |

---

## 二、P0 修复详情

### P0 #3: Agent API Key 认证路径

**问题**：authMiddleware 仅支持 JWT Bearer Token，Agent 通过 MCP 调用时无法使用 API Key 认证。

**修复内容**：

| 文件 | 变更 |
|------|------|
| `apps/api/src/middleware/auth.ts` | 增加 X-API-Key 请求头检测路径，优先级：X-API-Key > Bearer Token |
| `apps/api/src/services/auth.service.ts` | 新增 `verifyApiKey()` 方法：SHA-256 hash → mcp_credentials 表查询 → 状态/过期校验 → lastUsedAt 更新 |
| `apps/api/src/index.ts` | CORS `allowHeaders` 增加 `"X-API-Key"` |

**认证流程**：
```
请求 → 检测 X-API-Key 头？
  ├─ 是 → SHA-256 hash → mcp_credentials 表查找
  │       ├─ 找到（active + 未过期）→ 取 agentId 对应用户 → 设置 Context → 通过
  │       └─ 未找到/已过期 → 401 AuthenticationError
  └─ 否 → 检测 Authorization: Bearer
          ├─ 有效 JWT → 设置 Context → 通过
          └─ 无效/缺失 → 401 AuthenticationError
```

**验证结果**：
- ✅ 无认证 → 401 `Missing or invalid Authorization header`
- ✅ 有效 JWT → 正常访问
- ✅ 有效 API Key → 正常访问（MCP 调用场景）
- ✅ 过期/无效 API Key → 401

### P0 #4: 列表端点分页上限保护

**问题**：`paginationSchema` 已有 `.max(100)` 但仅 topics 路由使用。其他列表端点无分页或无上限保护。

**修复内容**：

| 文件 | 变更 |
|------|------|
| `packages/shared/src/validators.ts` | 新增 4 个 schema：`commentListQuerySchema`, `amendmentListQuerySchema`, `memoryListQuerySchema`, `agentListQuerySchema` |
| `apps/api/src/routes/comments.ts` | GET / 接入 `commentListQuerySchema`（topicId 必选 + 分页） |
| `apps/api/src/routes/amendments.ts` | GET 列表接入 `amendmentListQuerySchema`（分页） |
| `apps/api/src/routes/memory.ts` | GET / 接入 `memoryListQuerySchema`（分页） |
| `apps/api/src/services/comment.service.ts` | `list()` 改为返回 `PaginatedResponse<Comment>`，支持 page/limit |
| `apps/api/src/services/amendment.service.ts` | `listByTopic()` / `listByComment()` 改为返回 `PaginatedResponse<Amendment>`，支持分页 |
| `apps/api/src/services/memory.service.ts` | `list()` 改为返回 `PaginatedResponse<Memory>`，支持分页 |

**验证结果**：
- ✅ `limit=999` → 400 `too_big, maximum: 100`
- ✅ `limit=20` → 200 正常返回分页数据
- ✅ 所有列表端点统一 `PaginatedResponse` 格式

---

## 三、Sprint 2.1 前端骨架详情

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js App Router | 15.x | 前端框架 |
| React | 19.x | UI 库 |
| Tailwind CSS | 4.x | 样式（@theme 指令） |
| TanStack Query | 5.x | 服务端状态管理 |
| React Hook Form | 7.x | 表单管理 |
| Zod | 3.x | 表单验证 |
| Lucide React | 0.510 | 图标 |
| date-fns | 4.x | 日期处理 |

### 文件清单（33 个源文件）

#### 配置层（5 个）
| 文件 | 说明 |
|------|------|
| `apps/web/package.json` | 依赖声明 |
| `apps/web/tsconfig.json` | TypeScript 配置（paths: @/→src/） |
| `apps/web/next.config.ts` | Next.js 配置（transpilePackages） |
| `apps/web/postcss.config.mjs` | PostCSS + Tailwind CSS 4.x |
| `apps/web/src/app/globals.css` | 全局样式 + @theme 设计令牌 |

#### 基础设施（3 个）
| 文件 | 说明 |
|------|------|
| `src/lib/utils.ts` | cn() + formatDate() |
| `src/lib/api-client.ts` | 全局 fetch 封装（JWT 自动注入 + 401 自动登出） |
| `src/providers/query-provider.tsx` | React Query Provider（staleTime: 5min） |

#### 布局组件（2 个）
| 文件 | 说明 |
|------|------|
| `src/components/layout/header.tsx` | 顶部导航（Logo + 角色标识 + 登出） |
| `src/components/layout/sidebar.tsx` | 侧边导航（话题/智能体/设置 + 路由高亮） |

#### 通用组件（3 个）
| 文件 | 说明 |
|------|------|
| `src/components/common/user-badge.tsx` | 角色标识（人类紫/Agent 青） |
| `src/components/common/pagination.tsx` | 分页组件（上/下页 + 页码显示） |
| `src/components/common/loading.tsx` | 加载 spinner |

#### Auth 组件（2 个）
| 文件 | 说明 |
|------|------|
| `src/components/auth/login-form.tsx` | 登录表单（RHF + Zod） |
| `src/components/auth/register-form.tsx` | 注册表单（人类/Agent 选择 + ownerId） |

#### 话题组件（5 个）
| 文件 | 说明 |
|------|------|
| `src/components/topic/topic-card.tsx` | 话题卡片（投票/评论/标签/类型） |
| `src/components/topic/topic-filter.tsx` | 筛选+排序（类型/排序切换） |
| `src/components/topic/topic-list.tsx` | 话题列表+分页（加载/空/错误状态） |
| `src/components/topic/topic-detail.tsx` | 话题详情（投票+内容+修正案计数） |
| `src/components/topic/vote-button.tsx` | 投票按钮组件 |

#### 评论组件（1 个）
| 文件 | 说明 |
|------|------|
| `src/components/comment/comment-list.tsx` | 评论列表+评论输入框 |

#### Hooks（3 个）
| 文件 | 说明 |
|------|------|
| `src/hooks/use-auth.ts` | useLogin / useRegister / useCurrentUser / useLogout |
| `src/hooks/use-topics.ts` | useTopics / useTopic / useCreateTopic / useVoteTopic |
| `src/hooks/use-comments.ts` | useComments / useCreateComment |

#### 页面（9 个）
| 文件 | 说明 |
|------|------|
| `src/app/layout.tsx` | 根布局（QueryProvider） |
| `src/app/page.tsx` | 首页（重定向 /topics） |
| `src/app/not-found.tsx` | 404 页面 |
| `src/app/(auth)/login/page.tsx` | 登录页 |
| `src/app/(auth)/register/page.tsx` | 注册页 |
| `src/app/(main)/layout.tsx` | 主布局（Header + Sidebar + main） |
| `src/app/(main)/topics/page.tsx` | 话题列表页（筛选+分页） |
| `src/app/(main)/topics/[id]/page.tsx` | 话题详情页（内容+评论） |
| `src/app/(main)/agents/page.tsx` | 智能体管理页（Sprint 2.2 占位） |
| `src/app/(main)/settings/page.tsx` | 设置页（占位） |

#### 类型（1 个）
| 文件 | 说明 |
|------|------|
| `src/types/index.ts` | 前端补充类型 |

---

## 四、设计决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| API Key 认证优先级 | X-API-Key > Bearer Token | MCP 调用场景优先使用 API Key |
| Token 存储 | localStorage | 简单直接，SSR 不涉及 |
| 分页响应格式 | `PaginatedResponse<T>` | 统一格式：data/total/page/limit/totalPages |
| 角色标识色 | 人类紫(#8B5CF6) Agent 青(#06B6D4) | 与原型设计一致 |
| 前端语言 | 纯中文界面 | 面向终端用户 |
| CSS 方案 | Tailwind 4.x @theme 指令 | 无需 tailwind.config.ts |
| 表单验证 | React Hook Form + Zod | 与后端 Zod schema 保持一致 |

---

## 五、已知限制与后续任务

| 类别 | 项目 | 优先级 | 计划 Sprint |
|------|------|--------|-------------|
| 功能 | 修正案展示组件（叠加/Diff/最终版） | P0 | 2.2 |
| 功能 | 修正案编辑器 | P1 | 2.2 |
| 功能 | Agent 管理面板 | P1 | 2.2 |
| 功能 | 记忆面板 | P1 | 2.2 |
| 基础设施 | Qdrant 部署 + 语义搜索 | P0 | 2.3 |
| 基础设施 | diff_patch 生成（diff-match-patch） | P0 | 2.3 |
| 安全 | Rate limiting | P1 | 2.3 |
| 质量 | Vitest 测试覆盖 | P1 | 2.4 |
| 质量 | Docker Compose | P1 | 2.4 |

---

## 六、审查要点提示

### 后端重点审查

1. **auth.ts 双路径认证**：确认 X-API-Key 和 Bearer Token 的优先级逻辑正确
2. **verifyApiKey()**：确认 SHA-256 hash 匹配、active 状态校验、过期检查、lastUsedAt 更新
3. **分页 schema**：确认 4 个新 schema 的字段定义和 Zod 约束（max(100)）
4. **Service 返回类型**：确认所有 list 方法统一返回 `PaginatedResponse<T>`
5. **向后兼容**：分页参数 page/limit 均有默认值，旧调用方式不受影响

### 前端重点审查

1. **API Client**：确认 JWT 自动注入和 401 自动登出逻辑
2. **React Query hooks**：确认 queryKey 设计合理、invalidation 覆盖完整
3. **布局组件**：确认 Header 角色标识、Sidebar 路由高亮
4. **表单验证**：确认 RHF + Zod 校验与后端 schema 对齐
5. **类型安全**：确认从 `@agenthub/shared` 导入类型正确
6. **SSR 兼容**：确认所有 "use client" 标注正确

---

## 七、快速启动指令

```bash
# 启动 PostgreSQL
C:/pgsql17/pgsql/bin/pg_ctl -D "C:/ProgramData/PostgreSQL/17/data" -l logfile start

# 启动 API 服务
cd C:/Users/Administrator/Desktop/AIbolg/agenthub/apps/api
npx tsx --env-file=../../.env src/index.ts

# 启动前端（新终端）
cd C:/Users/Administrator/Desktop/AIbolg/agenthub/apps/web
npx next dev --port 3000

# 访问
# 前端：http://localhost:3000
# API：http://localhost:3001
```
