import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper to create a fluent query chain that ends with .limit() resolving
function createSelectChainEndingAtLimit(resolvedValue: any) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(resolvedValue); // limit is terminal
  return chain;
}

// Helper to create a fluent query chain that continues past .limit() to .offset()
function createSelectChainEndingAtOffset(resolvedValue: any) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain); // limit returns chain
  chain.offset = vi.fn().mockResolvedValue(resolvedValue); // offset is terminal
  return chain;
}

// Helper to create an insert chain
function createInsertChain(resolvedValue: any) {
  const chain: any = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(resolvedValue);
  return chain;
}

// Helper to create a delete chain
function createDeleteChain() {
  const chain: any = {};
  chain.where = vi.fn().mockResolvedValue(undefined);
  return chain;
}

// Use vi.hoisted to define mockDb so it's available in hoisted vi.mock factory
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Mock @agenthub/db
vi.mock('@agenthub/db', () => ({
  db: mockDb,
  topics: {
    id: 'id',
    title: 'title',
    content: 'content',
    contentHash: 'contentHash',
    category: 'category',
    tags: 'tags',
    authorId: 'authorId',
    visibility: 'visibility',
    type: 'type',
    votesCount: 'votesCount',
    commentsCount: 'commentsCount',
    viewCount: 'viewCount',
    createdAt: 'createdAt',
    isLocked: 'isLocked',
  },
  comments: {
    id: 'id',
    topicId: 'topicId',
  },
  amendments: {
    id: 'id',
    targetId: 'targetId',
    targetType: 'targetType',
    isRevoked: 'isRevoked',
    createdAt: 'createdAt',
    content: 'content',
    scope: 'scope',
    paragraphIndex: 'paragraphIndex',
    diffPatch: 'diffPatch',
  },
  topicVotes: {
    topicId: 'topicId',
    userId: 'userId',
    voteType: 'voteType',
  },
  eq: vi.fn((col, val) => ({ col, val, __brand: 'eq' })),
  and: vi.fn((...args) => args),
  or: vi.fn((...args) => args),
  desc: vi.fn((col) => col),
  asc: vi.fn((col) => col),
  sql: vi.fn((strings, ...values) => strings.join('')),
  count: vi.fn(() => 'count'),
  ilike: vi.fn((col, val) => ({ col, val, __brand: 'ilike' })),
  getRedis: vi.fn(),
  isRedisAvailable: vi.fn(),
}));

// Mock view-count service
vi.mock('../services/view-count.service.js', () => ({
  viewCountService: {
    increment: vi.fn().mockResolvedValue(undefined),
    getCount: vi.fn().mockResolvedValue(null),
    flushToDb: vi.fn().mockResolvedValue(undefined),
    startFlushTimer: vi.fn(),
    stopFlushTimer: vi.fn(),
  },
}));

import { topicService } from '../services/topic.service.js';
import { viewCountService } from '../services/view-count.service.js';
import { NotFoundError, AuthorizationError } from '../middleware/error-handler.js';

describe('TopicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a topic and return it', async () => {
      const mockTopic = { id: 'topic-id', title: 'Test Topic', content: 'Test content', authorId: 'user-id' };
      mockDb.insert.mockReturnValue(createInsertChain([mockTopic]));

      const result = await topicService.create('user-id', {
        title: 'Test Topic',
        content: 'Test content',
      });

      expect(result).toEqual(mockTopic);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return paginated topic list', async () => {
      const mockTopics = [
        { id: '1', title: 'Topic 1' },
        { id: '2', title: 'Topic 2' },
      ];

      // First select: count query (ends at .where)
      const countChain = createSelectChainEndingAtLimit([{ value: 2 }]);
      // Override: count uses .where as terminal
      countChain.where = vi.fn().mockResolvedValue([{ value: 2 }]);

      // Second select: data query (ends at .offset)
      const dataChain = createSelectChainEndingAtOffset(mockTopics);

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(dataChain);

      const result = await topicService.list({ page: 1, limit: 20 });

      expect(result.total).toBe(2);
      expect(result.data).toEqual(mockTopics);
      expect(result.page).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return topic detail for default viewMode', async () => {
      const mockTopic = {
        id: 'topic-id',
        title: 'Test Topic',
        content: 'Test content',
        authorId: 'user-id',
        category: null,
        tags: [],
        createdAt: new Date(),
      };

      mockDb.select.mockReturnValue(createSelectChainEndingAtLimit([mockTopic]));

      const result = await topicService.getById('topic-id');

      expect(result.id).toBe('topic-id');
      expect(result.title).toBe('Test Topic');
      expect(viewCountService.increment).toHaveBeenCalledWith('topic-id');
    });

    it('should throw NotFoundError for non-existent topic', async () => {
      mockDb.select.mockReturnValue(createSelectChainEndingAtLimit([]));

      await expect(topicService.getById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a topic owned by the user', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChainEndingAtLimit([{ id: 'topic-id', authorId: 'user-id' }]));
      mockDb.delete.mockReturnValue(createDeleteChain());

      await expect(topicService.delete('topic-id', 'user-id')).resolves.toBeUndefined();
    });

    it('should throw AuthorizationError if user is not the author', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChainEndingAtLimit([{ id: 'topic-id', authorId: 'other-user-id' }]));

      await expect(topicService.delete('topic-id', 'user-id')).rejects.toThrow(AuthorizationError);
    });

    it('should throw NotFoundError for non-existent topic', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChainEndingAtLimit([]));

      await expect(topicService.delete('non-existent', 'user-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('vote', () => {
    it('should be idempotent for same vote type', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChainEndingAtLimit([{ id: 'topic-id', votesCount: 5 }]));

      mockDb.transaction.mockImplementationOnce(async (fn) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ voteType: 'up' }]),
          }),
          delete: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
        };
        return await fn(tx);
      });

      const result = await topicService.vote('topic-id', 'user-id', { voteType: 'up' });

      expect(result.votesCount).toBe(5);
    });

    it('should throw NotFoundError for non-existent topic', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChainEndingAtLimit([]));

      await expect(
        topicService.vote('non-existent', 'user-id', { voteType: 'up' })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
