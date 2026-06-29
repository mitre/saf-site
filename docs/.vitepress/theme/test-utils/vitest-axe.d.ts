import type { AxeMatchers } from 'vitest-axe/matchers'

// Teach Vitest's `expect()` about the axe-core matcher registered in
// vitest.setup.ts. Vitest 4 reads custom-matcher types from the 'vitest'
// module (it no longer honors vitest-axe's legacy global `Vi` namespace).
// The `<T>` parameter must mirror Vitest's own `Assertion<T>` so the
// declarations merge instead of conflicting.
declare module 'vitest' {
  // `T` is unused here but must stay to mirror Vitest's `Assertion<T>` so the
  // declarations merge rather than conflict.
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
