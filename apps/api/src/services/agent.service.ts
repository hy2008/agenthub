// Agent 管理服务 — 人类管理其名下 Agent

import { db, users, eq, and } from "@agenthub/db";
import { UserType, UserStatus } from "@agenthub/shared";
import type { User, AgentMetadata } from "@agenthub/shared";
import { NotFoundError, AuthorizationError, ValidationError } from "../middleware/error-handler.js";

export const agentService = {
  /**
   * 列出当前人类用户名下的 Agent
   */
  async listAgents(ownerId: string): Promise<User[]> {
    const data = await db
      .select()
      .from(users)
      .where(and(eq(users.ownerId, ownerId), eq(users.userType, UserType.AGENT)));

    return data as unknown as User[];
  },

  /**
   * 注册新 Agent（人类为 Agent 创建账号）
   * 1. 校验 ownerId 是人类用户
   * 2. 检查用户名唯一
   * 3. 创建 Agent 用户
   */
  async createAgent(ownerId: string, body: {
    username: string;
    displayName: string;
    password: string;
    agentMetadata?: AgentMetadata;
  }): Promise<User> {
    // 校验 ownerId 是人类
    const ownerRows = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
    if (ownerRows.length === 0 || ownerRows[0].userType !== UserType.HUMAN) {
      throw new ValidationError("Invalid owner: must be a human user");
    }

    // 检查用户名唯一
    const existing = await db.select().from(users).where(eq(users.username, body.username)).limit(1);
    if (existing.length > 0) {
      throw new ValidationError("Username already exists");
    }

    // 密码 hash（Agent 的密码由 owner 设定，用于 API 认证）
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(body.password, 10);

    const [row] = await db
      .insert(users)
      .values({
        username: body.username,
        displayName: body.displayName,
        userType: UserType.AGENT,
        ownerId,
        agentMetadata: body.agentMetadata || null,
        passwordHash,
        authMethod: "password",
        status: UserStatus.ACTIVE,
      })
      .returning();

    return row as unknown as User;
  },

  /**
   * 查看 Agent 详情 — 校验请求者是 owner
   */
  async getAgent(agentId: string, userId: string): Promise<User> {
    const rows = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    if (rows.length === 0 || rows[0].userType !== UserType.AGENT) {
      throw new NotFoundError("Agent");
    }
    if (rows[0].ownerId !== userId) {
      throw new AuthorizationError("You can only view your own agents");
    }
    return rows[0] as unknown as User;
  },

  /**
   * 暂停/恢复 Agent
   */
  async updateAgentStatus(agentId: string, userId: string, status: string): Promise<void> {
    const rows = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    if (rows.length === 0 || rows[0].userType !== UserType.AGENT) {
      throw new NotFoundError("Agent");
    }
    if (rows[0].ownerId !== userId) {
      throw new AuthorizationError("You can only manage your own agents");
    }
    if (status !== "active" && status !== "suspended") {
      throw new ValidationError("Status must be 'active' or 'suspended'");
    }
    await db
      .update(users)
      .set({ status: status as "active" | "suspended" })
      .where(eq(users.id, agentId));
  },
};
