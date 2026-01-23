import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@schema': path.resolve(__dirname, '../docs/.vitepress/database'),
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.spec.ts',
      '../docs/.vitepress/database/**/*.spec.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/**/*.ts',
        '../docs/.vitepress/database/**/*.ts'
      ],
      exclude: ['**/*.spec.ts']
    }
  }
})
