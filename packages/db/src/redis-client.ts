// 单例 Redis 客户端
// - 通过 REDIS_URL 环境变量配置
// - 未配置时返回 null，所有消费者需 graceful fallback

import Redis from 'ioredis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  if (!redisInstance && process.env.REDIS_URL) {
    try {
      redisInstance = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy(times) {
          if (times > 3) return null; // stop retrying
          return Math.min(times * 200, 2000);
        },
      });
      redisInstance.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
      });
    } catch {
      redisInstance = null;
    }
  }
  return redisInstance;
}

export function isRedisAvailable(): boolean {
  return redisInstance !== null && redisInstance.status === 'ready';
}

export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
