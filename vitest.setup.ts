/**
 * Vitest setup file
 * Mocks VitePress APIs and suppresses expected cleanup noise from happy-dom
 */

import { expect, vi } from 'vitest'
// Register the `toHaveNoViolations` matcher for axe-core accessibility assertions.
// (Type augmentation for the matcher lives in
// docs/.vitepress/theme/test-utils/vitest-axe.d.ts.)
import * as axeMatchers from 'vitest-axe/matchers'
import { ref } from 'vue'

expect.extend(axeMatchers)

// Mock VitePress module - provides useData(), useRoute(), etc.
// Components like BrandIcon use useData() for dark mode detection.
vi.mock('vitepress', () => ({
  useData: () => ({
    isDark: ref(false),
    frontmatter: ref({}),
    page: ref({ relativePath: '' }),
    site: ref({ title: 'SAF' }),
    theme: ref({}),
    lang: ref('en-US'),
    localePath: ref('/'),
  }),
  useRoute: () => ({
    path: '/',
    data: {},
  }),
  withBase: (url: string) => url,
}))

// Suppress happy-dom AbortError messages during test teardown
// These occur when happy-dom cleans up pending async operations (fetch, timers)
// and are expected behavior, not actual test failures
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const message = args[0]
  if (
    typeof message === 'string'
    && message.includes('AbortError')
    && message.includes('operation was aborted')
  ) {
    return // Suppress happy-dom cleanup noise
  }
  originalConsoleError.apply(console, args)
}
