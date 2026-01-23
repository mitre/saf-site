/**
 * Test Pocketbase Infrastructure
 *
 * Based on the official Pocketbase testing pattern from:
 * https://github.com/pocketbase/pocketbase/discussions/603
 *
 * The maintainer-recommended approach:
 * 1. Create test data directory with `--dir` flag
 * 2. Copy test data to temp location for each test run
 * 3. Spawn Pocketbase process
 * 4. Use wait-on or polling to wait for server readiness
 * 5. Run tests
 * 6. Stop process and cleanup
 *
 * For our use case:
 * - We restore from diffable/ (our git-tracked database export)
 * - We run a single instance for the entire test suite (global setup/teardown)
 * - Tests run on a separate port (8091) to avoid conflicts with development
 */

import { spawn, ChildProcess } from 'child_process'
import { existsSync, rmSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import waitOn from 'wait-on'
import { load as restoreDatabase } from '../../../scripts/db-diffable.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test configuration
// Using port 8091 to avoid conflicts with development server (8090)
export const TEST_PORT = 8091
export const TEST_URL = `http://127.0.0.1:${TEST_PORT}`
export const TEST_EMAIL = 'admin@localhost.com'
export const TEST_PASSWORD = 'testpassword123'

// Paths (based on official Pocketbase --dir pattern)
const PROJECT_ROOT = join(__dirname, '../../..')
const POCKETBASE_DIR = join(PROJECT_ROOT, '.pocketbase')
const POCKETBASE_BINARY = join(POCKETBASE_DIR, 'pocketbase')
const DIFFABLE_DIR = join(POCKETBASE_DIR, 'pb_data/diffable')
// Test data directory - separate from development (as per official docs)
const TEST_DATA_DIR = join(POCKETBASE_DIR, 'test_pb_data')
const TEST_DB_PATH = join(TEST_DATA_DIR, 'data.db')

let pbProcess: ChildProcess | null = null

/**
 * Restore test database from diffable/
 *
 * Based on official pattern: "create the test data via the Dashboard
 * (both collections and records). Once completed you can stop the server
 * (you could also commit test_pb_data to your repo)."
 *
 * In our case, we restore from diffable/ which is our git-tracked export.
 */
export async function restoreTestDatabase(): Promise<void> {
  console.log('[test-pb] Restoring test database from diffable/...')

  // Clean existing test data directory
  if (existsSync(TEST_DATA_DIR)) {
    rmSync(TEST_DATA_DIR, { recursive: true })
  }
  mkdirSync(TEST_DATA_DIR, { recursive: true })

  // Restore database using the diffable loader
  const result = restoreDatabase(TEST_DB_PATH, DIFFABLE_DIR, { quiet: true })
  if (result !== 0) {
    throw new Error('Failed to restore test database from diffable/')
  }

  console.log('[test-pb] Test database restored successfully')
}

/**
 * Start test Pocketbase instance
 *
 * Uses the official pattern:
 * ./pocketbase serve --dir="./test_pb_data" --http="127.0.0.1:8091"
 */
export async function startTestPocketbase(): Promise<void> {
  if (!existsSync(POCKETBASE_BINARY)) {
    throw new Error(
      `Pocketbase binary not found at ${POCKETBASE_BINARY}.\n` +
      'Run: pnpm dev:setup'
    )
  }

  if (!existsSync(TEST_DB_PATH)) {
    await restoreTestDatabase()
  }

  console.log(`[test-pb] Starting Pocketbase on port ${TEST_PORT}...`)
  console.log(`[test-pb] Command: ${POCKETBASE_BINARY} serve --dir=${TEST_DATA_DIR} --http=127.0.0.1:${TEST_PORT}`)

  // Spawn Pocketbase process (as per official pattern)
  pbProcess = spawn(POCKETBASE_BINARY, [
    'serve',
    `--dir=${TEST_DATA_DIR}`,
    `--http=127.0.0.1:${TEST_PORT}`
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  })

  // Log output for debugging
  pbProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim()
    if (output) {
      console.log(`[test-pb:stdout] ${output}`)
    }
  })

  pbProcess.stderr?.on('data', (data) => {
    const output = data.toString().trim()
    if (output) {
      console.log(`[test-pb:stderr] ${output}`)
    }
  })

  pbProcess.on('error', (err) => {
    console.error('[test-pb] Process error:', err)
  })

  pbProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[test-pb] Process exited with code ${code}`)
    }
  })

  // Wait for server to be ready using wait-on
  // (recommended by community in the official discussion)
  console.log('[test-pb] Waiting for server to be ready...')
  try {
    await waitOn({
      resources: [`${TEST_URL}/api/health`],
      timeout: 30000,
      interval: 100,
      validateStatus: (status: number) => status === 200
    })
    console.log(`[test-pb] Pocketbase ready at ${TEST_URL}`)
  } catch (error) {
    console.error('[test-pb] Server failed to start:', error)
    await stopTestPocketbase()
    throw new Error(`Pocketbase failed to start at ${TEST_URL}`)
  }
}

/**
 * Stop test Pocketbase instance
 *
 * Based on official pattern using AbortController.abort()
 * For our async case, we use process.kill()
 */
export async function stopTestPocketbase(): Promise<void> {
  if (!pbProcess) {
    console.log('[test-pb] No Pocketbase process to stop')
    return
  }

  console.log('[test-pb] Stopping Pocketbase...')

  return new Promise((resolve) => {
    const killTimeout = setTimeout(() => {
      console.log('[test-pb] Force killing Pocketbase (SIGKILL)...')
      pbProcess?.kill('SIGKILL')
      pbProcess = null
      resolve()
    }, 5000)

    pbProcess!.on('exit', () => {
      clearTimeout(killTimeout)
      console.log('[test-pb] Pocketbase stopped')
      pbProcess = null
      resolve()
    })

    // Graceful shutdown first
    pbProcess!.kill('SIGTERM')
  })
}

/**
 * Cleanup test data directory
 *
 * Optional - can be called to remove test_pb_data after tests
 */
export function cleanupTestData(): void {
  if (existsSync(TEST_DATA_DIR)) {
    console.log('[test-pb] Cleaning up test data directory...')
    rmSync(TEST_DATA_DIR, { recursive: true })
  }
}

/**
 * Check if test Pocketbase is available
 */
export async function isTestPocketbaseAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${TEST_URL}/api/health`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get test Pocketbase configuration for use in tests
 */
export function getTestConfig() {
  return {
    url: TEST_URL,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    port: TEST_PORT
  }
}
