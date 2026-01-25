/**
 * Tests for Drizzle Migration (saf-site-jur)
 *
 * TDD: These tests define the expected behavior for migrating
 * from Pocketbase NDJSON (diffable/) to a fresh Drizzle SQLite database.
 */

import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../docs/.vitepress/database/schema'
import { getInsertOrder } from '../docs/.vitepress/database/fk-utils'
import { ColumnMapping, load } from './db-diffable'

const DIFFABLE_DIR = '.pocketbase/pb_data/diffable'

/**
 * Column mappings for Pocketbase → Drizzle migration
 *
 * Junction tables in Pocketbase use short FK names (e.g., 'content', 'capability')
 * while Drizzle uses explicit _id suffixes (e.g., 'content_id', 'capability_id')
 *
 * Junction tables also have an 'id' column in PB that doesn't exist in Drizzle
 * (Drizzle uses composite primary keys instead)
 */
const COLUMN_MAPPINGS: Record<string, ColumnMapping> = {
  content_capabilities: {
    rename: { content: 'content_id', capability: 'capability_id' },
    skip: ['id'],
  },
  content_relationships: {
    rename: { content: 'content_id', related_content: 'related_content_id' },
    skip: ['id'],
  },
  content_tags: {
    rename: { content: 'content_id', tag: 'tag_id' },
    skip: ['id'],
  },
  course_capabilities: {
    rename: { course: 'course_id', capability: 'capability_id' },
    skip: ['id'],
  },
  course_tags: {
    rename: { course: 'course_id', tag: 'tag_id' },
    skip: ['id'],
  },
  course_tools: {
    rename: { course: 'course_id', tool: 'tool_id' },
    skip: ['id'],
  },
  distribution_capabilities: {
    rename: { distribution: 'distribution_id', capability: 'capability_id' },
    skip: ['id'],
  },
  distribution_tags: {
    rename: { distribution: 'distribution_id', tag: 'tag_id' },
    skip: ['id'],
  },
  media_capabilities: {
    rename: { media: 'media_id', capability: 'capability_id' },
    skip: ['id'],
  },
  media_tags: {
    rename: { media: 'media_id', tag: 'tag_id' },
    skip: ['id'],
  },
  tool_capabilities: {
    rename: { tool: 'tool_id', capability: 'capability_id' },
    skip: ['id'],
  },
  tool_tags: {
    rename: { tool: 'tool_id', tag: 'tag_id' },
    skip: ['id'],
  },
}

// Get expected record counts from source files
function getRecordCount(tableName: string): number {
  const ndjsonPath = join(DIFFABLE_DIR, `${tableName}.ndjson`)
  if (!existsSync(ndjsonPath)) return 0
  const content = readFileSync(ndjsonPath, 'utf-8').trim()
  if (!content) return 0
  return content.split('\n').length
}

describe('Drizzle Migration', () => {
  let testDir: string
  let testDbPath: string

  beforeEach(() => {
    testDir = join(tmpdir(), `drizzle-migration-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    testDbPath = join(testDir, 'drizzle.db')
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
  })

  describe('getInsertOrder', () => {
    it('returns valid table order for all 35 tables', () => {
      const tableOrder = getInsertOrder(schema)

      // Should have exactly 35 tables
      expect(tableOrder).toHaveLength(35)

      // All tables should be unique
      const uniqueTables = new Set(tableOrder)
      expect(uniqueTables.size).toBe(35)

      // Known lookup tables should come before dependent tables
      const capabilitiesIdx = tableOrder.indexOf('capabilities')
      const organizationsIdx = tableOrder.indexOf('organizations')
      const categoriesIdx = tableOrder.indexOf('categories')
      const tagsIdx = tableOrder.indexOf('tags')
      const targetsIdx = tableOrder.indexOf('targets')
      const contentIdx = tableOrder.indexOf('content')
      const contentTagsIdx = tableOrder.indexOf('content_tags')

      // Parents before children
      expect(capabilitiesIdx).toBeLessThan(contentIdx) // content.technology → organizations
      expect(organizationsIdx).toBeLessThan(targetsIdx) // targets.vendor → organizations
      expect(categoriesIdx).toBeLessThan(targetsIdx) // targets.category → categories
      expect(tagsIdx).toBeLessThan(contentTagsIdx) // content_tags.tag_id → tags
      expect(contentIdx).toBeLessThan(contentTagsIdx) // content_tags.content_id → content
    })

    it('handles all expected table names from diffable/', () => {
      const tableOrder = getInsertOrder(schema)

      // These are the 35 user tables from diffable/ (excluding _* internal tables)
      const expectedTables = [
        'capabilities', 'categories', 'content', 'content_capabilities',
        'content_relationships', 'content_releases', 'content_tags',
        'course_capabilities', 'course_resources', 'course_sessions',
        'course_tags', 'course_tools', 'courses', 'distribution_capabilities',
        'distribution_releases', 'distribution_tags', 'distribution_types',
        'distributions', 'media', 'media_capabilities', 'media_tags',
        'media_types', 'organizations', 'registries', 'resource_types',
        'standards', 'tags', 'targets', 'teams', 'technologies',
        'tool_capabilities', 'tool_releases', 'tool_tags', 'tool_types', 'tools',
      ]

      for (const table of expectedTables) {
        expect(tableOrder).toContain(table)
      }
    })
  })

  describe('Database creation with drizzle-kit', () => {
    it('creates database with proper FK constraints', async () => {
      const { execSync } = await import('node:child_process')
      const { mkdirSync } = await import('node:fs')

      mkdirSync(testDir, { recursive: true })

      // Use drizzle-kit to create the database
      execSync(`npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })

      expect(existsSync(testDbPath)).toBe(true)

      // Verify the database has tables
      const db = new Database(testDbPath)
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as { name: string }[]
      db.close()

      // Should have tables (not empty)
      expect(tables.length).toBeGreaterThan(0)

      // Should have our main tables
      const tableNames = tables.map(t => t.name)
      expect(tableNames).toContain('content')
      expect(tableNames).toContain('organizations')
      expect(tableNames).toContain('targets')
    })

    it('enforces FK constraints on invalid insert', async () => {
      const { execSync } = await import('node:child_process')
      const { mkdirSync } = await import('node:fs')

      mkdirSync(testDir, { recursive: true })

      // Create database with drizzle-kit
      execSync(`npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })

      const db = new Database(testDbPath)

      // Enable FK enforcement
      db.pragma('foreign_keys = ON')

      // Try to insert content with invalid FK (non-existent target)
      expect(() => {
        db.prepare(`INSERT INTO content (id, name, slug, content_type, target) VALUES (?, ?, ?, ?, ?)`)
          .run('test-id', 'Test Content', 'test-content', 'validation', 'non-existent-target')
      }).toThrow(/FOREIGN KEY constraint failed/)

      db.close()
    })
  })

  describe('Data migration with db-diffable', () => {
    it('loads data with --data-only and --skip-tables', async () => {
      const { execSync } = await import('node:child_process')
      const { mkdirSync } = await import('node:fs')

      mkdirSync(testDir, { recursive: true })

      // Create database with drizzle-kit
      execSync(`npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })

      const tableOrder = getInsertOrder(schema)

      // Load data using db-diffable with all migration options
      const result = load(testDbPath, DIFFABLE_DIR, {
        dataOnly: true,
        skipTables: ['_*'],
        tableOrder,
        emptyToNull: true,
        columnMappings: COLUMN_MAPPINGS,
        ignoreConflicts: true,
        quiet: true,
      })

      expect(result).toBe(0) // Success

      // Verify data was loaded
      const db = new Database(testDbPath)
      const contentCount = (db.prepare('SELECT COUNT(*) as count FROM content').get() as { count: number }).count
      db.close()

      // Should have content records
      expect(contentCount).toBeGreaterThan(0)
    })

    it('record counts match source diffable/', async () => {
      const { execSync } = await import('node:child_process')
      const { mkdirSync } = await import('node:fs')

      mkdirSync(testDir, { recursive: true })

      // Create database with drizzle-kit
      execSync(`npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })

      const tableOrder = getInsertOrder(schema)

      // Load data
      load(testDbPath, DIFFABLE_DIR, {
        dataOnly: true,
        skipTables: ['_*'],
        tableOrder,
        emptyToNull: true,
        columnMappings: COLUMN_MAPPINGS,
        ignoreConflicts: true,
        quiet: true,
      })

      const db = new Database(testDbPath)

      // Check key tables
      const tablesToCheck = ['content', 'organizations', 'targets', 'tags', 'capabilities']

      for (const tableName of tablesToCheck) {
        const expectedCount = getRecordCount(tableName)
        const actualCount = (db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number }).count
        expect(actualCount).toBe(expectedCount)
      }

      db.close()
    })

    it('FK references are valid after migration', async () => {
      const { execSync } = await import('node:child_process')
      const { mkdirSync } = await import('node:fs')

      mkdirSync(testDir, { recursive: true })

      // Create database with drizzle-kit
      execSync(`npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })

      const tableOrder = getInsertOrder(schema)

      // Load data
      load(testDbPath, DIFFABLE_DIR, {
        dataOnly: true,
        skipTables: ['_*'],
        tableOrder,
        emptyToNull: true,
        columnMappings: COLUMN_MAPPINGS,
        ignoreConflicts: true,
        quiet: true,
      })

      const db = new Database(testDbPath)

      // Enable FK enforcement and check integrity
      db.pragma('foreign_keys = ON')

      // Run FK check - returns rows with violations
      const fkViolations = db.prepare('PRAGMA foreign_key_check').all()
      expect(fkViolations).toHaveLength(0)

      // Verify specific FK relationships
      // content.target should reference valid targets
      const contentWithInvalidTarget = db.prepare(`
        SELECT c.id, c.name, c.target
        FROM content c
        WHERE c.target IS NOT NULL
          AND c.target NOT IN (SELECT id FROM targets)
      `).all()
      expect(contentWithInvalidTarget).toHaveLength(0)

      // content.vendor should reference valid organizations
      const contentWithInvalidVendor = db.prepare(`
        SELECT c.id, c.name, c.vendor
        FROM content c
        WHERE c.vendor IS NOT NULL
          AND c.vendor NOT IN (SELECT id FROM organizations)
      `).all()
      expect(contentWithInvalidVendor).toHaveLength(0)

      db.close()
    })

    it('database size is reasonable after migration', async () => {
      const { execSync } = await import('node:child_process')
      const { mkdirSync } = await import('node:fs')

      mkdirSync(testDir, { recursive: true })

      // Create database with drizzle-kit
      execSync(`npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })

      const tableOrder = getInsertOrder(schema)

      // Load data
      load(testDbPath, DIFFABLE_DIR, {
        dataOnly: true,
        skipTables: ['_*'],
        tableOrder,
        emptyToNull: true,
        columnMappings: COLUMN_MAPPINGS,
        ignoreConflicts: true,
        quiet: true,
      })

      const stats = statSync(testDbPath)

      // Database should be at least 100KB (we have real data)
      expect(stats.size).toBeGreaterThan(100 * 1024)

      // Database should be less than 10MB (sanity check)
      expect(stats.size).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Skips internal Pocketbase tables', () => {
    it('does not include _* tables in migration', async () => {
      const { execSync } = await import('node:child_process')
      const { mkdirSync } = await import('node:fs')

      mkdirSync(testDir, { recursive: true })

      // Create database with drizzle-kit
      execSync(`npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:${testDbPath}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })

      const tableOrder = getInsertOrder(schema)

      // Load data with skipTables
      load(testDbPath, DIFFABLE_DIR, {
        dataOnly: true,
        skipTables: ['_*'],
        tableOrder,
        emptyToNull: true,
        columnMappings: COLUMN_MAPPINGS,
        ignoreConflicts: true,
        quiet: true,
      })

      const db = new Database(testDbPath)

      // Check that no internal PB tables exist
      const pbTables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name LIKE '\\_%' ESCAPE '\\'
      `).all() as { name: string }[]

      db.close()

      // Should have no _* tables
      expect(pbTables).toHaveLength(0)
    })
  })
})
