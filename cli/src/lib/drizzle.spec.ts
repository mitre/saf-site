/**
 * Tests for Drizzle Data Layer (saf-site-gf9)
 *
 * TDD: These tests define the expected behavior for the Drizzle data layer
 * that will replace Pocketbase for CLI CRUD operations.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DrizzleDatabase } from './drizzle.js'
import {
  createRecord,
  deleteRecord,
  getDrizzle,
  getRecord,
  getTableNames,
  listRecords,
  updateRecord,
} from './drizzle.js'

// Use the actual drizzle.db for read tests, temp db for write tests
// Path is relative to project root (tests run from cli/ but paths resolve from root)
const DRIZZLE_DB_PATH = join(process.cwd(), '../docs/.vitepress/database/drizzle.db')

describe('Drizzle Data Layer', () => {
  describe('getDrizzle', () => {
    it('returns a working database connection', () => {
      const db = getDrizzle(DRIZZLE_DB_PATH)
      expect(db).toBeDefined()
      // Verify we can query
      const result = db.prepare('SELECT COUNT(*) as count FROM content').all() as Array<{ count: number }>
      expect(result[0].count).toBeGreaterThan(0)
    })

    it('throws if database does not exist', () => {
      expect(() => getDrizzle('/nonexistent/path/db.db')).toThrow()
    })
  })

  describe('getTableNames', () => {
    it('returns all 35 user tables', () => {
      const tables = getTableNames()

      expect(tables).toContain('content')
      expect(tables).toContain('organizations')
      expect(tables).toContain('targets')
      expect(tables).toContain('tags')
      expect(tables).toContain('capabilities')
      expect(tables).toContain('content_tags')
      expect(tables).toContain('content_capabilities')

      // Should have 35 tables (from schema)
      expect(tables.length).toBe(35)
    })
  })

  describe('listRecords', () => {
    let db: DrizzleDatabase

    beforeEach(() => {
      db = getDrizzle(DRIZZLE_DB_PATH)
    })

    it('lists all records from a table', () => {
      const records = listRecords(db, 'organizations')

      expect(records.length).toBeGreaterThan(0)
      expect(records[0]).toHaveProperty('id')
      expect(records[0]).toHaveProperty('name')
    })

    it('filters records with where clause', () => {
      const records = listRecords(db, 'content', {
        where: { content_type: 'validation' },
      })

      expect(records.length).toBeGreaterThan(0)
      for (const record of records) {
        expect(record.content_type).toBe('validation')
      }
    })

    it('limits results', () => {
      const records = listRecords(db, 'content', { limit: 5 })

      expect(records.length).toBeLessThanOrEqual(5)
    })

    it('sorts results', () => {
      const records = listRecords(db, 'organizations', {
        orderBy: 'name',
        order: 'asc',
      })

      expect(records.length).toBeGreaterThan(1)
      // Verify sorted alphabetically
      for (let i = 1; i < records.length; i++) {
        expect(records[i].name.localeCompare(records[i - 1].name)).toBeGreaterThanOrEqual(0)
      }
    })

    it('throws for invalid table name', () => {
      expect(() => listRecords(db, 'nonexistent_table')).toThrow(/unknown table/i)
    })
  })

  describe('getRecord', () => {
    let db: DrizzleDatabase

    beforeEach(() => {
      db = getDrizzle(DRIZZLE_DB_PATH)
    })

    it('gets a record by ID', () => {
      // First get a known ID
      const all = listRecords(db, 'organizations', { limit: 1 })
      expect(all.length).toBe(1)

      const record = getRecord(db, 'organizations', all[0].id)

      expect(record).toBeDefined()
      expect(record!.id).toBe(all[0].id)
      expect(record!.name).toBe(all[0].name)
    })

    it('returns null for non-existent ID', () => {
      const record = getRecord(db, 'organizations', 'nonexistent-id-12345')

      expect(record).toBeNull()
    })

    it('throws for invalid table name', () => {
      expect(() => getRecord(db, 'nonexistent_table', 'id')).toThrow(/unknown table/i)
    })
  })

  // Write operations use a temporary database
  describe('Write Operations', () => {
    let testDir: string
    let testDbPath: string
    let db: DrizzleDatabase

    beforeEach(() => {
      // Create temp directory and database
      testDir = join(tmpdir(), `drizzle-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      testDbPath = join(testDir, 'test.db')
      mkdirSync(testDir, { recursive: true })

      // Create schema with drizzle-kit (run from project root, not cli/)
      const projectRoot = join(process.cwd(), '..')
      execSync(
        `npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`,
        { cwd: projectRoot, stdio: 'pipe' },
      )

      db = getDrizzle(testDbPath)
    })

    afterEach(() => {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true })
      }
    })

    describe('createRecord', () => {
      it('creates a record and returns it with ID', () => {
        const input = {
          id: 'test-org-1',
          name: 'Test Organization',
          slug: 'test-org',
          description: 'A test organization',
        }

        const record = createRecord(db, 'organizations', input)

        expect(record).toBeDefined()
        expect(record.id).toBe('test-org-1')
        expect(record.name).toBe('Test Organization')
        expect(record.slug).toBe('test-org')

        // Verify it's persisted
        const fetched = getRecord(db, 'organizations', 'test-org-1')
        expect(fetched).toBeDefined()
        expect(fetched!.name).toBe('Test Organization')
      })

      it('generates ID if not provided', () => {
        const input = {
          name: 'Auto ID Org',
          slug: 'auto-id-org',
        }

        const record = createRecord(db, 'organizations', input)

        expect(record.id).toBeDefined()
        expect(record.id.length).toBeGreaterThan(0)
      })

      it('throws for duplicate unique constraint', () => {
        const input = {
          id: 'dup-org',
          name: 'First Org',
          slug: 'duplicate-slug',
        }

        createRecord(db, 'organizations', input)

        // Try to create with same slug
        expect(() => createRecord(db, 'organizations', {
          id: 'dup-org-2',
          name: 'Second Org',
          slug: 'duplicate-slug',
        })).toThrow(/UNIQUE constraint/i)
      })

      it('throws for FK constraint violation', () => {
        // Try to create content with non-existent target
        expect(() => createRecord(db, 'content', {
          id: 'test-content',
          name: 'Test Content',
          slug: 'test-content',
          content_type: 'validation',
          target: 'nonexistent-target-id',
        })).toThrow(/FOREIGN KEY constraint/i)
      })
    })

    describe('updateRecord', () => {
      it('updates a record and returns updated version', () => {
        // Create a record first
        createRecord(db, 'organizations', {
          id: 'update-test-org',
          name: 'Original Name',
          slug: 'update-test-org',
        })

        const updated = updateRecord(db, 'organizations', 'update-test-org', {
          name: 'Updated Name',
          description: 'Added description',
        })

        expect(updated).toBeDefined()
        expect(updated!.name).toBe('Updated Name')
        expect(updated!.description).toBe('Added description')
        expect(updated!.slug).toBe('update-test-org') // Unchanged

        // Verify persistence
        const fetched = getRecord(db, 'organizations', 'update-test-org')
        expect(fetched!.name).toBe('Updated Name')
      })

      it('returns null for non-existent record', () => {
        const result = updateRecord(db, 'organizations', 'nonexistent-id', {
          name: 'New Name',
        })

        expect(result).toBeNull()
      })

      it('throws for unique constraint violation on update', () => {
        // Create two orgs
        createRecord(db, 'organizations', {
          id: 'org-a',
          name: 'Org A',
          slug: 'org-a',
        })
        createRecord(db, 'organizations', {
          id: 'org-b',
          name: 'Org B',
          slug: 'org-b',
        })

        // Try to update org-b's slug to org-a's slug
        expect(() => updateRecord(db, 'organizations', 'org-b', {
          slug: 'org-a',
        })).toThrow(/UNIQUE constraint/i)
      })
    })

    describe('deleteRecord', () => {
      it('deletes a record and returns true', () => {
        createRecord(db, 'organizations', {
          id: 'delete-test-org',
          name: 'To Be Deleted',
          slug: 'delete-test-org',
        })

        const deleted = deleteRecord(db, 'organizations', 'delete-test-org')

        expect(deleted).toBe(true)

        // Verify it's gone
        const fetched = getRecord(db, 'organizations', 'delete-test-org')
        expect(fetched).toBeNull()
      })

      it('returns false for non-existent record', () => {
        const deleted = deleteRecord(db, 'organizations', 'nonexistent-id')

        expect(deleted).toBe(false)
      })

      it('cascades delete for FK references (if configured)', () => {
        // Create a target with category first
        createRecord(db, 'categories', {
          id: 'test-category',
          name: 'Test Category',
          slug: 'test-category',
        })

        createRecord(db, 'targets', {
          id: 'test-target',
          name: 'Test Target',
          slug: 'test-target',
          category: 'test-category',
        })

        // Delete category - targets should not cascade (no onDelete: cascade in schema)
        // This should fail if FK constraints are enforced
        expect(() => deleteRecord(db, 'categories', 'test-category')).toThrow(/FOREIGN KEY constraint/i)
      })
    })
  })
})
