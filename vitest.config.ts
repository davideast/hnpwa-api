import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['integration/**/*.test.ts'],
    testTimeout: 30000, // Increase timeout for network requests
  },
});
