/**
 * Vitest setup file
 * Suppresses expected cleanup noise from happy-dom
 */

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
