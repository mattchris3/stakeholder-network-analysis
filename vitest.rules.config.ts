import { defineConfig } from 'vitest/config';

// Security rules tests: run inside `firebase emulators:exec` (npm run test:rules).
export default defineConfig({
  test: {
    include: ['rules/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20000,
  },
});
