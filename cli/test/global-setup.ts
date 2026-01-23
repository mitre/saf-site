/**
 * Vitest Global Setup/Teardown
 *
 * Based on official Pocketbase testing pattern from:
 * https://github.com/pocketbase/pocketbase/discussions/603
 *
 * Manages test Pocketbase lifecycle:
 * - setup(): Restore database and start test Pocketbase before all tests
 * - teardown(): Stop test Pocketbase after all tests
 *
 * The test Pocketbase runs on port 8091 with a fresh database restored from diffable/
 * This ensures tests have a consistent, isolated environment.
 *
 * Environment variables set for tests:
 * - PB_URL: Points to test instance (http://127.0.0.1:8091)
 * - PB_EMAIL: Test admin email
 * - PB_PASSWORD: Test admin password
 */

import {
  restoreTestDatabase,
  startTestPocketbase,
  stopTestPocketbase,
  cleanupTestData,
  TEST_URL,
  TEST_EMAIL,
  TEST_PASSWORD
} from './setup/test-pocketbase.js'

/**
 * Setup: Called once before all tests
 */
export async function setup(): Promise<void> {
  console.log('\n========================================')
  console.log('[global-setup] Setting up test environment')
  console.log('========================================\n')

  // Set environment variables for test Pocketbase
  // These override the defaults in src/lib/pocketbase.ts
  process.env.PB_URL = TEST_URL
  process.env.PB_EMAIL = TEST_EMAIL
  process.env.PB_PASSWORD = TEST_PASSWORD

  try {
    // Restore fresh database from diffable/
    await restoreTestDatabase()

    // Start test Pocketbase on port 8091
    await startTestPocketbase()

    console.log('\n========================================')
    console.log('[global-setup] Test environment ready')
    console.log(`  URL: ${TEST_URL}`)
    console.log(`  Email: ${TEST_EMAIL}`)
    console.log('========================================\n')
  } catch (error) {
    console.error('\n[global-setup] FAILED to setup test environment')
    console.error(error)

    // Clean up on failure
    await stopTestPocketbase().catch(() => {})
    cleanupTestData()

    throw error
  }
}

/**
 * Teardown: Called once after all tests
 */
export async function teardown(): Promise<void> {
  console.log('\n========================================')
  console.log('[global-teardown] Cleaning up test environment')
  console.log('========================================\n')

  try {
    await stopTestPocketbase()

    // Optionally clean up test data directory
    // Comment out to preserve for debugging failed tests
    // cleanupTestData()

    console.log('[global-teardown] Test environment cleaned up\n')
  } catch (error) {
    console.error('[global-teardown] Error during cleanup:', error)
  }
}
