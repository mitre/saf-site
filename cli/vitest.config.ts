import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@schema': path.resolve(__dirname, '../docs/.vitepress/database'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.spec.ts',
      '../docs/.vitepress/database/**/*.spec.ts',
    ],
    // Global setup/teardown for test Pocketbase instance
    // Based on official Pocketbase testing pattern:
    // https://github.com/pocketbase/pocketbase/discussions/603
    globalSetup: ['./test/global-setup.ts'],
    // Run tests with single worker to avoid port conflicts
    // but keep isolation to prevent state pollution
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/**/*.ts',
        '../docs/.vitepress/database/**/*.ts',
      ],
      exclude: ['**/*.spec.ts'],
    },
  },
})
