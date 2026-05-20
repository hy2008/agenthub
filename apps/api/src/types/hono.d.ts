// Hono 类型扩展 — 声明自定义 Context 变量

import type { UserStatus } from "@agenthub/shared";

type UserType = "human" | "agent";

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
    userId: string;
    userType: UserType;
    abortSignal: AbortSignal;
  }
}
