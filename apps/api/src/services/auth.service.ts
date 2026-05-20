// 认证服务 — 注册 / 登录 / JWT / API Key

import { db, users, mcpCredentials, eq, and, sql } from "@agenthub/db";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { createHash, timingSafeEqual } from "crypto";
import { UserType, AuthMethod, UserStatus, McpCredentialStatus } from "@agenthub/shared";
import {
  ConflictError,
  AuthenticationError,
  ValidationError,
} from "../middleware/error-handler.js";
import type { RegisterRequest, LoginResponse, User } from "@agenthub/shared";

// [S1] JWT Secret 启动校验 — 生产环境必须通过环境变量注入，否则拒绝启动
const FALLBACK_SECRET = "change-me-in-production";
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET === FALLBACK_SECRET)) {
  throw new Error(
    "[S1] FATAL: JWT_SECRET must be set to a secure value in production. " +
    "Refusing to start with default/missing secret."
  );
}

/** JWT 过期时间 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/** JWT 签名选项 */
const signOptions: SignOptions = { expiresIn: "7d" };

/** 当环境变量自定义了过期时间时，动态生成签名选项 */
function getSignOptions(): SignOptions {
  if (process.env.JWT_EXPIRES_IN) {
    return { expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  }
  return signOptions;
}

/** JWT Payload 结构 */
interface JwtPayload {
  userId: string;
  userType: string;
}

/** API Key 验证结果 */
interface ApiKeyVerifyResult {
  userId: string;
  userType: string;
}

/**
 * [S2] 常量时间字符串比较，防止时序攻击
 * SHA-256 hex 输出固定 64 字符，两边长度一致
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export const authService = {
  /**
   * 注册新用户
   * 1. 检查用户名唯一性
   * 2. 如果是 Agent，校验 ownerId 存在且为 human
   * 3. 密码 hash
   * 4. 插入 User 记录
   * 5. 生成 JWT
   * 6. 返回 token + user
   */
  async register(body: RegisterRequest): Promise<LoginResponse> {
    // 1. 检查用户名唯一
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, body.username))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictError("Username already exists");
    }

    // 2. 如果是 Agent，校验 ownerId 存在且为 human
    if (body.userType === UserType.AGENT) {
      if (!body.ownerId) {
        throw new ValidationError("Agent must have an owner");
      }
      const owner = await db
        .select()
        .from(users)
        .where(eq(users.id, body.ownerId))
        .limit(1);
      if (owner.length === 0) {
        throw new ValidationError("Owner not found");
      }
      if (owner[0].userType !== UserType.HUMAN) {
        throw new ValidationError("Owner must be a human user");
      }
    }

    // 3. 密码 hash
    const passwordHash = await bcrypt.hash(body.password, 10);

    // 4. 插入 User 记录
    const id = uuidv4();
    await db.insert(users).values({
      id,
      username: body.username,
      displayName: body.displayName,
      userType: body.userType,
      ownerId: body.ownerId || null,
      agentMetadata: body.agentMetadata || null,
      passwordHash,
      authMethod: AuthMethod.PASSWORD,
      status: UserStatus.ACTIVE,
    });

    // 5. 生成 JWT
    const token = authService.generateToken(id, body.userType);

    // 6. 查询并返回完整用户信息
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const user = rows[0];

    return { token, user: user as unknown as User };
  },

  /**
   * 用户登录
   * 1. 查找用户
   * 2. 校验密码
   * 3. 校验账户状态
   * 4. 生成 JWT
   * 5. 返回 token + user
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    // 1. 查找用户
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (rows.length === 0) {
      throw new AuthenticationError("Invalid credentials");
    }
    const user = rows[0];

    // 2. 校验密码
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError("Invalid credentials");
    }

    // 3. 校验账户状态
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError("Account is not active");
    }

    // 4. 生成 JWT
    const token = authService.generateToken(user.id, user.userType);

    // 5. 返回
    return { token, user: user as unknown as User };
  },

  /**
   * 生成 JWT Token
   */
  generateToken(userId: string, userType: string): string {
    return jwt.sign({ userId, userType }, JWT_SECRET, getSignOptions());
  },

  /**
   * 验证 JWT Token，返回 payload 或 null
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  },

  /**
   * 验证 API Key
   *
   * 流程：
   * 1. 对 raw key 做 SHA-256 hash
   * 2. 在 mcp_credentials 表中查找匹配的 hash（status=active，未过期）
   * 3. 通过 agentId 查找对应的用户，获取 userType
   * 4. 更新 lastUsedAt 时间
   * 5. 返回 { userId, userType } 或 null
   */
  async verifyApiKey(rawKey: string): Promise<ApiKeyVerifyResult | null> {
    // 1. 计算 key 的 SHA-256 hash
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    // [S2] + [Perf] 先按 credential hash 过滤缩小范围，再用 timingSafeEqual
    // SQL eq() 缩小候选集 — keyHash 本身是 SHA-256 密文，不会泄露时序信息
    const credRows = await db
      .select()
      .from(mcpCredentials)
      .where(
        and(
          eq(mcpCredentials.status, McpCredentialStatus.ACTIVE),
          sql`(${mcpCredentials.expiresAt} IS NULL OR ${mcpCredentials.expiresAt} > now())`,
          eq(mcpCredentials.credential, keyHash)
        )
      );

    // [S2] 常量时间比较查找匹配的凭证（保留时序安全，防御 SQL 层时序泄露）
    const matched = credRows.find((cred) => safeEqual(cred.credential, keyHash));

    if (!matched) {
      return null;
    }

    // 3. 通过 agentId 查找用户获取 userType
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, matched.agentId))
      .limit(1);

    if (userRows.length === 0) {
      return null;
    }

    const user = userRows[0];

    // 校验用户状态
    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    // 4. 更新 lastUsedAt
    await db
      .update(mcpCredentials)
      .set({ lastUsedAt: new Date() })
      .where(eq(mcpCredentials.id, matched.id));

    // 5. 返回验证结果
    return {
      userId: user.id,
      userType: user.userType,
    };
  },

  /**
   * [H8] 生成 API Key 并持久化到 mcp_credentials 表
   *
   * 流程：
   * 1. 生成 ah_ 前缀的 API Key
   * 2. 计算 SHA-256 hash
   * 3. 在 mcp_credentials 表中插入一条记录
   * 4. 返回 { apiKey: rawKey, userId }
   */
  async generateApiKey(userId: string): Promise<{ apiKey: string; userId: string }> {
    // 1. 生成 ah_ 前缀的 API Key
    const rawKey = `ah_${uuidv4().replace(/-/g, "")}`;

    // 2. 计算 SHA-256 hash
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    // 3. 在 mcp_credentials 表中插入一条记录
    await db.insert(mcpCredentials).values({
      id: uuidv4(),
      agentId: userId,
      issuedBy: userId,
      credential: keyHash,
      scopes: ["memory:read", "topic:read"],
      status: McpCredentialStatus.ACTIVE,
    });

    // 4. 返回 { apiKey: rawKey, userId }
    return { apiKey: rawKey, userId };
  },
};
