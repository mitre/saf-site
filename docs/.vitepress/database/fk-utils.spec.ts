/**
 * Tests for fk-utils.ts - FK detection, ordering, and validation
 *
 * TDD: These tests define the expected behavior before implementation.
 */
import { describe, expect, it } from 'vitest'
import {
  detectForeignKeys,
  getInsertOrder,
  validateFkReference,
  type ForeignKeyInfo,
} from './fk-utils'

// Import schema for real-world testing
import * as schema from './schema'

describe('fk-utils', () => {
  describe('detectForeignKeys', () => {
    it('detects FK columns from Drizzle schema', () => {
      // The content table has FKs to: target, standard, technology, vendor (organizations), maintainer (teams)
      const fks = detectForeignKeys(schema.content)

      expect(fks).toBeInstanceOf(Array)
      expect(fks.length).toBeGreaterThanOrEqual(5)

      // Check specific FKs exist
      const fkNames = fks.map(fk => fk.fromColumn)
      expect(fkNames).toContain('target')
      expect(fkNames).toContain('standard')
      expect(fkNames).toContain('technology')
      expect(fkNames).toContain('vendor')
      expect(fkNames).toContain('maintainer')
    })

    it('returns FK info with correct structure', () => {
      const fks = detectForeignKeys(schema.content)
      const targetFk = fks.find(fk => fk.fromColumn === 'target')

      expect(targetFk).toBeDefined()
      expect(targetFk).toMatchObject({
        fromColumn: 'target',
        toTable: 'targets',
        toColumn: 'id',
      } satisfies ForeignKeyInfo)
    })

    it('returns empty array for tables without FKs', () => {
      // capabilities is a lookup table with no FKs
      const fks = detectForeignKeys(schema.capabilities)
      expect(fks).toEqual([])
    })

    it('detects cascade delete options', () => {
      // contentReleases has FK to content with onDelete: 'cascade'
      const fks = detectForeignKeys(schema.contentReleases)
      const contentFk = fks.find(fk => fk.fromColumn === 'content_id')

      expect(contentFk).toBeDefined()
      expect(contentFk?.onDelete).toBe('cascade')
    })
  })

  describe('getInsertOrder', () => {
    it('orders tables by FK dependencies (parents first)', () => {
      const order = getInsertOrder(schema)

      // Lookup tables (no FKs) should come before dependent tables
      const orgsIndex = order.indexOf('organizations')
      const targetsIndex = order.indexOf('targets')
      const contentIndex = order.indexOf('content')

      expect(orgsIndex).toBeLessThan(contentIndex)
      expect(targetsIndex).toBeLessThan(contentIndex)
    })

    it('puts lookup tables before their dependents', () => {
      const order = getInsertOrder(schema)

      // Lookup tables (no dependencies) should come before tables that depend on them
      // capabilities must come before content_capabilities
      expect(order.indexOf('capabilities')).toBeLessThan(order.indexOf('content_capabilities'))

      // organizations must come before teams (teams.organization FK)
      expect(order.indexOf('organizations')).toBeLessThan(order.indexOf('teams'))

      // tags must come before content_tags
      expect(order.indexOf('tags')).toBeLessThan(order.indexOf('content_tags'))

      // tool_types must come before tools
      expect(order.indexOf('tool_types')).toBeLessThan(order.indexOf('tools'))
    })

    it('puts junction tables last', () => {
      const order = getInsertOrder(schema)

      // Junction tables depend on both sides, should be near end
      const junctionTables = ['content_capabilities', 'content_tags', 'tool_capabilities']
      const lastFew = order.slice(-15)

      for (const table of junctionTables) {
        expect(lastFew).toContain(table)
      }
    })

    it('handles self-references gracefully', () => {
      // content_relationships references content twice (source and related)
      // This should not cause infinite loop
      const order = getInsertOrder(schema)

      expect(order).toContain('content_relationships')
      // content_relationships should come after content
      expect(order.indexOf('content')).toBeLessThan(order.indexOf('content_relationships'))
    })

    it('returns insert-safe order (can insert in this order without FK violations)', () => {
      const order = getInsertOrder(schema)

      // Build a set of "already inserted" tables as we go
      const inserted = new Set<string>()

      for (const tableName of order) {
        // Get the table from schema
        const table = Object.values(schema).find(
          (t: any) => t?.[Symbol.for('drizzle:Name')] === tableName,
        )
        if (!table)
          continue

        // Check all FKs point to already-inserted tables
        const fks = detectForeignKeys(table)
        for (const fk of fks) {
          // Self-references are OK
          if (fk.toTable === tableName)
            continue

          expect(inserted.has(fk.toTable)).toBe(true)
        }

        inserted.add(tableName)
      }
    })
  })

  describe('validateFkReference', () => {
    it('validates FK reference exists in target table data', () => {
      const targetData = [
        { id: 'target-1', name: 'RHEL 8' },
        { id: 'target-2', name: 'MySQL 8' },
      ]

      expect(validateFkReference('target-1', targetData)).toBe(true)
      expect(validateFkReference('target-2', targetData)).toBe(true)
      expect(validateFkReference('target-999', targetData)).toBe(false)
    })

    it('handles empty target data', () => {
      expect(validateFkReference('any-id', [])).toBe(false)
    })

    it('handles null/undefined values', () => {
      const targetData = [{ id: 'target-1', name: 'RHEL 8' }]

      expect(validateFkReference(null, targetData)).toBe(true) // null FK is valid (optional)
      expect(validateFkReference(undefined, targetData)).toBe(true)
      expect(validateFkReference('', targetData)).toBe(true) // empty string is valid (optional)
    })

    it('is case-sensitive for IDs', () => {
      const targetData = [{ id: 'Target-1', name: 'RHEL 8' }]

      expect(validateFkReference('Target-1', targetData)).toBe(true)
      expect(validateFkReference('target-1', targetData)).toBe(false)
    })
  })
})
