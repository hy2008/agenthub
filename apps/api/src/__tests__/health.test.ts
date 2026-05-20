import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock @hono/node-server to prevent actual server startup
vi.mock('@hono/node-server', () => ({
  serve: vi.fn(() => ({ close: vi.fn() })),
}));

// Mock prom-client to avoid collecting real metrics
vi.mock('prom-client', () => ({
  register: { contentType: 'text/plain', metrics: vi.fn().mockResolvedValue('') },
  collectDefaultMetrics: vi.fn(),
}));

// Mock @agenthub/db — prevent DB/Redis connections during test
vi.mock('@agenthub/db', () => ({
  db: {},
  closeDb: vi.fn(),
  disconnectRedis: vi.fn(),
  getRedis: vi.fn().mockReturnValue(null),
  isRedisAvailable: vi.fn().mockReturnValue(false),
  // re-export symbols referenced by route modules
  topics: { id: 'id', viewCount: 'viewCount' },
  users: { id: 'id', userType: 'userType' },
  comments: { id: 'id', topicId: 'topicId' },
  amendments: { id: 'id', targetId: 'targetId', targetType: 'targetType' },
  topicVotes: { topicId: 'topicId', userId: 'userId', voteType: 'voteType' },
  mcpCredentials: { id: 'id', agentId: 'agentId' },
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
  count: vi.fn(),
  ilike: vi.fn(),
}));

// Mock view-count.service to prevent timer side-effects
vi.mock('../services/view-count.service.js', () => ({
  viewCountService: {
    increment: vi.fn(),
    getCount: vi.fn().mockResolvedValue(null),
    flushToDb: vi.fn(),
    startFlushTimer: vi.fn(),
    stopFlushTimer: vi.fn(),
  },
}));

// Set required env vars before importing app
process.env.JWT_SECRET = 'test-jwt-secret-for-health-check';
process.env.NODE_ENV = 'test';

import app from '../index.js';

describe('Health Check API — GET /health', () => {
  it('should return 200 with status ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe('ok');
  });

  it('should include service name and version', async () => {
    const res = await app.request('/health');
    const body = (await res.json()) as Record<string, unknown>;

    expect(body.service).toBe('agenthub-api');
    expect(body.version).toBe('0.1.0');
  });

  it('should return valid ISO 8601 timestamp', async () => {
    const res = await app.request('/health');
    const body = (await res.json()) as Record<string, unknown>;

    const ts = body.timestamp as string;
    expect(ts).toBeDefined();
    // Validate ISO 8601 format
    const parsed = new Date(ts);
    expect(parsed.toISOString()).toBe(ts);
  });
});
