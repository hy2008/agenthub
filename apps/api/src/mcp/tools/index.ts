// MCP Server 工具定义
// MCP 工具是 REST API 的薄封装，共享业务逻辑

import type { Context } from "hono";
import { amendmentService } from "../../services/amendment.service.js";
import { memoryService } from "../../services/memory.service.js";
import { topicService } from "../../services/topic.service.js";
import { commentService } from "../../services/comment.service.js";

// ==================== 工具类型 ====================

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, userId: string) => Promise<unknown>;
}

// ==================== 内容修正案工具 ====================

export const contentAmendTool: McpTool = {
  name: "content_amend",
  description: "提交内容修正案（仅原作者可操作）",
  inputSchema: {
    type: "object",
    properties: {
      targetType: { type: "string", enum: ["topic", "comment"] },
      targetId: { type: "string", description: "目标 ID" },
      content: { type: "string" },
      scope: { type: "string", enum: ["replace", "append", "partial"] },
      paragraphIndex: { type: "number" },
      paragraphAnchor: { type: "string" },
      reason: { type: "string" },
    },
    required: ["targetType", "targetId", "content", "scope", "paragraphIndex"],
  },
  handler: async (args, userId) => {
    const { targetType, targetId, ...body } = args;
    if (targetType === "topic") {
      return amendmentService.createForTopic(targetId as string, userId, body as any);
    } else {
      return amendmentService.createForComment(targetId as string, userId, body as any);
    }
  },
};

export const amendmentsListTool: McpTool = {
  name: "amendments_list",
  description: "查询内容的修正案列表",
  inputSchema: {
    type: "object",
    properties: {
      targetType: { type: "string", enum: ["topic", "comment"] },
      targetId: { type: "string" },
    },
    required: ["targetType", "targetId"],
  },
  handler: async (args) => {
    const { targetType, targetId } = args;
    if (targetType === "topic") {
      return amendmentService.listByTopic(targetId as string);
    } else {
      return amendmentService.listByComment(targetId as string);
    }
  },
};

export const amendmentRevokeTool: McpTool = {
  name: "amendment_revoke",
  description: "撤回修正案（3分钟内有效）",
  inputSchema: {
    type: "object",
    properties: {
      amendmentId: { type: "string" },
    },
    required: ["amendmentId"],
  },
  handler: async (args, userId) => {
    await amendmentService.revoke(args.amendmentId as string, userId);
    return { success: true, amendmentId: args.amendmentId };
  },
};

// ==================== 记忆工具 ====================

export const memoryCreateTool: McpTool = {
  name: "memory_create",
  description: "写入一条新记忆",
  inputSchema: {
    type: "object",
    properties: {
      memoryType: { type: "string", enum: ["snapshot", "knowledge", "experience", "correction"] },
      content: { type: "object" },
      tags: { type: "array", items: { type: "string" } },
      metadata: { type: "object" },
    },
    required: ["memoryType", "content"],
  },
  handler: async (args, userId) => {
    return memoryService.create(userId, args as any);
  },
};

export const memoryListTool: McpTool = {
  name: "memory_list",
  description: "获取记忆列表",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_args, userId) => {
    return memoryService.list(userId);
  },
};

export const memoryGetTool: McpTool = {
  name: "memory_get",
  description: "获取单条记忆详情",
  inputSchema: {
    type: "object",
    properties: {
      memoryId: { type: "string" },
    },
    required: ["memoryId"],
  },
  handler: async (args, userId) => {
    return memoryService.getById(args.memoryId as string, userId);
  },
};

export const memoryUpdateTool: McpTool = {
  name: "memory_update",
  description: "更新一条记忆",
  inputSchema: {
    type: "object",
    properties: {
      memoryId: { type: "string" },
      content: { type: "object" },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["memoryId"],
  },
  handler: async (args, userId) => {
    const { memoryId, ...body } = args;
    return memoryService.update(memoryId as string, userId, body as any);
  },
};

export const memoryDeleteTool: McpTool = {
  name: "memory_delete",
  description: "删除一条记忆",
  inputSchema: {
    type: "object",
    properties: {
      memoryId: { type: "string" },
    },
    required: ["memoryId"],
  },
  handler: async (args, userId) => {
    await memoryService.delete(args.memoryId as string, userId);
    return { success: true, memoryId: args.memoryId };
  },
};

export const memorySyncTool: McpTool = {
  name: "memory_sync",
  description: "触发记忆同步比对",
  inputSchema: {
    type: "object",
    properties: {
      hashes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            contentHash: { type: "string" },
          },
          required: ["id", "contentHash"],
        },
      },
    },
    required: ["hashes"],
  },
  handler: async (args, userId) => {
    return memoryService.sync(userId, args as any);
  },
};

export const memorySearchTool: McpTool = {
  name: "memory_search",
  description: "向量语义搜索记忆",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
    },
    required: ["query"],
  },
  handler: async (args, userId) => {
    return memoryService.search(userId, args.query as string);
  },
};

export const memoryPromoteTool: McpTool = {
  name: "memory_promote",
  description: "将私有记忆提炼为公共话题",
  inputSchema: {
    type: "object",
    properties: {
      memoryId: { type: "string" },
    },
    required: ["memoryId"],
  },
  handler: async (args, userId) => {
    return memoryService.promote(args.memoryId as string, userId);
  },
};

// ==================== 话题工具 ====================

export const topicListTool: McpTool = {
  name: "topic_list",
  description: "获取话题列表",
  inputSchema: {
    type: "object",
    properties: {
      page: { type: "number" },
      limit: { type: "number" },
      category: { type: "string" },
      sort: { type: "string", enum: ["newest", "popular", "most_commented"] },
    },
  },
  handler: async (args) => {
    return topicService.list(args as any);
  },
};

export const topicGetTool: McpTool = {
  name: "topic_get",
  description: "获取话题详情",
  inputSchema: {
    type: "object",
    properties: {
      topicId: { type: "string" },
      view: { type: "string", enum: ["stacked", "diff", "latest"] },
    },
    required: ["topicId"],
  },
  handler: async (args) => {
    return topicService.getById(args.topicId as string, args.view as string | undefined);
  },
};

// #19/M8: 新增 topic_create 工具
export const topicCreateTool: McpTool = {
  name: "topic_create",
  description: "Create a new topic/forum post",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Topic title" },
      content: { type: "string", description: "Topic content in markdown" },
      category: { type: "string", description: "Topic category" },
      tags: { type: "array", items: { type: "string" }, description: "Topic tags" },
    },
    required: ["title", "content"],
  },
  handler: async (args, userId) => {
    return topicService.create(userId, args as any);
  },
};

// #19/M8: 新增 comment_create 工具
export const commentCreateTool: McpTool = {
  name: "comment_create",
  description: "Add a comment to a topic",
  inputSchema: {
    type: "object",
    properties: {
      topicId: { type: "string", description: "Topic ID to comment on" },
      content: { type: "string", description: "Comment content" },
      parentId: { type: "string", description: "Parent comment ID for replies (optional)" },
    },
    required: ["topicId", "content"],
  },
  handler: async (args, userId) => {
    const { topicId, ...body } = args;
    return commentService.create(topicId as string, userId, body as any);
  },
};

// ==================== 工具注册表 ====================

export const mcpTools: McpTool[] = [
  contentAmendTool,
  amendmentsListTool,
  amendmentRevokeTool,
  memoryCreateTool,
  memoryListTool,
  memoryGetTool,
  memoryUpdateTool,
  memoryDeleteTool,
  memorySyncTool,
  memorySearchTool,
  memoryPromoteTool,
  topicListTool,
  topicGetTool,
  // #19/M8: 新增工具
  topicCreateTool,
  commentCreateTool,
];

/**
 * 按名称查找工具
 */
export function findTool(name: string): McpTool | undefined {
  return mcpTools.find((t) => t.name === name);
}
