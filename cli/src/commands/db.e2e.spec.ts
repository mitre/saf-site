/**
 * Database Command E2E Tests
 *
 * Tests that spawn the actual CLI binary and verify stdout/stderr/exit codes.
 * Uses the test Pocketbase instance (port 8091) managed by global setup.
 */

import type { ExecaError } from 'execa'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path to the CLI entry point
const CLI_DEV_PATH = join(__dirname, '../index.ts')

// Test Pocketbase configuration (managed by global setup)
const TEST_PB_URL = process.env.PB_URL || 'http://127.0.0.1:8091'
const TEST_PB_EMAIL = process.env.PB_EMAIL || 'admin@localhost.com'
const TEST_PB_PASSWORD = process.env.PB_PASSWORD || 'testpassword123'

// Helper to run CLI command with test Pocketbase env vars
async function runCli(args: string[], options: { expectError?: boolean } = {}): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  try {
    const result = await execa('npx', ['tsx', CLI_DEV_PATH, ...args], {
      cwd: join(__dirname, '../..'),
      env: {
        ...process.env,
        FORCE_COLOR: '0', // Disable colors for easier assertion
        PB_URL: TEST_PB_URL,
        PB_EMAIL: TEST_PB_EMAIL,
        PB_PASSWORD: TEST_PB_PASSWORD,
      },
    })
    return {
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
      exitCode: result.exitCode ?? 0,
    }
  }
  catch (error) {
    const execaError = error as ExecaError
    if (options.expectError) {
      return {
        stdout: String(execaError.stdout ?? ''),
        stderr: String(execaError.stderr ?? ''),
        exitCode: execaError.exitCode ?? 1,
      }
    }
    throw error
  }
}

// ============================================================================
// HELP TESTS
// ============================================================================

describe('db CLI - help', () => {
  it('shows help for db command', async () => {
    const { stdout, exitCode } = await runCli(['db', '--help'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('Database management')
    expect(stdout).toContain('status')
    expect(stdout).toContain('export')
    expect(stdout).toContain('validate')
    expect(stdout).toContain('lookups')
    expect(stdout).toContain('audit')
  })

  it('shows help for db status', async () => {
    const { stdout, exitCode } = await runCli(['db', 'status', '--help'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('connection')
  })

  it('shows help for db validate', async () => {
    const { stdout, exitCode } = await runCli(['db', 'validate', '--help'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('integrity')
  })

  it('shows help for db lookups', async () => {
    const { stdout, exitCode } = await runCli(['db', 'lookups', '--help'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('FK lookup')
    expect(stdout).toContain('collection')
  })

  it('shows help for db audit', async () => {
    const { stdout, exitCode } = await runCli(['db', 'audit', '--help'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('naming convention')
    expect(stdout).toContain('--fix')
  })
})

// ============================================================================
// STATUS COMMAND TESTS
// ============================================================================

describe('db CLI - status', () => {
  it('shows database is found', async () => {
    const { stdout, exitCode } = await runCli(['db', 'status'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('Database found')
  })

  it('shows collection statistics', async () => {
    const { stdout, exitCode } = await runCli(['db', 'status'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('content')
    expect(stdout).toContain('organizations')
    expect(stdout).toContain('standards')
    expect(stdout).toContain('records')
  })
})

// ============================================================================
// LOOKUPS COMMAND TESTS
// ============================================================================

describe('db CLI - lookups', () => {
  it('shows all FK collections when no argument', async () => {
    const { stdout, exitCode } = await runCli(['db', 'lookups'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('organizations:')
    expect(stdout).toContain('standards:')
    expect(stdout).toContain('technologies:')
    expect(stdout).toContain('targets:')
    expect(stdout).toContain('teams:')
  })

  it('filters to specific collection', async () => {
    const { stdout, exitCode } = await runCli(['db', 'lookups', 'organizations'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('organizations:')
    // Should not contain other collections
    expect(stdout).not.toContain('standards:')
    expect(stdout).not.toContain('technologies:')
  })

  it('shows MITRE in organizations', async () => {
    const { stdout, exitCode } = await runCli(['db', 'lookups', 'organizations'])

    expect(exitCode).toBe(0)
    expect(stdout.toLowerCase()).toContain('mitre')
  })

  it('shows targets collection', async () => {
    const { stdout, exitCode } = await runCli(['db', 'lookups', 'targets'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('targets:')
    // Should have some known targets
    expect(stdout.toLowerCase()).toMatch(/rhel|windows|ubuntu|red hat/i)
  })

  it('handles unknown collection gracefully', async () => {
    const { stdout } = await runCli(['db', 'lookups', 'nonexistent'])

    // Should complete but show error for unknown collection
    expect(stdout).toContain('Unknown collection')
  })
})

// ============================================================================
// VALIDATE COMMAND TESTS
// ============================================================================

describe('db CLI - validate', () => {
  it('validates database successfully', async () => {
    const { stdout, exitCode } = await runCli(['db', 'validate'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('Database Validation')
    expect(stdout).toContain('Validated')
    expect(stdout).toContain('content records')
  })

  it('reports validation passed', async () => {
    const { stdout, exitCode } = await runCli(['db', 'validate'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('validations passed')
  })
})

// ============================================================================
// AUDIT COMMAND TESTS
// ============================================================================

describe('db CLI - audit', () => {
  it('runs slug audit', async () => {
    const { stdout } = await runCli(['db', 'audit'], { expectError: true })

    // Audit may exit 1 if errors found
    expect(stdout).toContain('Slug Convention Audit')
    expect(stdout).toContain('Loaded')
    expect(stdout).toContain('content records')
  })

  it('shows summary with counts', async () => {
    const { stdout } = await runCli(['db', 'audit'], { expectError: true })

    expect(stdout).toContain('Summary')
    expect(stdout).toContain('Compliant')
    expect(stdout).toContain('Warnings')
    expect(stdout).toContain('Errors')
  })

  it('identifies non-compliant slugs', async () => {
    const { stdout } = await runCli(['db', 'audit'], { expectError: true })

    // We know there are some non-compliant slugs
    // Should show at least one error or warning marker
    expect(stdout).toMatch(/[✗⚠]/u)
  })

  it('shows --fix suggestions when flag provided', async () => {
    const { stdout } = await runCli(['db', 'audit', '--fix'], { expectError: true })

    expect(stdout).toContain('Slug Convention Audit')
    // With --fix, should show suggested slugs for non-compliant entries
    // (if any have suggestions)
  })

  it('exits with code 1 when errors found', async () => {
    const { exitCode } = await runCli(['db', 'audit'], { expectError: true })

    // Based on our earlier test run, there are errors
    expect(exitCode).toBe(1)
  })
})

// ============================================================================
// EXPORT COMMAND TESTS
// ============================================================================

describe('db CLI - export', () => {
  it('shows export help', async () => {
    const { stdout, exitCode } = await runCli(['db', 'export', '--help'])

    expect(exitCode).toBe(0)
    expect(stdout).toContain('git-trackable')
  })

  // Note: We don't test actual export because it modifies files
  // and depends on pnpm db:export being available from CLI cwd
})
