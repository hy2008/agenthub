import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper to create a fluent query chain
function createChain(resolvedValue?: any) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(resolvedValue !== undefined ? resolvedValue : []);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(resolvedValue !== undefined ? resolvedValue : []);
  chain.set = vi.fn().mockReturnValue(chain);
  return chain;
}

// Mock @agenthub/db — factory must be self-contained (hoisted)
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@agenthub/db', () => ({
  db: mockDb,
  users: {
    id: 'id',
    username: 'username',
    displayName: 'displayName',
    userType: 'userType',
    ownerId: 'ownerId',
    passwordHash: 'passwordHash',
    status: 'status',
    authMethod: 'authMethod',
    agentMetadata: 'agentMetadata',
  },
  mcpCredentials: {
    id: 'id',
    agentId: 'agentId',
    issuedBy: 'issuedBy',
    credential: 'credential',
    status: 'status',
    expiresAt: 'expiresAt',
    lastUsedAt: 'lastUsedAt',
    scopes: 'scopes',
  },
  eq: vi.fn((col, val) => ({ col, val, __brand: 'eq' })),
  and: vi.fn((...args) => args),
  sql: vi.fn((strings, ...values) => strings.join('')),
  getRedis: vi.fn(),
  isRedisAvailable: vi.fn(),
}));

// Mock bcryptjs — use vi.hoisted for stable mock functions
const { mockBcryptHash, mockBcryptCompare } = vi.hoisted(() => ({
  mockBcryptHash: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
  mockBcryptCompare: vi.fn().mockResolvedValue(true),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-1234'),
}));

// Need to set JWT_SECRET before importing auth service
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

import { authService } from '../services/auth.service.js';
import { ConflictError, AuthenticationError, ValidationError } from '../middleware/error-handler.js';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish default mock implementations after clearAllMocks
    mockBcryptHash.mockResolvedValue('$2a$10$hashedpassword');
    mockBcryptCompare.mockResolvedValue(true);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // First select: check existing username -> empty
      mockDb.select.mockReturnValueOnce(createChain([]));
      // Insert user
      mockDb.insert.mockReturnValue(createChain([{ id: 'mock-uuid-1234' }]));
      // Second select: fetch created user
      mockDb.select.mockReturnValueOnce(createChain([{
        id: 'mock-uuid-1234',
        username: 'testuser',
        displayName: 'Test User',
        userType: 'human',
        status: 'active',
      }]));

      const result = await authService.register({
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
        userType: 'human',
      });

      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictError for duplicate username', async () => {
      mockDb.select.mockReturnValueOnce(createChain([{ id: 'existing-id', username: 'testuser' }]));

      await expect(
        authService.register({
          username: 'testuser',
          password: 'password123',
          displayName: 'Test User',
          userType: 'human',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError for agent without ownerId', async () => {
      mockDb.select.mockReturnValueOnce(createChain([]));

      await expect(
        authService.register({
          username: 'agent1',
          password: 'password123',
          displayName: 'Agent One',
          userType: 'agent',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        passwordHash: '$2a$10$hashedpassword',
        status: 'active',
        userType: 'human',
      };

      mockDb.select.mockReturnValueOnce(createChain([mockUser]));
      mockBcryptCompare.mockResolvedValueOnce(true);

      const result = await authService.login('testuser', 'password123');

      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      mockDb.select.mockReturnValueOnce(createChain([]));

      await expect(
        authService.login('nonexistent', 'password123')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for wrong password', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        passwordHash: '$2a$10$hashedpassword',
        status: 'active',
        userType: 'human',
      };

      mockDb.select.mockReturnValueOnce(createChain([mockUser]));
      mockBcryptCompare.mockResolvedValueOnce(false);

      await expect(
        authService.login('testuser', 'wrongpassword')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for inactive account', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        passwordHash: '$2a$10$hashedpassword',
        status: 'suspended',
        userType: 'human',
      };

      mockDb.select.mockReturnValueOnce(createChain([mockUser]));
      mockBcryptCompare.mockResolvedValueOnce(true);

      await expect(
        authService.login('testuser', 'password123')
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('generateApiKey', () => {
    it('should generate an API key with ah_ prefix', async () => {
      mockDb.insert.mockReturnValue(createChain([{ id: 'mock-uuid-1234' }]));

      const result = await authService.generateApiKey('user-id');

      expect(result.apiKey).toMatch(/^ah_/);
      expect(result.userId).toBe('user-id');
    });
  });

  describe('verifyToken / generateToken', () => {
    it('should generate and verify a valid JWT', () => {
      const token = authService.generateToken('user-id', 'human');
      expect(token).toBeDefined();

      const payload = authService.verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe('user-id');
      expect(payload!.userType).toBe('human');
    });

    it('should return null for invalid token', () => {
      const payload = authService.verifyToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for expired token', async () => {
      const jwt = await import('jsonwebtoken');
      const expiredToken = jwt.default.sign(
        { userId: 'user-id', userType: 'human' },
        process.env.JWT_SECRET!,
        { expiresIn: '0s' }
      );

      await new Promise((r) => setTimeout(r, 100));

      const payload = authService.verifyToken(expiredToken);
      expect(payload).toBeNull();
    });
  });
});
