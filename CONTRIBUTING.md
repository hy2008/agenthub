# 贡献指南

感谢你对 AgentHub 的关注！本文档将帮助你了解如何参与项目贡献。

## 行为准则

- 尊重每一位贡献者
- 建设性的讨论和反馈
- 以项目利益为优先

## 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/your-org/agenthub/issues) 中搜索是否已有相同问题
2. 创建新 Issue，包含：
   - 问题描述
   - 复现步骤
   - 期望行为
   - 实际行为
   - 环境信息（Node.js 版本、OS 等）

### 提交功能请求

1. 在 Issues 中描述你的需求和动机
2. 说明使用场景和预期效果
3. 如果有实现思路，欢迎一并提出

### 提交代码

#### 开发环境搭建

```bash
# 克隆仓库
git clone https://github.com/your-org/agenthub.git
cd agenthub

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置本地开发配置

# 启动开发服务
pnpm dev
```

#### 分支规范

| 分支类型 | 命名格式 | 示例 |
|----------|----------|------|
| 特性 | `feature/<name>` | `feature/memory-sync` |
| 修复 | `fix/<name>` | `fix/auth-timeout` |
| 文档 | `docs/<name>` | `docs/api-guide` |
| 重构 | `refactor/<name>` | `refactor/service-layer` |

#### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具变更

#### 代码规范

- **TypeScript 严格模式**：所有代码必须通过 `tsc --noEmit`
- **ESLint + Prettier**：提交前运行 `pnpm lint && pnpm format:check`
- **分层架构**：路由（Route）→ 业务逻辑（Service）→ 数据访问（DB Package）
- **错误处理**：使用 `AppError` 子类，不抛裸异常

#### 数据库变更

```bash
# 修改 packages/db/src/schema/ 中的 schema 文件后
pnpm db:generate    # 生成迁移文件
pnpm db:migrate     # 执行迁移（生产环境）
pnpm db:push        # 推送 schema（开发环境）
```

#### 测试

```bash
# 全量测试
pnpm -r test

# API 测试
cd apps/api && pnpm test

# 类型检查
pnpm type-check
```

新增功能需编写对应测试：
- Service 层：Mock DB 单元测试
- 路由层：`app.request()` API 测试
- 中间件：独立单元测试

#### 新增环境变量

添加环境变量时需同步更新：
1. `.env.example` — 添加模板和注释
2. `docker-compose.yml` — 添加到 api 服务 environment
3. `README.md` — 添加到环境变量表

### PR 流程

1. 确保 CI 通过（lint + typecheck + test）
2. 确保代码有充分测试覆盖
3. 填写 PR 模板，描述变更内容和动机
4. 等待 Review，及时回应反馈
5. Review 通过后合并

## 项目架构

详细架构请参考 [系统设计文档](./docs/system_design.md)。

```
路由层 (routes/)     → HTTP 请求处理、参数校验
  ↓
业务层 (services/)   → 核心业务逻辑
  ↓
数据层 (packages/db) → Drizzle ORM schema + 数据访问
```

## 联系方式

- Issues: https://github.com/your-org/agenthub/issues
- Discussions: https://github.com/your-org/agenthub/discussions
