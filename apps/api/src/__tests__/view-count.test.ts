import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper to create a fluent query chain
function createChain(resolvedValue?: any) {
  const chain: any = {};
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockResolvedValue(resolvedValue !== undefined ? resolvedValue : undefined);
  return chain;
}

// Use vi.hoisted to define mockDb so it's available in hoisted vi.mock factory
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    update: vi.fn(),
  },
}));

vi.mock('@agenthub/db', () => ({
  db: mockDb,
  topics: {
    id: 'id',
    viewCount: 'viewCount',
  },
  eq: vi.fn((col, val) => ({ col, val, __brand: 'eq' })),
  sql: vi.fn((strings, ...values) => strings.join('')),
  getRedis: vi.fn(),
  isRedisAvailable: vi.fn(),
}));

import { viewCountService } from '../services/view-count.service.js';
import { getRedis, isRedisAvailable } from '@agenthub/db';

describe('ViewCountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewCountService.stopFlushTimer();
  });

  describe('increment', () => {
    it('should increment view count in Redis when available', async () => {
      const mockRedis = {
        incr: vi.fn().mockResolvedValue(1),
      };
      (getRedis as any).mockReturnValue(mockRedis);
      (isRedisAvailable as any).mockReturnValue(true);

      await viewCountService.increment('topic-1');

      expect(mockRedis.incr).toHaveBeenCalledWith('view_count:topic-1');
    });

    it('should fallback to DB update when Redis is unavailable', async () => {
      (getRedis as any).mockReturnValue(null);
      (isRedisAvailable as any).mockReturnValue(false);

      mockDb.update.mockReturnValue(createChain());

      await viewCountService.increment('topic-1');

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should fallback to DB when Redis INCR throws error', async () => {
      const mockRedis = {
        incr: vi.fn().mockRejectedValue(new Error('Redis error')),
      };
      (getRedis as any).mockReturnValue(mockRedis);
      (isRedisAvailable as any).mockReturnValue(true);

      mockDb.update.mockReturnValue(createChain());

      await viewCountService.increment('topic-1');

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('getCount', () => {
    it('should return buffered count from Redis', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('5'),
      };
      (getRedis as any).mockReturnValue(mockRedis);
      (isRedisAvailable as any).mockReturnValue(true);

      const count = await viewCountService.getCount('topic-1');

      expect(count).toBe(5);
      expect(mockRedis.get).toHaveBeenCalledWith('view_count:topic-1');
    });

    it('should return null when Redis key does not exist', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
      };
      (getRedis as any).mockReturnValue(mockRedis);
      (isRedisAvailable as any).mockReturnValue(true);

      const count = await viewCountService.getCount('topic-1');

      expect(count).toBeNull();
    });

    it('should return null when Redis is unavailable', async () => {
      (getRedis as any).mockReturnValue(null);
      (isRedisAvailable as any).mockReturnValue(false);

      const count = await viewCountService.getCount('topic-1');

      expect(count).toBeNull();
    });

    it('should return null when Redis GET throws error', async () => {
      const mockRedis = {
        get: vi.fn().mockRejectedValue(new Error('Redis error')),
      };
      (getRedis as any).mockReturnValue(mockRedis);
      (isRedisAvailable as any).mockReturnValue(true);

      const count = await viewCountService.getCount('topic-1');

      expect(count).toBeNull();
    });
  });

  describe('flushToDb', () => {
    it('should do nothing when Redis is unavailable', async () => {
      (getRedis as any).mockReturnValue(null);
      (isRedisAvailable as any).mockReturnValue(false);

      await viewCountService.flushToDb();

      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should scan and flush buffered counts to DB', async () => {
      const mockRedis = {
        scan: vi.fn()
          .mockResolvedValueOnce(['0', ['view_count:topic-1']])
          .mockResolvedValue(['0', []]),
        get: vi.fn().mockResolvedValue('3'),
        del: vi.fn().mockResolvedValue(1),
      };
      (getRedis as any).mockReturnValue(mockRedis);
      (isRedisAvailable as any).mockReturnValue(true);

      mockDb.update.mockReturnValue(createChain());

      await viewCountService.flushToDb();

      expect(mockRedis.scan).toHaveBeenCalled();
      expect(mockRedis.get).toHaveBeenCalledWith('view_count:topic-1');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith('view_count:topic-1');
    });

    it('should skip keys with zero or NaN delta', async () => {
      const mockRedis = {
        scan: vi.fn()
          .mockResolvedValueOnce(['0', ['view_count:topic-2']])
          .mockResolvedValue(['0', []]),
        get: vi.fn().mockResolvedValue('0'),
        del: vi.fn().mockResolvedValue(1),
      };
      (getRedis as any).mockReturnValue(mockRedis);
      (isRedisAvailable as any).mockReturnValue(true);

      await viewCountService.flushToDb();

      expect(mockRedis.del).toHaveBeenCalledWith('view_count:topic-2');
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('startFlushTimer / stopFlushTimer', () => {
    it('should start and stop flush timer without error', () => {
      viewCountService.startFlushTimer();
      viewCountService.stopFlushTimer();
    });

    it('should not start duplicate timer', () => {
      viewCountService.startFlushTimer();
      viewCountService.startFlushTimer();
      viewCountService.stopFlushTimer();
    });
  });
});
