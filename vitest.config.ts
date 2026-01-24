import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Use happy-dom for faster DOM simulation
    environment: 'happy-dom',

    // Global test utilities
    globals: true,

    // Test file patterns
    include: [
      'docs/.vitepress/theme/**/*.spec.ts',
      'docs/.vitepress/theme/**/*.test.ts',
      'docs/.vitepress/lib/**/*.spec.ts',
      'docs/.vitepress/lib/**/*.test.ts',
      'scripts/**/*.spec.ts',
      'scripts/**/*.test.ts'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'docs/.vitepress/theme/composables/**/*.ts',
        'docs/.vitepress/theme/components/**/*.vue',
        'docs/.vitepress/theme/utils/**/*.ts'
      ],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/index.ts'
      ]
    },

    // Aliases matching VitePress paths
    alias: {
      '@/': fileURLToPath(new URL('./docs/.vitepress/theme/', import.meta.url)),
      '@theme': fileURLToPath(new URL('./docs/.vitepress/theme', import.meta.url)),
      '@composables': fileURLToPath(new URL('./docs/.vitepress/theme/composables', import.meta.url)),
      '@components': fileURLToPath(new URL('./docs/.vitepress/theme/components', import.meta.url))
    }
  }
})
