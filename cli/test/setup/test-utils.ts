/**
 * Test Utilities
 *
 * Shared utilities for test files that need Pocketbase
 */

import { TEST_EMAIL, TEST_PASSWORD, TEST_PORT, TEST_URL } from './test-pocketbase.js'

export { TEST_EMAIL, TEST_PASSWORD, TEST_PORT, TEST_URL }

/**
 * Check if test Pocketbase is available
 * This checks port 8091 (test instance) not 8090 (dev instance)
 */
export async function isTestPocketbaseAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${TEST_URL}/api/health`)
    return response.ok
  }
  catch {
    return false
  }
}

/**
 * Get test Pocketbase configuration
 */
export function getTestPocketbaseConfig() {
  return {
    url: TEST_URL,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    port: TEST_PORT,
  }
}
