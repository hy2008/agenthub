import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createTopicSchema,
  createCommentSchema,
  createAmendmentSchema,
  createMemorySchema,
  memorySyncSchema,
  memoryResolveSchema,
  memorySearchSchema,
  createAgentSchema,
  updateAgentStatusSchema,
  createMcpCredentialSchema,
  updateMcpCredentialSchema,
  lockContentSchema,
  paginationSchema,
  uuidSchema,
  voteSchema,
  updateMemorySchema,
  topicListQuerySchema,
} from "./validators.js";

describe("uuidSchema", () => {
  it("should accept valid UUID", () => {
    expect(uuidSchema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("should reject invalid UUID", () => {
    expect(() => uuidSchema.parse("not-a-uuid")).toThrow();
  });
});

describe("paginationSchema", () => {
  it("should apply default values", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("should coerce string numbers", () => {
    const result = paginationSchema.parse({ page: "3", limit: "50" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it("should enforce max limit", () => {
    expect(() => paginationSchema.parse({ limit: 200 })).toThrow();
  });
});

describe("registerSchema", () => {
  const valid = {
    username: "testuser",
    displayName: "Test User",
    password: "password123",
    userType: "human",
  };

  it("should accept valid registration", () => {
    expect(() => registerSchema.parse(valid)).not.toThrow();
  });

  it("should reject short username", () => {
    expect(() => registerSchema.parse({ ...valid, username: "ab" })).toThrow();
  });

  it("should reject weak password", () => {
    expect(() => registerSchema.parse({ ...valid, password: "123" })).toThrow();
  });

  it("should reject invalid userType", () => {
    expect(() => registerSchema.parse({ ...valid, userType: "alien" })).toThrow();
  });
});

describe("loginSchema", () => {
  it("should accept valid login", () => {
    expect(() => loginSchema.parse({ username: "user", password: "pass" })).not.toThrow();
  });

  it("should reject empty username", () => {
    expect(() => loginSchema.parse({ username: "", password: "pass" })).toThrow();
  });
});

describe("createTopicSchema", () => {
  it("should accept minimal topic", () => {
    expect(() => createTopicSchema.parse({ title: "Hello", content: "World" })).not.toThrow();
  });

  it("should accept topic with all fields", () => {
    expect(() =>
      createTopicSchema.parse({
        title: "Hello",
        content: "World",
        category: "tech",
        tags: ["node", "typescript"],
        visibility: "public",
        type: "article",
      })
    ).not.toThrow();
  });

  it("should reject empty title", () => {
    expect(() => createTopicSchema.parse({ title: "", content: "World" })).toThrow();
  });
});

describe("createCommentSchema", () => {
  it("should accept minimal comment", () => {
    expect(() => createCommentSchema.parse({ content: "Nice post!" })).not.toThrow();
  });

  it("should accept comment with parentId", () => {
    expect(() =>
      createCommentSchema.parse({ content: "Reply", parentId: "550e8400-e29b-41d4-a716-446655440000" })
    ).not.toThrow();
  });
});

describe("createAmendmentSchema", () => {
  it("should accept valid amendment", () => {
    expect(() =>
      createAmendmentSchema.parse({ content: "Updated text", scope: "replace", paragraphIndex: 0 })
    ).not.toThrow();
  });

  it("should reject invalid scope", () => {
    expect(() =>
      createAmendmentSchema.parse({ content: "Text", scope: "invalid", paragraphIndex: 0 })
    ).toThrow();
  });
});

describe("createMemorySchema", () => {
  it("should accept valid memory", () => {
    expect(() =>
      createMemorySchema.parse({ memoryType: "knowledge", content: { key: "value" } })
    ).not.toThrow();
  });
});

describe("memorySyncSchema", () => {
  it("should accept valid sync payload", () => {
    expect(() =>
      memorySyncSchema.parse({
        hashes: [{ id: "550e8400-e29b-41d4-a716-446655440000", contentHash: "abc123" }],
      })
    ).not.toThrow();
  });
});

describe("memoryResolveSchema", () => {
  it("should accept valid resolve payload", () => {
    expect(() =>
      memoryResolveSchema.parse({ memoryId: "550e8400-e29b-41d4-a716-446655440000", strategy: "local_first" })
    ).not.toThrow();
  });

  it("should reject invalid strategy", () => {
    expect(() =>
      memoryResolveSchema.parse({ memoryId: "550e8400-e29b-41d4-a716-446655440000", strategy: "invalid" })
    ).toThrow();
  });
});

describe("memorySearchSchema", () => {
  it("should accept valid search", () => {
    expect(() => memorySearchSchema.parse({ query: "search term" })).not.toThrow();
  });

  it("should reject empty query", () => {
    expect(() => memorySearchSchema.parse({ query: "" })).toThrow();
  });
});

describe("createAgentSchema", () => {
  it("should accept valid agent", () => {
    expect(() =>
      createAgentSchema.parse({ username: "agent1", displayName: "Agent 1", password: "password123" })
    ).not.toThrow();
  });
});

describe("updateAgentStatusSchema", () => {
  it("should accept valid status", () => {
    expect(() => updateAgentStatusSchema.parse({ status: "active" })).not.toThrow();
  });

  it("should reject invalid status", () => {
    expect(() => updateAgentStatusSchema.parse({ status: "unknown" })).toThrow();
  });
});

describe("createMcpCredentialSchema", () => {
  it("should accept valid credential", () => {
    expect(() =>
      createMcpCredentialSchema.parse({ scopes: ["memory:read"] })
    ).not.toThrow();
  });

  it("should reject empty scopes", () => {
    expect(() => createMcpCredentialSchema.parse({ scopes: [] })).toThrow();
  });
});

describe("updateMcpCredentialSchema", () => {
  it("should accept valid update", () => {
    expect(() =>
      updateMcpCredentialSchema.parse({ credentialId: "550e8400-e29b-41d4-a716-446655440000", scopes: ["memory:read"] })
    ).not.toThrow();
  });
});

describe("voteSchema", () => {
  it("should accept valid voteType 'up'", () => {
    expect(voteSchema.parse({ voteType: "up" })).toEqual({ voteType: "up" });
  });
  it("should accept valid voteType 'down'", () => {
    expect(voteSchema.parse({ voteType: "down" })).toEqual({ voteType: "down" });
  });
  it("should reject invalid voteType", () => {
    expect(() => voteSchema.parse({ voteType: "invalid" })).toThrow();
  });
  it("should reject empty body", () => {
    expect(() => voteSchema.parse({})).toThrow();
  });
});

describe("updateMemorySchema", () => {
  it("should accept valid update with all fields", () => {
    const result = updateMemorySchema.parse({
      content: { key: "updated content" },
      tags: ["tag1", "tag2"],
    });
    expect(result.content).toEqual({ key: "updated content" });
  });
  it("should accept empty object (partial update)", () => {
    const result = updateMemorySchema.parse({});
    expect(result).toEqual({});
  });
  it("should reject invalid tags type", () => {
    expect(() => updateMemorySchema.parse({ tags: "not-an-array" })).toThrow();
  });
});

describe("topicListQuerySchema", () => {
  it("should accept valid query with all fields", () => {
    const result = topicListQuerySchema.parse({
      page: "1", limit: "20", category: "tech", type: "discussion",
    });
    expect(result.page).toBe(1);
    expect(result.category).toBe("tech");
  });
  it("should apply default values for missing fields", () => {
    const result = topicListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("lockContentSchema", () => {
  it("should accept boolean lock", () => {
    expect(() => lockContentSchema.parse({ isLocked: true })).not.toThrow();
  });
});
