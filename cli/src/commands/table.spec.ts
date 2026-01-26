/**
 * Table Commands E2E Smoke Tests (saf-site-gf9 Step 2)
 *
 * Minimal E2E tests to verify CLI → Drizzle integration.
 * Detailed tests are in:
 *   - table.cli.spec.ts (formatting - 21 unit tests)
 *   - drizzle.spec.ts (data layer - 21 unit tests)
 *
 * These smoke tests verify the full stack works end-to-end.
 */

import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

// Helper to run CLI commands
function cli(args: string): { stdout: string, stderr: string, exitCode: number } {
  try {
    const stdout = execSync(`npx tsx src/index.ts ${args}`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { stdout, stderr: '', exitCode: 0 }
  }
  catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    }
  }
}

describe('table commands (E2E smoke tests)', () => {
  it('list: returns records from database', () => {
    const result = cli('table list organizations --limit 1 --json')

    expect(result.exitCode).toBe(0)
    const records = JSON.parse(result.stdout)
    expect(Array.isArray(records)).toBe(true)
    expect(records.length).toBe(1)
    expect(records[0]).toHaveProperty('id')
    expect(records[0]).toHaveProperty('name')
  })

  it('show: returns single record by ID', () => {
    // First get a valid ID
    const listResult = cli('table list organizations --limit 1 --json')
    const records = JSON.parse(listResult.stdout)
    const id = records[0].id

    const result = cli(`table show organizations ${id} --json`)

    expect(result.exitCode).toBe(0)
    const record = JSON.parse(result.stdout)
    expect(record.id).toBe(id)
  })

  it('CRUD round-trip: add → show → update → delete', { timeout: 30000 }, () => {
    const id = `smoke-test-${Date.now()}`

    // ADD
    const addInput = JSON.stringify({ id, name: 'Smoke Test Org', slug: id })
    const addResult = cli(`table add organizations --json --data '${addInput}'`)
    expect(addResult.exitCode).toBe(0)
    const created = JSON.parse(addResult.stdout)
    expect(created.name).toBe('Smoke Test Org')

    // SHOW
    const showResult = cli(`table show organizations ${id} --json`)
    expect(showResult.exitCode).toBe(0)
    const fetched = JSON.parse(showResult.stdout)
    expect(fetched.id).toBe(id)

    // UPDATE
    const updateInput = JSON.stringify({ name: 'Updated Smoke Test' })
    const updateResult = cli(`table update organizations ${id} --json --data '${updateInput}'`)
    expect(updateResult.exitCode).toBe(0)
    const updated = JSON.parse(updateResult.stdout)
    expect(updated.name).toBe('Updated Smoke Test')

    // DELETE
    const deleteResult = cli(`table delete organizations ${id} --yes`)
    expect(deleteResult.exitCode).toBe(0)

    // VERIFY DELETED
    const verifyResult = cli(`table show organizations ${id} --json`)
    expect(verifyResult.exitCode).toBe(1)
  })
})
