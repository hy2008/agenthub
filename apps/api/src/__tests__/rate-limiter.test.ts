import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @agenthub/db for redis rate limiter
vi.mock('@agenthub/db', () => ({
  getRedis: vi.fn(),
  isRedisAvailable: vi.fn(),
}));

import { rateLimiter } from '../middleware/rate-limiter.js';
import { redisRateLimiter } from '../middleware/rate-limiter-redis.js';
import { getRedis, isRedisAvailable } from '@agenthub/db';

function createMockContext(overrides: Record<string, any> = {}) {
  const headers: Record<string, string> = {};
  return {
    req: {
      header: vi.fn((name: string) => headers[name.toLowerCase()] || undefined),
    },
    get: vi.fn((key: string) => overrides[key]),
    header: vi.fn(),
    json: vi.fn((body: any, status?: number) => ({ body, status })),
    ...overrides,
  } as any;
}

describe('RateLimiter (in-memory)', () => {
  it('should allow requests within limit', async () => {
    // Use unique windowMs to avoid cross-test store pollution
    const limiter = rateLimiter({ windowMs: 99991, maxRequests: 3, keyBy: 'ip' });
    const ctx = createMockContext();
    const next = vi.fn();

    await limiter(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.header).toHaveBeenCalledWith('X-RateLimit-Limit', '3');
  });

  it('should reject requests exceeding limit', async () => {
    const limiter = rateLimiter({ windowMs: 99992, maxRequests: 3, keyBy: 'ip' });
    const ctx1 = createMockContext();
    const ctx2 = createMockContext();
    const ctx3 = createMockContext();
    const ctx4 = createMockContext();
    const next = vi.fn();

    await limiter(ctx1, next);
    await limiter(ctx2, next);
    await limiter(ctx3, next);
    await limiter(ctx4, next); // 4th request should be rejected

    expect(ctx4.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'TooManyRequests' }),
      429
    );
  });

  it('should set rate limit headers', async () => {
    const limiter = rateLimiter({ windowMs: 99993, maxRequests: 3, keyBy: 'ip' });
    const ctx = createMockContext();
    const next = vi.fn();

    await limiter(ctx, next);

    expect(ctx.header).toHaveBeenCalledWith('X-RateLimit-Limit', '3');
    expect(ctx.header).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
    expect(ctx.header).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
  });

  it('should use userId as key when keyBy is userId', async () => {
    const limiter = rateLimiter({ windowMs: 99994, maxRequests: 3, keyBy: 'userId' });
    const ctx = createMockContext({ userId: 'user-123' });
    const next = vi.fn();

    await limiter(ctx, next);

    expect(next).toHaveBeenCalled();
  });

  it('should fallback to IP when userId is not set and keyBy is userId', async () => {
    const limiter = rateLimiter({ windowMs: 99995, maxRequests: 3, keyBy: 'userId' });
    const ctx = createMockContext(); // no userId set
    const next = vi.fn();

    await limiter(ctx, next);

    expect(next).toHaveBeenCalled();
  });

  it('should read X-Forwarded-For header for IP', async () => {
    const limiter = rateLimiter({ windowMs: 99996, maxRequests: 3, keyBy: 'ip' });
    const ctx = createMockContext();
    ctx.req.header = vi.fn((name: string) => {
      if (name === 'X-Forwarded-For') return '1.2.3.4, 5.6.7.8';
      return undefined;
    });
    const next = vi.fn();

    await limiter(ctx, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('RedisRateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fallback to in-memory when Redis is unavailable', async () => {
    (getRedis as any).mockReturnValue(null);
    (isRedisAvailable as any).mockReturnValue(false);

    const limiter = redisRateLimiter({ windowMs: 99997, maxRequests: 5, keyBy: 'ip' });
    const ctx = createMockContext();
    const next = vi.fn();

    await limiter(ctx, next);

    expect(next).toHaveBeenCalled();
  });

  it('should use Redis INCR when available', async () => {
    const mockRedis = {
      incr: vi.fn().mockResolvedValue(1),
      pexpire: vi.fn().mockResolvedValue(1),
    };
    (getRedis as any).mockReturnValue(mockRedis);
    (isRedisAvailable as any).mockReturnValue(true);

    const limiter = redisRateLimiter({ windowMs: 99998, maxRequests: 5, keyBy: 'ip' });
    const ctx = createMockContext();
    const next = vi.fn();

    await limiter(ctx, next);

    expect(mockRedis.incr).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should reject when Redis count exceeds limit', async () => {
    const mockRedis = {
      incr: vi.fn().mockResolvedValue(6), // exceeds maxRequests=5
      pexpire: vi.fn().mockResolvedValue(1),
    };
    (getRedis as any).mockReturnValue(mockRedis);
    (isRedisAvailable as any).mockReturnValue(true);

    const limiter = redisRateLimiter({ windowMs: 99999, maxRequests: 5, keyBy: 'ip' });
    const ctx = createMockContext();
    const next = vi.fn();

    await limiter(ctx, next);

    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'TooManyRequests' }),
      429
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should fallback to in-memory when Redis operation fails', async () => {
    const mockRedis = {
      incr: vi.fn().mockRejectedValue(new Error('Redis connection error')),
    };
    (getRedis as any).mockReturnValue(mockRedis);
    (isRedisAvailable as any).mockReturnValue(true);

    const limiter = redisRateLimiter({ windowMs: 99990, maxRequests: 5, keyBy: 'ip' });
    const ctx = createMockContext();
    const next = vi.fn();

    await limiter(ctx, next);

    expect(next).toHaveBeenCalled();
  });
});
