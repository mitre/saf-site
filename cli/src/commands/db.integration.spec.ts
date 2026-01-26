/**
 * Database Command Integration Tests
 *
 * Tests the db commands against the Drizzle SQLite database.
 */

import { existsSync } from 'node:fs'
import { auditSlug } from '@schema/validation.js'
import { describe, expect, it } from 'vitest'
import { getDefaultDbPath, getDrizzle, getRecord, listRecords, loadFkMaps } from '../lib/drizzle.js'

// ============================================================================
// CONNECTION TESTS
// ============================================================================

describe('db status - connection', () => {
  it('database file exists', () => {
    const dbPath = getDefaultDbPath()
    expect(existsSync(dbPath)).toBe(true)
  })

  it('getDrizzle returns working database connection', () => {
    const db = getDrizzle(getDefaultDbPath())
    expect(db).toBeDefined()
  })
})

// ============================================================================
// COLLECTION STATS TESTS
// ============================================================================

describe('db status - collection stats', () => {
  it('can query content table', () => {
    const db = getDrizzle(getDefaultDbPath())
    const result = listRecords(db, 'content')

    expect(result.length).toBeGreaterThan(0)
  })

  it('can query all expected tables', () => {
    const db = getDrizzle(getDefaultDbPath())
    const tables = [
      'content',
      'organizations',
      'standards',
      'technologies',
      'targets',
      'teams',
      'tags',
      'tools',
    ]

    for (const table of tables) {
      const result = listRecords(db, table)
      expect(result.length).toBeGreaterThanOrEqual(0)
    }
  })
})

// ============================================================================
// FK MAPS TESTS (lookups)
// ============================================================================

describe('db lookups - FK maps', () => {
  it('loadFkMaps returns all expected maps', () => {
    const db = getDrizzle(getDefaultDbPath())
    const maps = loadFkMaps(db)

    expect(maps.organizations).toBeDefined()
    expect(maps.standards).toBeDefined()
    expect(maps.technologies).toBeDefined()
    expect(maps.targets).toBeDefined()
    expect(maps.teams).toBeDefined()
  })

  it('organizations map contains expected entries', () => {
    const db = getDrizzle(getDefaultDbPath())
    const maps = loadFkMaps(db)

    // Should have MITRE
    const hasKey = Array.from(maps.organizations.keys()).some(
      k => k.toLowerCase().includes('mitre'),
    )
    expect(hasKey).toBe(true)
  })

  it('standards map contains expected entries', () => {
    const db = getDrizzle(getDefaultDbPath())
    const maps = loadFkMaps(db)

    // Should have STIG or CIS
    const keys = Array.from(maps.standards.keys()).map(k => k.toLowerCase())
    const hasExpected = keys.some(k => k.includes('stig') || k.includes('cis'))
    expect(hasExpected).toBe(true)
  })

  it('technologies map contains expected entries', () => {
    const db = getDrizzle(getDefaultDbPath())
    const maps = loadFkMaps(db)

    // Should have InSpec or Ansible
    const keys = Array.from(maps.technologies.keys()).map(k => k.toLowerCase())
    const hasExpected = keys.some(k => k.includes('inspec') || k.includes('ansible'))
    expect(hasExpected).toBe(true)
  })

  it('targets map contains expected entries', () => {
    const db = getDrizzle(getDefaultDbPath())
    const maps = loadFkMaps(db)

    // Should have RHEL or Windows
    const keys = Array.from(maps.targets.keys()).map(k => k.toLowerCase())
    const hasExpected = keys.some(k => k.includes('rhel') || k.includes('red hat') || k.includes('windows'))
    expect(hasExpected).toBe(true)
  })

  it('maps have ID values', () => {
    const db = getDrizzle(getDefaultDbPath())
    const maps = loadFkMaps(db)

    // Check that values are IDs (non-empty strings)
    for (const [_name, id] of maps.organizations.entries()) {
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('db validate - content records', () => {
  it('all content records have required fields', () => {
    const db = getDrizzle(getDefaultDbPath())
    const content = listRecords(db, 'content')

    for (const record of content) {
      expect(record.name, `Record ${record.id} missing name`).toBeTruthy()
      expect(record.slug, `Record ${record.id} missing slug`).toBeTruthy()
      expect(record.contentType, `Record ${record.id} missing contentType`).toBeTruthy()
    }
  })

  it('content FK references are valid', () => {
    const db = getDrizzle(getDefaultDbPath())

    // Get content with FKs
    const content = listRecords(db, 'content') as Array<{ id: string, target?: string, standard?: string }>

    // Check first 10 records with FKs
    const withFks = content.filter(r => r.target || r.standard).slice(0, 10)

    for (const record of withFks) {
      // If target is set, it should be resolvable
      if (record.target) {
        const target = getRecord(db, 'targets', record.target)
        expect(target, `Record ${record.id} has invalid target ${record.target}`).toBeTruthy()
      }

      // If standard is set, it should be resolvable
      if (record.standard) {
        const standard = getRecord(db, 'standards', record.standard)
        expect(standard, `Record ${record.id} has invalid standard ${record.standard}`).toBeTruthy()
      }
    }
  })

  it('tools have required fields', () => {
    const db = getDrizzle(getDefaultDbPath())
    const tools = listRecords(db, 'tools')

    for (const tool of tools) {
      expect(tool.name, `Tool ${tool.id} missing name`).toBeTruthy()
    }
  })
})

// ============================================================================
// AUDIT TESTS
// ============================================================================

describe('db audit - slug conventions', () => {
  it('auditSlug identifies compliant slugs', () => {
    const result = auditSlug('rhel-9-stig', 'Red Hat Enterprise Linux 9 STIG')

    // This should be compliant (ends with known standard)
    expect(result.issues.filter(i => i.includes('standard identifier'))).toHaveLength(0)
  })

  it('auditSlug identifies missing standard suffix', () => {
    const result = auditSlug('aws-s3-security', 'AWS S3 Security')

    // Should flag missing standard identifier
    expect(result.compliant).toBe(false)
    expect(result.issues.some(i => i.includes('standard identifier'))).toBe(true)
  })

  it('auditSlug suggests abbreviations', () => {
    const result = auditSlug('red-hat-7-stig', 'Red Hat 7 STIG')

    // Should suggest using rhel instead of red-hat
    expect(result.issues.some(i => i.includes('rhel'))).toBe(true)
  })

  it('auditSlug suggests win for windows', () => {
    const result = auditSlug('windows-2019-stig', 'Windows 2019 STIG')

    // Should suggest using win instead of windows
    expect(result.issues.some(i => i.includes('win'))).toBe(true)
  })

  it('database has some non-compliant slugs', () => {
    const db = getDrizzle(getDefaultDbPath())
    const content = listRecords(db, 'content') as Array<{ slug: string, name: string }>

    let nonCompliant = 0
    for (const record of content) {
      const audit = auditSlug(record.slug, record.name)
      if (!audit.compliant) {
        nonCompliant++
      }
    }

    // We know from running audit there are non-compliant slugs
    expect(nonCompliant).toBeGreaterThan(0)
  })
})
