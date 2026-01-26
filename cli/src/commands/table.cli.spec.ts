/**
 * Table CLI Tests (saf-site-gf9 Step 2)
 *
 * Unit tests for table formatting functions.
 * Tests argument parsing, output formatting, and error handling.
 * Following content.cli.spec.ts pattern - direct imports, no process spawning.
 */

import { describe, expect, it } from 'vitest'
import {
  formatTableList,
  formatTableRecord,
} from './table.cli.js'

// ============================================================================
// TEST DATA
// ============================================================================

const organizationRecords = [
  {
    id: 'org-1',
    name: 'MITRE',
    slug: 'mitre',
    description: 'The MITRE Corporation',
    website: 'https://mitre.org',
  },
  {
    id: 'org-2',
    name: 'CIS',
    slug: 'cis',
    description: 'Center for Internet Security',
    website: 'https://cisecurity.org',
  },
  {
    id: 'org-3',
    name: 'DISA',
    slug: 'disa',
    description: 'Defense Information Systems Agency',
    website: null,
  },
]

const singleRecord = {
  id: 'org-1',
  name: 'MITRE',
  slug: 'mitre',
  description: 'The MITRE Corporation',
  website: 'https://mitre.org',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

const contentRecords = [
  {
    id: 'content-1',
    name: 'RHEL 9 STIG',
    slug: 'rhel-9-stig',
    content_type: 'validation',
    version: '1.0.0',
    target: 'target-1',
  },
  {
    id: 'content-2',
    name: 'Ubuntu 22.04 CIS',
    slug: 'ubuntu-22-04-cis',
    content_type: 'validation',
    version: '2.0.0',
    target: 'target-2',
  },
]

// ============================================================================
// FORMAT TABLE LIST
// ============================================================================

describe('formatTableList', () => {
  describe('json format', () => {
    it('formats records as JSON array', () => {
      const output = formatTableList(organizationRecords, 'organizations', 'json')
      const parsed = JSON.parse(output)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(3)
      expect(parsed[0].name).toBe('MITRE')
      expect(parsed[1].name).toBe('CIS')
      expect(parsed[2].name).toBe('DISA')
    })

    it('preserves all record fields', () => {
      const output = formatTableList(organizationRecords, 'organizations', 'json')
      const parsed = JSON.parse(output)

      expect(parsed[0]).toHaveProperty('id', 'org-1')
      expect(parsed[0]).toHaveProperty('slug', 'mitre')
      expect(parsed[0]).toHaveProperty('description')
      expect(parsed[0]).toHaveProperty('website')
    })

    it('handles empty array', () => {
      const output = formatTableList([], 'organizations', 'json')
      const parsed = JSON.parse(output)

      expect(parsed).toEqual([])
    })

    it('handles null values in records', () => {
      const output = formatTableList(organizationRecords, 'organizations', 'json')
      const parsed = JSON.parse(output)

      // DISA has null website
      expect(parsed[2].website).toBeNull()
    })
  })

  describe('text format', () => {
    it('includes table name and record count', () => {
      const output = formatTableList(organizationRecords, 'organizations', 'text')

      expect(output).toContain('organizations')
      expect(output).toContain('3')
    })

    it('displays record data', () => {
      const output = formatTableList(organizationRecords, 'organizations', 'text')

      expect(output).toContain('MITRE')
      expect(output).toContain('CIS')
      expect(output).toContain('DISA')
    })

    it('shows "No records found" for empty array', () => {
      const output = formatTableList([], 'organizations', 'text')

      expect(output).toMatch(/no records/i)
    })

    it('truncates long values', () => {
      const longRecord = [{
        id: 'long-1',
        name: 'This is a very long organization name that should be truncated',
        slug: 'long-org',
      }]

      const output = formatTableList(longRecord, 'organizations', 'text')

      // Should truncate but still display something
      expect(output).toContain('This is a very')
      // Should not contain the full string unchanged
      expect(output).not.toContain('This is a very long organization name that should be truncated')
    })
  })

  describe('quiet format', () => {
    it('outputs only IDs, one per line', () => {
      const output = formatTableList(organizationRecords, 'organizations', 'quiet')
      const lines = output.trim().split('\n')

      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('org-1')
      expect(lines[1]).toBe('org-2')
      expect(lines[2]).toBe('org-3')
    })

    it('returns empty string for empty array', () => {
      const output = formatTableList([], 'organizations', 'quiet')

      expect(output).toBe('')
    })
  })

  describe('different table types', () => {
    it('works with content table', () => {
      const output = formatTableList(contentRecords, 'content', 'json')
      const parsed = JSON.parse(output)

      expect(parsed[0].content_type).toBe('validation')
      expect(parsed[1].version).toBe('2.0.0')
    })

    it('works with any generic record structure', () => {
      const genericRecords = [
        { id: 'a', custom_field: 'value1' },
        { id: 'b', custom_field: 'value2' },
      ]

      const output = formatTableList(genericRecords, 'custom_table', 'json')
      const parsed = JSON.parse(output)

      expect(parsed[0].custom_field).toBe('value1')
    })
  })
})

// ============================================================================
// FORMAT TABLE RECORD
// ============================================================================

describe('formatTableRecord', () => {
  describe('json format', () => {
    it('formats record as JSON object', () => {
      const output = formatTableRecord(singleRecord, 'organizations', 'json')
      const parsed = JSON.parse(output)

      expect(parsed.id).toBe('org-1')
      expect(parsed.name).toBe('MITRE')
      expect(parsed.slug).toBe('mitre')
    })

    it('preserves all fields including timestamps', () => {
      const output = formatTableRecord(singleRecord, 'organizations', 'json')
      const parsed = JSON.parse(output)

      expect(parsed.created_at).toBe('2024-01-01T00:00:00Z')
      expect(parsed.updated_at).toBe('2024-01-15T00:00:00Z')
    })

    it('handles null values', () => {
      const recordWithNull = { id: 'test', name: 'Test', optional_field: null }
      const output = formatTableRecord(recordWithNull, 'test_table', 'json')
      const parsed = JSON.parse(output)

      expect(parsed.optional_field).toBeNull()
    })
  })

  describe('text format', () => {
    it('includes table name', () => {
      const output = formatTableRecord(singleRecord, 'organizations', 'text')

      expect(output).toContain('organizations')
    })

    it('displays all fields as key-value pairs', () => {
      const output = formatTableRecord(singleRecord, 'organizations', 'text')

      expect(output).toContain('id')
      expect(output).toContain('org-1')
      expect(output).toContain('name')
      expect(output).toContain('MITRE')
      expect(output).toContain('slug')
      expect(output).toContain('mitre')
    })

    it('displays null values with placeholder', () => {
      const recordWithNull = { id: 'test', name: 'Test', optional_field: null }
      const output = formatTableRecord(recordWithNull, 'test_table', 'text')

      // Should show some indication of null/empty
      expect(output).toContain('optional_field')
      // The actual null display could be '-' or 'null' or similar
    })

    it('handles undefined values', () => {
      const recordWithUndefined = { id: 'test', name: 'Test', optional_field: undefined }
      const output = formatTableRecord(recordWithUndefined, 'test_table', 'text')

      expect(output).toContain('optional_field')
    })
  })

  describe('quiet format', () => {
    it('outputs only the ID', () => {
      const output = formatTableRecord(singleRecord, 'organizations', 'quiet')

      expect(output.trim()).toBe('org-1')
    })

    it('handles record with complex ID', () => {
      const record = { id: 'complex-id-with-dashes-123', name: 'Test' }
      const output = formatTableRecord(record, 'test_table', 'quiet')

      expect(output.trim()).toBe('complex-id-with-dashes-123')
    })
  })
})
