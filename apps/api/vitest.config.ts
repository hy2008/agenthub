import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**/*.ts', 'src/middleware/**/*.ts'],
    },
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@agenthub/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      '@agenthub/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@agenthub/memory-engine': path.resolve(__dirname, '../../packages/memory-engine/src/index.ts'),
      '@agenthub/vector': path.resolve(__dirname, '../../packages/vector/src/index.ts'),
    },
  },
});
