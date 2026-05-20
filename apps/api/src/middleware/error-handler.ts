// 全局错误处理中间件

import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { logger } from "./logger.js";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: ContentfulStatusCode = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Permission denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function errorHandler(err: Error, c: Context) {
  const requestId = c.get("requestId") || "unknown";

  if (err instanceof TimeoutError) {
    return c.json(
      {
        error: "GatewayTimeout",
        message: err.message,
        code: "TIMEOUT",
        requestId,
      },
      503
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        error: err.name,
        message: err.message,
        code: err.code,
        requestId,
      },
      err.statusCode
    );
  }

  // 未预期的错误
  logger.error({ err: { message: err.message, stack: err.stack }, requestId }, `[Unhandled Error] ${err.message}`);

  return c.json(
    {
      error: "InternalServerError",
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
      requestId,
    },
    500
  );
}
