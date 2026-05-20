// MCP 凭证服务 — 生成 / 查看 / 撤销 / 续期

import { db, users, mcpCredentials, eq, and, desc, count } from "@agenthub/db";
import { McpCredentialStatus, UserType } from "@agenthub/shared";
import type { McpCredential, CreateMcpCredentialRequest } from "@agenthub/shared";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import { NotFoundError, AuthorizationError, ValidationError, ConflictError } from "../middleware/error-handler.js";

/** 生成加密凭证（UUID-based + hash） */
function generateCredential(): string {
  const raw = `mcp_${uuidv4().replace(/-/g, "")}`;
  return raw;
}

export const mcpCredentialService = {
  /**
   * 为 Agent 生成 MCP 凭证
   * 1. 校验 issuedBy 是 agentId 的 owner
   * 2. 校验 agentId 是 Agent 类型
   * 3. 生成凭证
   * 4. 插入记录
   */
  async create(
    agentId: string,
    issuedBy: string,
    body: CreateMcpCredentialRequest
  ): Promise<{ credential: McpCredential; rawKey: string }> {
    // 校验 agent 是 Agent 类型
    const agentRows = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    if (agentRows.length === 0 || agentRows[0].userType !== UserType.AGENT) {
      throw new NotFoundError("Agent");
    }

    // 校验 issuedBy 是 owner
    if (agentRows[0].ownerId !== issuedBy) {
      throw new AuthorizationError("Only the agent's owner can issue MCP credentials");
    }

    // [H7] 在事务中校验数量并插入，防止 TOCTOU 竞态
    return await db.transaction(async (tx) => {
      const [countRow] = await tx
        .select({ total: count() })
        .from(mcpCredentials)
        .where(and(eq(mcpCredentials.agentId, agentId), eq(mcpCredentials.status, McpCredentialStatus.ACTIVE)));
      if ((countRow?.total ?? 0) >= 5) {
        throw new ConflictError("Maximum 5 active credentials per agent");
      }

      // 生成凭证
      const rawKey = generateCredential();
      const credentialHash = createHash("sha256").update(rawKey).digest("hex");

      const [row] = await tx
        .insert(mcpCredentials)
        .values({
          agentId,
          issuedBy,
          credential: credentialHash, // 存储 hash 而非明文
          scopes: body.scopes,
          status: McpCredentialStatus.ACTIVE,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        })
        .returning();

      return {
        credential: row as unknown as McpCredential,
        rawKey, // 仅在创建时返回明文，后续不可恢复
      };
    });
  },

  /**
   * 查看 Agent 的 MCP 凭证状态
   */
  async getStatus(agentId: string, userId: string): Promise<McpCredential[]> {
    // 校验权限：userId 是 owner 或是 agent 自身
    const agentRows = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    if (agentRows.length === 0) {
      throw new NotFoundError("Agent");
    }
    if (agentRows[0].ownerId !== userId && agentRows[0].id !== userId) {
      throw new AuthorizationError("Only the agent's owner or the agent itself can view credentials");
    }

    const data = await db
      .select()
      .from(mcpCredentials)
      .where(eq(mcpCredentials.agentId, agentId))
      .orderBy(desc(mcpCredentials.createdAt));

    return data as unknown as McpCredential[];
  },

  /**
   * 撤销 MCP 凭证
   * [H13] 添加可选参数 credentialId：若提供则仅撤销指定凭证；若不提供则撤销所有（保持向后兼容）
   */
  async revoke(agentId: string, userId: string, credentialId?: string): Promise<void> {
    // 校验 owner
    const agentRows = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    if (agentRows.length === 0) {
      throw new NotFoundError("Agent");
    }
    if (agentRows[0].ownerId !== userId) {
      throw new AuthorizationError("Only the agent's owner can revoke credentials");
    }

    if (credentialId) {
      // [H13] 撤销指定凭证
      const credRows = await db
        .select()
        .from(mcpCredentials)
        .where(and(eq(mcpCredentials.id, credentialId), eq(mcpCredentials.agentId, agentId)))
        .limit(1);
      if (credRows.length === 0) {
        throw new NotFoundError("MCP Credential");
      }
      if (credRows[0].status !== McpCredentialStatus.ACTIVE) {
        throw new ValidationError("Credential is not active");
      }
      await db
        .update(mcpCredentials)
        .set({ status: McpCredentialStatus.REVOKED })
        .where(eq(mcpCredentials.id, credentialId));
    } else {
      // 撤销所有活跃凭证（保持向后兼容）
      await db
        .update(mcpCredentials)
        .set({ status: McpCredentialStatus.REVOKED })
        .where(and(eq(mcpCredentials.agentId, agentId), eq(mcpCredentials.status, McpCredentialStatus.ACTIVE)));
    }
  },

  /**
   * 续期/修改 MCP 凭证
   * [H13] 添加必选参数 credentialId，仅更新指定凭证
   */
  async update(agentId: string, userId: string, credentialId: string, body: {
    scopes?: string[];
    expiresAt?: string;
  }): Promise<void> {
    const agentRows = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    if (agentRows.length === 0) {
      throw new NotFoundError("Agent");
    }
    if (agentRows[0].ownerId !== userId) {
      throw new AuthorizationError("Only the agent's owner can update credentials");
    }

    // [H13] 校验指定凭证存在且属于该 agent
    const credRows = await db
      .select()
      .from(mcpCredentials)
      .where(and(eq(mcpCredentials.id, credentialId), eq(mcpCredentials.agentId, agentId)))
      .limit(1);
    if (credRows.length === 0) {
      throw new NotFoundError("MCP Credential");
    }
    if (credRows[0].status !== McpCredentialStatus.ACTIVE) {
      throw new ValidationError("Credential is not active");
    }

    // 更新指定凭证
    const updateData: Record<string, unknown> = {};
    if (body.scopes) {
      updateData.scopes = body.scopes;
    }
    if (body.expiresAt) {
      updateData.expiresAt = new Date(body.expiresAt);
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(mcpCredentials)
        .set(updateData)
        .where(eq(mcpCredentials.id, credentialId));
    }
  },
};
