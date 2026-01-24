/**
 * Database Command Integration Tests
 *
 * Tests the db commands against the test Pocketbase instance.
 * Uses the test Pocketbase managed by global setup (port 8091).
 */

import { auditSlug } from '@schema/validation.js'
import { describe, expect, it } from 'vitest'
import { checkConnection, getPocketBase, loadFkMaps } from '../lib/pocketbase.js'

// Test Pocketbase configuration (managed by global setup)
const _TEST_PB_URL = process.env.PB_URL || 'http://127.0.0.1:8091'

// ============================================================================
// CONNECTION TESTS
// ============================================================================

describe('db status - connection', () => {
  it('checkConnection returns true when Pocketbase is running', async () => {
    const isConnected = await checkConnection()
    expect(isConnected).toBe(true)
  })

  it('getPocketBase returns authenticated client', async () => {
    const pb = await getPocketBase()
    expect(pb).toBeDefined()
    expect(pb.authStore.isValid).toBe(true)
  })
})

// ============================================================================
// COLLECTION STATS TESTS
// ============================================================================

describe('db status - collection stats', () => {
  it('can query content collection', async () => {
    const pb = await getPocketBase()
    const result = await pb.collection('content').getList(1, 1)

    expect(result.totalItems).toBeGreaterThan(0)
  })

  it('can query all expected collections', async () => {
    const pb = await getPocketBase()
    const collections = [
      'content',
      'organizations',
      'standards',
      'technologies',
      'targets',
      'teams',
      'tags',
      'tools',
    ]

    for (const collection of collections) {
      const result = await pb.collection(collection).getList(1, 1)
      expect(result.totalItems).toBeGreaterThanOrEqual(0)
    }
  })
})

// ============================================================================
// FK MAPS TESTS (lookups)
// ============================================================================

describe('db lookups - FK maps', () => {
  it('loadFkMaps returns all expected maps', async () => {
    const maps = await loadFkMaps()

    expect(maps.organizations).toBeDefined()
    expect(maps.standards).toBeDefined()
    expect(maps.technologies).toBeDefined()
    expect(maps.targets).toBeDefined()
    expect(maps.teams).toBeDefined()
  })

  it('organizations map contains expected entries', async () => {
    const maps = await loadFkMaps()

    // Should have MITRE
    const hasKey = Array.from(maps.organizations.keys()).some(
      k => k.toLowerCase().includes('mitre'),
    )
    expect(hasKey).toBe(true)
  })

  it('standards map contains expected entries', async () => {
    const maps = await loadFkMaps()

    // Should have STIG or CIS
    const keys = Array.from(maps.standards.keys()).map(k => k.toLowerCase())
    const hasExpected = keys.some(k => k.includes('stig') || k.includes('cis'))
    expect(hasExpected).toBe(true)
  })

  it('technologies map contains expected entries', async () => {
    const maps = await loadFkMaps()

    // Should have InSpec or Ansible
    const keys = Array.from(maps.technologies.keys()).map(k => k.toLowerCase())
    const hasExpected = keys.some(k => k.includes('inspec') || k.includes('ansible'))
    expect(hasExpected).toBe(true)
  })

  it('targets map contains expected entries', async () => {
    const maps = await loadFkMaps()

    // Should have RHEL or Windows
    const keys = Array.from(maps.targets.keys()).map(k => k.toLowerCase())
    const hasExpected = keys.some(k => k.includes('rhel') || k.includes('red hat') || k.includes('windows'))
    expect(hasExpected).toBe(true)
  })

  it('maps have ID values', async () => {
    const maps = await loadFkMaps()

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
  it('all content records have required fields', async () => {
    const pb = await getPocketBase()
    const content = await pb.collection('content').getFullList()

    for (const record of content) {
      expect(record.name, `Record ${record.id} missing name`).toBeTruthy()
      expect(record.slug, `Record ${record.id} missing slug`).toBeTruthy()
      expect(record.content_type, `Record ${record.id} missing content_type`).toBeTruthy()
    }
  })

  it('content FK references are valid', async () => {
    const pb = await getPocketBase()

    // Get a sample of content with FKs
    const content = await pb.collection('content').getList(1, 10, {
      filter: 'target != "" || standard != ""',
    })

    for (const record of content.items) {
      // If target is set, it should be resolvable
      if (record.target) {
        const target = await pb.collection('targets').getOne(record.target).catch(() => null)
        expect(target, `Record ${record.id} has invalid target ${record.target}`).toBeTruthy()
      }

      // If standard is set, it should be resolvable
      if (record.standard) {
        const standard = await pb.collection('standards').getOne(record.standard).catch(() => null)
        expect(standard, `Record ${record.id} has invalid standard ${record.standard}`).toBeTruthy()
      }
    }
  })

  it('tools have required fields', async () => {
    const pb = await getPocketBase()
    const tools = await pb.collection('tools').getFullList()

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

  it('database has some non-compliant slugs', async () => {
    const pb = await getPocketBase()
    const content = await pb.collection('content').getFullList()

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
