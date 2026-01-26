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
 * - GITHUB_TOKEN: For authenticated GitHub API access (5000 req/hr vs 60 unauthenticated)
 */

import { execSync } from 'node:child_process'
import {
  cleanupTestData,
  restoreTestDatabase,
  startTestPocketbase,
  stopTestPocketbase,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_URL,
} from './setup/test-pocketbase.js'

/**
 * Get GitHub token for authenticated API access
 *
 * Best practice per GitHub docs: Use authentication to get 5000 requests/hour
 * instead of 60 for unauthenticated requests.
 *
 * Priority:
 * 1. GITHUB_TOKEN env var (CI environments, explicit config)
 * 2. gh auth token (local development with gh CLI)
 *
 * @see https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
 */
function getGitHubToken(): string | null {
  // First check if GITHUB_TOKEN is already set
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN
  }

  // Try to get token from gh CLI (standard for local development)
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    if (token) {
      return token
    }
  }
  catch {
    // gh CLI not installed or not authenticated
  }

  return null
}

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

  // Set GITHUB_TOKEN for authenticated API access (5000 req/hr vs 60)
  // This prevents rate limit errors during tests that call GitHub API
  const githubToken = getGitHubToken()
  if (githubToken) {
    process.env.GITHUB_TOKEN = githubToken
    console.log('[global-setup] GitHub token configured (authenticated API access)')
  }
  else {
    console.warn('[global-setup] WARNING: No GitHub token found')
    console.warn('  Tests requiring GitHub API may fail due to rate limits (60 req/hr)')
    console.warn('  To fix: Run "gh auth login" or set GITHUB_TOKEN env var')
  }

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
  }
  catch (error) {
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
  }
  catch (error) {
    console.error('[global-teardown] Error during cleanup:', error)
  }
}
