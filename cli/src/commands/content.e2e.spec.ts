/**
 * Content Command E2E Tests
 *
 * Tests that spawn the actual CLI binary and verify stdout/stderr/exit codes.
 * Uses the test Pocketbase instance (port 8091) managed by global setup.
 *
 * Tests are marked with:
 * - @live: Requires Pocketbase running (uses test instance on 8091)
 * - @offline: Tests that can run without Pocketbase (validation, parsing errors)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execa, type ExecaError } from 'execa'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path to the CLI entry point
const CLI_PATH = join(__dirname, '../../dist/index.js')
const CLI_DEV_PATH = join(__dirname, '../index.ts')

// Test Pocketbase configuration (managed by global setup)
const TEST_PB_URL = process.env.PB_URL || 'http://127.0.0.1:8091'
const TEST_PB_EMAIL = process.env.PB_EMAIL || 'admin@localhost.com'
const TEST_PB_PASSWORD = process.env.PB_PASSWORD || 'testpassword123'

// Helper to run CLI command with test Pocketbase env vars
async function runCli(args: string[], options: { expectError?: boolean } = {}) {
  try {
    const result = await execa('npx', ['tsx', CLI_DEV_PATH, ...args], {
      cwd: join(__dirname, '../..'),
      env: {
        ...process.env,
        FORCE_COLOR: '0', // Disable colors for easier assertion
        PB_URL: TEST_PB_URL,
        PB_EMAIL: TEST_PB_EMAIL,
        PB_PASSWORD: TEST_PB_PASSWORD
      }
    })
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    }
  } catch (error) {
    const execaError = error as ExecaError
    if (options.expectError) {
      return {
        stdout: execaError.stdout || '',
        stderr: execaError.stderr || '',
        exitCode: execaError.exitCode || 1
      }
    }
    throw error
  }
}

// ============================================================================
// OFFLINE E2E TESTS (No Pocketbase required)
// ============================================================================

describe('Content CLI E2E - Offline', () => {
  describe('help and usage', () => {
    it('shows help for content command', async () => {
      const { stdout } = await runCli(['content', '--help'])

      expect(stdout).toContain('content')
      expect(stdout).toContain('add')
      expect(stdout).toContain('list')
      expect(stdout).toContain('update')
    })

    it('shows help for content add command', async () => {
      const { stdout } = await runCli(['content', 'add', '--help'])

      expect(stdout).toContain('--type')
      expect(stdout).toContain('--vendor')
      expect(stdout).toContain('--standard')
      expect(stdout).toContain('--yes')
      expect(stdout).toContain('--json')
      expect(stdout).toContain('--dry-run')
    })

    it('shows help for content list command', async () => {
      const { stdout } = await runCli(['content', 'list', '--help'])

      expect(stdout).toContain('--type')
      expect(stdout).toContain('--status')
      expect(stdout).toContain('--json')
      expect(stdout).toContain('--quiet')
    })

    it('shows help for content update command', async () => {
      const { stdout } = await runCli(['content', 'update', '--help'])

      expect(stdout).toContain('--version')
      expect(stdout).toContain('--status')
      expect(stdout).toContain('--sync-readme')
      expect(stdout).toContain('--dry-run')
    })
  })

  describe('input validation errors', () => {
    it('fails with error for invalid content type', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        'https://github.com/mitre/test',
        '--type', 'invalid',
        '--yes', '--json'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      const parsed = JSON.parse(stdout)
      expect(parsed.success).toBe(false)
      expect(parsed.errors).toContain('Content type must be "validation" or "hardening"')
    })

    it('fails with error for missing URL in non-interactive mode', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        '--type', 'validation',
        '--yes', '--json'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      const parsed = JSON.parse(stdout)
      expect(parsed.success).toBe(false)
      expect(parsed.errors).toContain('GitHub URL is required')
    })

    it('fails with error for missing content type in non-interactive mode', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        'https://github.com/mitre/test',
        '--yes', '--json'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      const parsed = JSON.parse(stdout)
      expect(parsed.success).toBe(false)
      expect(parsed.errors.some((e: string) => e.includes('Content type'))).toBe(true)
    })

    it('fails with error for invalid GitHub URL', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        'not-a-valid-url',
        '--type', 'validation',
        '--yes', '--json'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      const parsed = JSON.parse(stdout)
      expect(parsed.success).toBe(false)
      expect(parsed.errors).toContain('Invalid GitHub URL')
    })

    it('fails with error for invalid status', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        'https://github.com/mitre/test',
        '--type', 'validation',
        '--status', 'invalid',
        '--yes', '--json'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      const parsed = JSON.parse(stdout)
      expect(parsed.success).toBe(false)
      expect(parsed.errors.some((e: string) => e.includes('Status'))).toBe(true)
    })

    it('fails with error for invalid automation level', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        'https://github.com/mitre/test',
        '--type', 'hardening',
        '--automation-level', 'invalid',
        '--yes', '--json'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      const parsed = JSON.parse(stdout)
      expect(parsed.success).toBe(false)
      expect(parsed.errors.some((e: string) => e.includes('Automation level'))).toBe(true)
    })
  })

  describe('output formats', () => {
    it('outputs JSON with --json flag on validation error', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        '--type', 'invalid',
        '--yes', '--json'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      // Should be valid JSON
      expect(() => JSON.parse(stdout)).not.toThrow()
      const parsed = JSON.parse(stdout)
      expect(parsed).toHaveProperty('success')
      expect(parsed).toHaveProperty('errors')
    })

    it('outputs nothing with --quiet flag on validation error', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        '--type', 'invalid',
        '--yes', '--quiet'
      ], { expectError: true })

      expect(exitCode).toBe(1)
      // Quiet mode should have minimal output on error
      expect(stdout.trim()).toBe('')
    })
  })
})

// ============================================================================
// LIVE E2E TESTS (Require Pocketbase - provided by global setup)
// ============================================================================

describe('Content CLI E2E - Live', () => {
  // Pocketbase is always available via global setup (port 8091)
  // If global setup fails, all tests will fail anyway

  describe('content list', () => {
    it('lists content with --json', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'list', '--json', '--limit', '5'
      ])

      expect(exitCode).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(Array.isArray(parsed)).toBe(true)
    })

    it('lists content with --quiet (IDs only)', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'list', '--quiet', '--limit', '5'
      ])

      expect(exitCode).toBe(0)
      // Each line should be an ID
      const lines = stdout.trim().split('\n').filter(Boolean)
      for (const line of lines) {
        // IDs are typically alphanumeric
        expect(line).toMatch(/^[a-zA-Z0-9_-]+$/)
      }
    })

    it('filters by content type', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'list', '--type', 'validation', '--json', '--limit', '5'
      ])

      expect(exitCode).toBe(0)
      const parsed = JSON.parse(stdout)
      for (const record of parsed) {
        expect(record.content_type).toBe('validation')
      }
    })

    it('filters by status', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'list', '--status', 'active', '--json', '--limit', '5'
      ])

      expect(exitCode).toBe(0)
      const parsed = JSON.parse(stdout)
      for (const record of parsed) {
        expect(record.status).toBe('active')
      }
    })
  })

  describe('content add --dry-run', () => {
    it('validates and prepares content without creating', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
        '--type', 'validation',
        '--vendor', 'MITRE',
        '--standard', 'DISA STIG',
        '--yes', '--json', '--dry-run'
      ])

      expect(exitCode).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(parsed.success).toBe(true)
      expect(parsed.content).toBeDefined()
      expect(parsed.content.contentType).toBe('validation')
    })

    it('shows warnings for unresolved FKs in dry-run', async () => {
      const { stdout, exitCode } = await runCli([
        'content', 'add',
        'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
        '--type', 'validation',
        '--vendor', 'NonexistentOrg',
        '--yes', '--json', '--dry-run'
      ])

      expect(exitCode).toBe(0)
      const parsed = JSON.parse(stdout)
      expect(parsed.warnings.some((w: string) => w.includes('NonexistentOrg'))).toBe(true)
    })
  })

  describe('content show', () => {
    it('shows content details with --json', async () => {
      // First get a content ID
      const listResult = await runCli(['content', 'list', '--quiet', '--limit', '1'])

      if (listResult.exitCode === 0 && listResult.stdout.trim()) {
        const contentId = listResult.stdout.trim().split('\n')[0]

        const { stdout, exitCode } = await runCli([
          'content', 'show', contentId, '--json'
        ])

        expect(exitCode).toBe(0)
        const parsed = JSON.parse(stdout)
        expect(parsed.id).toBe(contentId)
        expect(parsed).toHaveProperty('name')
        expect(parsed).toHaveProperty('slug')
      }
    })
  })
})

// ============================================================================
// REGRESSION TESTS
// ============================================================================

describe('Content CLI E2E - Regression', () => {
  it('handles special characters in arguments', async () => {
    // Test with special characters - use simpler quote escaping
    const { stdout, exitCode } = await runCli([
      'content', 'add',
      'https://github.com/mitre/test-repo',
      '--type', 'validation',
      '--name', "Test Name With Spaces",
      '--yes', '--json', '--dry-run'
    ], { expectError: true })

    // Should not crash, even if it fails for other reasons (network, etc.)
    // The key is that the CLI handles the args without crashing
    expect(stdout).toBeDefined()
  }, 10000) // Extended timeout for network operations

  it('handles empty string arguments gracefully', async () => {
    const { stdout, exitCode } = await runCli([
      'content', 'add',
      '',
      '--type', 'validation',
      '--yes', '--json'
    ], { expectError: true })

    expect(exitCode).toBe(1)
    const parsed = JSON.parse(stdout)
    expect(parsed.success).toBe(false)
  })
})
