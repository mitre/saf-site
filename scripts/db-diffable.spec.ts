import type { TableMetadata } from './db-diffable'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dump, load } from './db-diffable'

/**
 * Test suite for db-diffable.ts
 *
 * Modeled after sqlite-diffable Python tests by Simon Willison
 * https://github.com/simonw/sqlite-diffable/tree/main/tests
 *
 * Extended with additional edge cases for TypeScript implementation.
 */

describe('db-diffable', () => {
  let testDir: string
  let dbPath: string
  let diffableDir: string

  // Helper to create a test database with one table (matches Python fixture)
  function createOneTableDb(path: string): void {
    const db = new Database(path)
    db.exec(`
      CREATE TABLE one_table (
        id INTEGER PRIMARY KEY,
        name TEXT
      );
      INSERT INTO one_table (id, name) VALUES (1, 'Stacey');
      INSERT INTO one_table (id, name) VALUES (2, 'Tilda');
      INSERT INTO one_table (id, name) VALUES (3, 'Bartek');
    `)
    db.close()
  }

  // Helper to create a test database with two tables (matches Python fixture)
  function createTwoTablesDb(path: string): void {
    createOneTableDb(path)
    const db = new Database(path)
    db.exec(`
      CREATE TABLE second_table (
        id INTEGER PRIMARY KEY,
        name TEXT
      );
      INSERT INTO second_table (id, name) VALUES (1, 'Cleo');
    `)
    db.close()
  }

  beforeEach(() => {
    // Create unique test directory
    testDir = join(tmpdir(), `db-diffable-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, { recursive: true })
    dbPath = join(testDir, 'test.db')
    diffableDir = join(testDir, 'diffable')
  })

  afterEach(() => {
    // Cleanup
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  // ==========================================================================
  // DUMP TESTS (matching Python test_dump.py)
  // ==========================================================================

  describe('dump', () => {
    it('exports single table with correct content (test_dump equivalent)', () => {
      createOneTableDb(dbPath)

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      // Verify files exist
      const ndjsonPath = join(diffableDir, 'one_table.ndjson')
      const metadataPath = join(diffableDir, 'one_table.metadata.json')
      expect(existsSync(ndjsonPath)).toBe(true)
      expect(existsSync(metadataPath)).toBe(true)

      // Verify exact NDJSON content (object format - self-documenting)
      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')
      expect(lines.map(l => JSON.parse(l))).toEqual([
        { id: 1, name: 'Stacey' },
        { id: 2, name: 'Tilda' },
        { id: 3, name: 'Bartek' },
      ])

      // Verify metadata content
      const metadata: TableMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'))
      expect(metadata.name).toBe('one_table')
      expect(metadata.columns).toEqual(['id', 'name'])
      expect(metadata.schema).toContain('CREATE TABLE')
      expect(metadata.schema).toContain('one_table')
      expect(metadata.schema).toContain('id')
      expect(metadata.schema).toContain('name')
    })

    it('exports all tables with --all equivalent (test_dump_all equivalent)', () => {
      createTwoTablesDb(dbPath)

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      // Both tables should be exported
      expect(existsSync(join(diffableDir, 'one_table.ndjson'))).toBe(true)
      expect(existsSync(join(diffableDir, 'one_table.metadata.json'))).toBe(true)
      expect(existsSync(join(diffableDir, 'second_table.ndjson'))).toBe(true)
      expect(existsSync(join(diffableDir, 'second_table.metadata.json'))).toBe(true)
    })

    it('skips sqlite internal tables (sqlite_stat*)', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT);
        INSERT INTO data VALUES (1, 'test');
      `)
      db.exec('ANALYZE') // Creates sqlite_stat1/sqlite_stat4
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      // sqlite_stat tables should NOT be exported
      expect(existsSync(join(diffableDir, 'sqlite_stat1.metadata.json'))).toBe(false)
      expect(existsSync(join(diffableDir, 'sqlite_stat1.ndjson'))).toBe(false)
      expect(existsSync(join(diffableDir, 'sqlite_stat4.metadata.json'))).toBe(false)
      expect(existsSync(join(diffableDir, 'sqlite_stat4.ndjson'))).toBe(false)

      // Data table SHOULD be exported
      expect(existsSync(join(diffableDir, 'data.metadata.json'))).toBe(true)
      expect(existsSync(join(diffableDir, 'data.ndjson'))).toBe(true)
    })

    it('handles empty tables', () => {
      const db = new Database(dbPath)
      db.exec('CREATE TABLE empty_table (id INTEGER PRIMARY KEY, name TEXT)')
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      expect(existsSync(join(diffableDir, 'empty_table.metadata.json'))).toBe(true)
      expect(existsSync(join(diffableDir, 'empty_table.ndjson'))).toBe(true)

      // NDJSON should be empty (or just whitespace)
      const content = readFileSync(join(diffableDir, 'empty_table.ndjson'), 'utf-8')
      expect(content.trim()).toBe('')
    })

    it('handles special characters in data', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE special (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO special VALUES (1, 'line1\nline2');
        INSERT INTO special VALUES (2, 'quote"test');
        INSERT INTO special VALUES (3, 'backslash\\test');
        INSERT INTO special VALUES (4, 'unicode: 日本語');
        INSERT INTO special VALUES (5, 'tab\there');
      `)
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const lines = readFileSync(join(diffableDir, 'special.ndjson'), 'utf-8').trim().split('\n')
      expect(JSON.parse(lines[0])).toEqual({ id: 1, data: 'line1\nline2' })
      expect(JSON.parse(lines[1])).toEqual({ id: 2, data: 'quote"test' })
      expect(JSON.parse(lines[2])).toEqual({ id: 3, data: 'backslash\\test' })
      expect(JSON.parse(lines[3])).toEqual({ id: 4, data: 'unicode: 日本語' })
      expect(JSON.parse(lines[4])).toEqual({ id: 5, data: 'tab\there' })
    })

    it('handles NULL values', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE nullable (id INTEGER PRIMARY KEY, name TEXT, value INTEGER);
        INSERT INTO nullable VALUES (1, 'has value', 100);
        INSERT INTO nullable VALUES (2, NULL, NULL);
        INSERT INTO nullable VALUES (3, 'only name', NULL);
      `)
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const lines = readFileSync(join(diffableDir, 'nullable.ndjson'), 'utf-8').trim().split('\n')
      expect(JSON.parse(lines[0])).toEqual({ id: 1, name: 'has value', value: 100 })
      expect(JSON.parse(lines[1])).toEqual({ id: 2, name: null, value: null })
      expect(JSON.parse(lines[2])).toEqual({ id: 3, name: 'only name', value: null })
    })

    it('handles various data types', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE types (
          id INTEGER PRIMARY KEY,
          int_val INTEGER,
          real_val REAL,
          text_val TEXT,
          blob_val BLOB
        );
        INSERT INTO types VALUES (1, 42, 3.14159, 'hello', X'48454C4C4F');
        INSERT INTO types VALUES (2, -100, 0.0, '', NULL);
        INSERT INTO types VALUES (3, 0, -1.5, 'a', X'00');
      `)
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const lines = readFileSync(join(diffableDir, 'types.ndjson'), 'utf-8').trim().split('\n')
      const row1 = JSON.parse(lines[0])
      expect(row1.id).toBe(1)
      expect(row1.int_val).toBe(42)
      expect(row1.real_val).toBeCloseTo(3.14159)
      expect(row1.text_val).toBe('hello')
      // BLOB is base64 encoded
      expect(typeof row1.blob_val).toBe('string')
    })

    it('returns error for non-existent database', () => {
      const result = dump('/nonexistent/path.db', diffableDir, { quiet: true })
      expect(result).toBe(1)
    })

    it('creates output directory if it does not exist', () => {
      createOneTableDb(dbPath)
      const nestedDir = join(testDir, 'nested', 'deeply', 'dir')

      const result = dump(dbPath, nestedDir, { quiet: true })
      expect(result).toBe(0)
      expect(existsSync(nestedDir)).toBe(true)
      expect(existsSync(join(nestedDir, 'one_table.ndjson'))).toBe(true)
    })

    // ========================================================================
    // OBJECT FORMAT TESTS (standardized format)
    // ========================================================================

    it('each object line is self-contained with all column names', () => {
      createOneTableDb(dbPath)

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const ndjsonPath = join(diffableDir, 'one_table.ndjson')
      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')

      // Each line should parse independently and have all columns
      for (const line of lines) {
        const obj = JSON.parse(line)
        expect(obj).toHaveProperty('id')
        expect(obj).toHaveProperty('name')
      }
    })
  })

  // ==========================================================================
  // LOAD TESTS (matching Python test_dump.py test_load)
  // ==========================================================================

  describe('load', () => {
    it('restores database from NDJSON files (test_load equivalent part 1)', () => {
      // Create diffable files manually (matches Python test structure)
      mkdirSync(diffableDir, { recursive: true })

      const metadata: TableMetadata = {
        name: 'one_table',
        columns: ['id', 'name'],
        schema: 'CREATE TABLE one_table (id INTEGER PRIMARY KEY, name TEXT)',
      }
      writeFileSync(join(diffableDir, 'one_table.metadata.json'), JSON.stringify(metadata, null, 4))
      writeFileSync(
        join(diffableDir, 'one_table.ndjson'),
        '[1,"Stacey"]\n[2,"Tilda"]\n[3,"Bartek"]\n',
      )

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      // Verify database content (matches Python test assertions)
      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM one_table ORDER BY id').all() as { id: number, name: string }[]
      expect(rows).toEqual([
        { id: 1, name: 'Stacey' },
        { id: 2, name: 'Tilda' },
        { id: 3, name: 'Bartek' },
      ])
      db.close()
    })

    it('restores multiple tables (test_load equivalent part 2)', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Table 1
      writeFileSync(
        join(diffableDir, 'one_table.metadata.json'),
        JSON.stringify({
          name: 'one_table',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE one_table (id INTEGER PRIMARY KEY, name TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'one_table.ndjson'), '[1,"Stacey"]\n[2,"Tilda"]\n[3,"Bartek"]\n')

      // Table 2
      writeFileSync(
        join(diffableDir, 'second_table.metadata.json'),
        JSON.stringify({
          name: 'second_table',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE second_table (id INTEGER PRIMARY KEY, name TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'second_table.ndjson'), '[1,"Cleo"]\n')

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })

      // Verify table names
      const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name').all() as { name: string }[]
      const tableNames = tables.map(t => t.name)
      expect(tableNames).toContain('one_table')
      expect(tableNames).toContain('second_table')

      // Verify content
      expect(db.prepare('SELECT * FROM one_table ORDER BY id').all()).toEqual([
        { id: 1, name: 'Stacey' },
        { id: 2, name: 'Tilda' },
        { id: 3, name: 'Bartek' },
      ])
      expect(db.prepare('SELECT * FROM second_table ORDER BY id').all()).toEqual([
        { id: 1, name: 'Cleo' },
      ])

      db.close()
    })

    it('supports --replace option (test_load equivalent part 3)', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Initial data
      writeFileSync(
        join(diffableDir, 'one_table.metadata.json'),
        JSON.stringify({
          name: 'one_table',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE one_table (id INTEGER PRIMARY KEY, name TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'one_table.ndjson'), '[1,"Stacey"]\n[2,"Tilda"]\n[3,"Bartek"]\n')

      // First load
      load(dbPath, diffableDir, { quiet: true })

      // Modify data (matches Python test - remove Bartek)
      writeFileSync(join(diffableDir, 'one_table.ndjson'), '[1,"Stacey"]\n[2,"Tilda"]\n')

      // Remove existing DB for fresh load with replace
      rmSync(dbPath)

      // Load again with replace
      const result = load(dbPath, diffableDir, { replace: true, quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM one_table ORDER BY id').all()
      expect(rows).toEqual([
        { id: 1, name: 'Stacey' },
        { id: 2, name: 'Tilda' },
      ])
      db.close()
    })

    it('returns error for non-existent source directory', () => {
      const result = load(dbPath, '/nonexistent/dir', { quiet: true })
      expect(result).toBe(1)
    })

    it('handles empty NDJSON files', () => {
      mkdirSync(diffableDir, { recursive: true })

      writeFileSync(
        join(diffableDir, 'empty.metadata.json'),
        JSON.stringify({
          name: 'empty',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE empty (id INTEGER PRIMARY KEY, name TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'empty.ndjson'), '')

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const count = db.prepare('SELECT COUNT(*) as c FROM empty').get() as { c: number }
      expect(count.c).toBe(0)
      db.close()
    })

    it('preserves NULL values through load', () => {
      mkdirSync(diffableDir, { recursive: true })

      writeFileSync(
        join(diffableDir, 'nullable.metadata.json'),
        JSON.stringify({
          name: 'nullable',
          columns: ['id', 'name', 'value'],
          schema: 'CREATE TABLE nullable (id INTEGER PRIMARY KEY, name TEXT, value INTEGER)',
        }),
      )
      writeFileSync(
        join(diffableDir, 'nullable.ndjson'),
        '[1,"has value",100]\n[2,null,null]\n[3,"only name",null]\n',
      )

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM nullable ORDER BY id').all() as { id: number, name: string | null, value: number | null }[]
      expect(rows[0]).toEqual({ id: 1, name: 'has value', value: 100 })
      expect(rows[1]).toEqual({ id: 2, name: null, value: null })
      expect(rows[2]).toEqual({ id: 3, name: 'only name', value: null })
      db.close()
    })

    it('skips sqlite internal tables in diffable dir', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Create a valid table
      writeFileSync(
        join(diffableDir, 'data.metadata.json'),
        JSON.stringify({
          name: 'data',
          columns: ['id'],
          schema: 'CREATE TABLE data (id INTEGER PRIMARY KEY)',
        }),
      )
      writeFileSync(join(diffableDir, 'data.ndjson'), '[1]\n')

      // Create sqlite_stat1 files (should be skipped)
      writeFileSync(
        join(diffableDir, 'sqlite_stat1.metadata.json'),
        JSON.stringify({
          name: 'sqlite_stat1',
          columns: ['tbl', 'idx', 'stat'],
          schema: 'CREATE TABLE sqlite_stat1 (tbl TEXT, idx TEXT, stat TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'sqlite_stat1.ndjson'), '["data",null,"1"]\n')

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all() as { name: string }[]
      const tableNames = tables.map(t => t.name)
      expect(tableNames).toContain('data')
      expect(tableNames).not.toContain('sqlite_stat1')
      db.close()
    })

    // ========================================================================
    // FORMAT AUTO-DETECTION TESTS (saf-site-km5)
    // ========================================================================

    it('auto-detects array format from first line', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Array format NDJSON (current format)
      writeFileSync(
        join(diffableDir, 'array_table.metadata.json'),
        JSON.stringify({
          name: 'array_table',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE array_table (id INTEGER PRIMARY KEY, name TEXT)',
        }),
      )
      writeFileSync(
        join(diffableDir, 'array_table.ndjson'),
        '[1,"Alice"]\n[2,"Bob"]\n',
      )

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM array_table ORDER BY id').all()
      expect(rows).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
      db.close()
    })

    it('auto-detects object format from first line', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Object format NDJSON (new format)
      writeFileSync(
        join(diffableDir, 'object_table.metadata.json'),
        JSON.stringify({
          name: 'object_table',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE object_table (id INTEGER PRIMARY KEY, name TEXT)',
        }),
      )
      writeFileSync(
        join(diffableDir, 'object_table.ndjson'),
        '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}\n',
      )

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM object_table ORDER BY id').all()
      expect(rows).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
      db.close()
    })

    it('handles object format with columns in different order than metadata', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Metadata has columns: id, name, value
      // But JSON objects have keys in different order
      writeFileSync(
        join(diffableDir, 'reordered.metadata.json'),
        JSON.stringify({
          name: 'reordered',
          columns: ['id', 'name', 'value'],
          schema: 'CREATE TABLE reordered (id INTEGER PRIMARY KEY, name TEXT, value INTEGER)',
        }),
      )
      // JSON objects with keys in different order
      writeFileSync(
        join(diffableDir, 'reordered.ndjson'),
        '{"value":100,"name":"first","id":1}\n{"name":"second","id":2,"value":200}\n',
      )

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM reordered ORDER BY id').all()
      expect(rows).toEqual([
        { id: 1, name: 'first', value: 100 },
        { id: 2, name: 'second', value: 200 },
      ])
      db.close()
    })

    it('handles object format with NULL values', () => {
      mkdirSync(diffableDir, { recursive: true })

      writeFileSync(
        join(diffableDir, 'obj_nulls.metadata.json'),
        JSON.stringify({
          name: 'obj_nulls',
          columns: ['id', 'name', 'value'],
          schema: 'CREATE TABLE obj_nulls (id INTEGER PRIMARY KEY, name TEXT, value INTEGER)',
        }),
      )
      writeFileSync(
        join(diffableDir, 'obj_nulls.ndjson'),
        '{"id":1,"name":"test","value":null}\n{"id":2,"name":null,"value":42}\n',
      )

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM obj_nulls ORDER BY id').all()
      expect(rows).toEqual([
        { id: 1, name: 'test', value: null },
        { id: 2, name: null, value: 42 },
      ])
      db.close()
    })

    it('handles mixed tables with different formats in same directory', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Table 1: array format
      writeFileSync(
        join(diffableDir, 'array_tbl.metadata.json'),
        JSON.stringify({
          name: 'array_tbl',
          columns: ['id', 'data'],
          schema: 'CREATE TABLE array_tbl (id INTEGER PRIMARY KEY, data TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'array_tbl.ndjson'), '[1,"from_array"]\n')

      // Table 2: object format
      writeFileSync(
        join(diffableDir, 'object_tbl.metadata.json'),
        JSON.stringify({
          name: 'object_tbl',
          columns: ['id', 'data'],
          schema: 'CREATE TABLE object_tbl (id INTEGER PRIMARY KEY, data TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'object_tbl.ndjson'), '{"id":1,"data":"from_object"}\n')

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      expect(db.prepare('SELECT * FROM array_tbl').all()).toEqual([{ id: 1, data: 'from_array' }])
      expect(db.prepare('SELECT * FROM object_tbl').all()).toEqual([{ id: 1, data: 'from_object' }])
      db.close()
    })

    it('roundtrip works with object format dump and load', () => {
      // Create database
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE roundtrip_obj (id INTEGER PRIMARY KEY, name TEXT, count INTEGER);
        INSERT INTO roundtrip_obj VALUES (1, 'first', 10);
        INSERT INTO roundtrip_obj VALUES (2, 'second', 20);
        INSERT INTO roundtrip_obj VALUES (3, 'third', 30);
      `)
      db.close()

      // Dump (object format is standard)
      const dumpResult = dump(dbPath, diffableDir, { quiet: true })
      expect(dumpResult).toBe(0)

      // Verify dump produced object format
      const ndjsonContent = readFileSync(join(diffableDir, 'roundtrip_obj.ndjson'), 'utf-8')
      const firstLine = JSON.parse(ndjsonContent.split('\n')[0])
      expect(firstLine).toHaveProperty('id')
      expect(firstLine).toHaveProperty('name')

      // Load into new database
      const newDbPath = join(testDir, 'roundtrip_restored.db')
      const loadResult = load(newDbPath, diffableDir, { quiet: true })
      expect(loadResult).toBe(0)

      // Verify data matches
      const restored = new Database(newDbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM roundtrip_obj ORDER BY id').all()
      expect(rows).toEqual([
        { id: 1, name: 'first', count: 10 },
        { id: 2, name: 'second', count: 20 },
        { id: 3, name: 'third', count: 30 },
      ])
      restored.close()
    })

    // ========================================================================
    // DATA-ONLY TESTS (saf-site-o2f)
    // ========================================================================

    it('--data-only inserts into existing tables without recreating schema', () => {
      // Pre-create database with schema (simulates Drizzle-created DB)
      const db = new Database(dbPath)
      db.exec('CREATE TABLE existing_table (id INTEGER PRIMARY KEY, name TEXT, extra TEXT DEFAULT "drizzle")')
      db.close()

      // Create diffable files (note: schema in metadata differs from actual DB)
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'existing_table.metadata.json'),
        JSON.stringify({
          name: 'existing_table',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE existing_table (id INTEGER PRIMARY KEY, name TEXT)', // No 'extra' column
        }),
      )
      writeFileSync(
        join(diffableDir, 'existing_table.ndjson'),
        '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}\n',
      )

      // Load with --data-only
      const result = load(dbPath, diffableDir, { dataOnly: true, quiet: true })
      expect(result).toBe(0)

      // Verify data was inserted AND schema preserved (extra column still exists)
      const restored = new Database(dbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM existing_table ORDER BY id').all() as { id: number, name: string, extra: string }[]
      expect(rows).toEqual([
        { id: 1, name: 'Alice', extra: 'drizzle' },
        { id: 2, name: 'Bob', extra: 'drizzle' },
      ])
      restored.close()
    })

    it('--data-only fails if table does not exist', () => {
      // Create empty database (no tables)
      const db = new Database(dbPath)
      db.close()

      // Create diffable files for a table that doesn't exist
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'missing_table.metadata.json'),
        JSON.stringify({
          name: 'missing_table',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE missing_table (id INTEGER PRIMARY KEY, name TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'missing_table.ndjson'), '{"id":1,"name":"Test"}\n')

      // Load with --data-only should fail
      const result = load(dbPath, diffableDir, { dataOnly: true, quiet: true })
      expect(result).toBe(1)
    })

    it('--data-only skips table creation phase entirely', () => {
      // Pre-create database with existing data
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE keep_data (id INTEGER PRIMARY KEY, name TEXT);
        INSERT INTO keep_data VALUES (1, 'existing');
      `)
      db.close()

      // Create diffable files for a DIFFERENT table
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'new_table.metadata.json'),
        JSON.stringify({
          name: 'new_table',
          columns: ['id', 'value'],
          schema: 'CREATE TABLE new_table (id INTEGER PRIMARY KEY, value TEXT)',
        }),
      )
      writeFileSync(join(diffableDir, 'new_table.ndjson'), '{"id":1,"value":"test"}\n')

      // Load with --data-only - should fail because new_table doesn't exist
      const result = load(dbPath, diffableDir, { dataOnly: true, quiet: true })
      expect(result).toBe(1)

      // Verify original data is untouched
      const restored = new Database(dbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM keep_data').all()
      expect(rows).toEqual([{ id: 1, name: 'existing' }])
      restored.close()
    })

    it('--data-only works with multiple existing tables', () => {
      // Pre-create database with multiple tables
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
        CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, user_id INTEGER);
      `)
      db.close()

      // Create diffable files
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'users.metadata.json'),
        JSON.stringify({ name: 'users', columns: ['id', 'name'], schema: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'users.ndjson'), '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}\n')

      writeFileSync(
        join(diffableDir, 'posts.metadata.json'),
        JSON.stringify({ name: 'posts', columns: ['id', 'title', 'user_id'], schema: 'CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, user_id INTEGER)' }),
      )
      writeFileSync(join(diffableDir, 'posts.ndjson'), '{"id":1,"title":"Hello","user_id":1}\n{"id":2,"title":"World","user_id":2}\n')

      const result = load(dbPath, diffableDir, { dataOnly: true, quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      expect(restored.prepare('SELECT COUNT(*) as c FROM users').get()).toEqual({ c: 2 })
      expect(restored.prepare('SELECT COUNT(*) as c FROM posts').get()).toEqual({ c: 2 })
      restored.close()
    })

    // ========================================================================
    // TABLE ORDER TESTS (saf-site-97p)
    // ========================================================================

    it('tableOrder processes tables in specified order', () => {
      // Create database with FK constraint
      const db = new Database(dbPath)
      db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE authors (id TEXT PRIMARY KEY, name TEXT);
        CREATE TABLE books (id TEXT PRIMARY KEY, title TEXT, author_id TEXT REFERENCES authors(id));
      `)
      db.close()

      // Create diffable files (alphabetically: authors, books)
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'authors.metadata.json'),
        JSON.stringify({ name: 'authors', columns: ['id', 'name'], schema: 'CREATE TABLE authors (id TEXT PRIMARY KEY, name TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'authors.ndjson'), '{"id":"a1","name":"Jane"}\n')

      writeFileSync(
        join(diffableDir, 'books.metadata.json'),
        JSON.stringify({ name: 'books', columns: ['id', 'title', 'author_id'], schema: 'CREATE TABLE books (id TEXT PRIMARY KEY, title TEXT, author_id TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'books.ndjson'), '{"id":"b1","title":"Novel","author_id":"a1"}\n')

      // Load with explicit order: authors first (parent), then books (child)
      const result = load(dbPath, diffableDir, { dataOnly: true, tableOrder: ['authors', 'books'], quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      expect(restored.prepare('SELECT * FROM authors').all()).toEqual([{ id: 'a1', name: 'Jane' }])
      expect(restored.prepare('SELECT * FROM books').all()).toEqual([{ id: 'b1', title: 'Novel', author_id: 'a1' }])
      restored.close()
    })

    it('tableOrder fails with FK violation if order is wrong', () => {
      // Create database with FK constraint ENFORCED
      const db = new Database(dbPath)
      db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE parents (id TEXT PRIMARY KEY, name TEXT);
        CREATE TABLE children (id TEXT PRIMARY KEY, name TEXT, parent_id TEXT REFERENCES parents(id));
      `)
      db.close()

      // Create diffable files
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'parents.metadata.json'),
        JSON.stringify({ name: 'parents', columns: ['id', 'name'], schema: 'CREATE TABLE parents (id TEXT PRIMARY KEY, name TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'parents.ndjson'), '{"id":"p1","name":"Parent"}\n')

      writeFileSync(
        join(diffableDir, 'children.metadata.json'),
        JSON.stringify({ name: 'children', columns: ['id', 'name', 'parent_id'], schema: 'CREATE TABLE children (id TEXT PRIMARY KEY, name TEXT, parent_id TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'children.ndjson'), '{"id":"c1","name":"Child","parent_id":"p1"}\n')

      // Load with WRONG order: children first (will fail FK check)
      const result = load(dbPath, diffableDir, { dataOnly: true, tableOrder: ['children', 'parents'], quiet: true })
      expect(result).toBe(1) // Should fail due to FK violation
    })

    it('tableOrder skips tables not in the order list', () => {
      // Create database with multiple tables
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE included (id INTEGER PRIMARY KEY, data TEXT);
        CREATE TABLE excluded (id INTEGER PRIMARY KEY, data TEXT);
      `)
      db.close()

      // Create diffable files for both
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'included.metadata.json'),
        JSON.stringify({ name: 'included', columns: ['id', 'data'], schema: 'CREATE TABLE included (id INTEGER PRIMARY KEY, data TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'included.ndjson'), '{"id":1,"data":"yes"}\n')

      writeFileSync(
        join(diffableDir, 'excluded.metadata.json'),
        JSON.stringify({ name: 'excluded', columns: ['id', 'data'], schema: 'CREATE TABLE excluded (id INTEGER PRIMARY KEY, data TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'excluded.ndjson'), '{"id":1,"data":"no"}\n')

      // Load only 'included' table
      const result = load(dbPath, diffableDir, { dataOnly: true, tableOrder: ['included'], quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      expect(restored.prepare('SELECT COUNT(*) as c FROM included').get()).toEqual({ c: 1 })
      expect(restored.prepare('SELECT COUNT(*) as c FROM excluded').get()).toEqual({ c: 0 }) // Not loaded
      restored.close()
    })

    it('tableOrder with empty array loads nothing', () => {
      // Create database
      const db = new Database(dbPath)
      db.exec('CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT)')
      db.close()

      // Create diffable files
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'data.metadata.json'),
        JSON.stringify({ name: 'data', columns: ['id', 'value'], schema: 'CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'data.ndjson'), '{"id":1,"value":"test"}\n')

      // Load with empty tableOrder
      const result = load(dbPath, diffableDir, { dataOnly: true, tableOrder: [], quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      expect(restored.prepare('SELECT COUNT(*) as c FROM data').get()).toEqual({ c: 0 }) // Nothing loaded
      restored.close()
    })

    // ========================================================================
    // SKIP-TABLES TESTS (saf-site-3cn)
    // ========================================================================

    it('skipTables excludes specific tables from loading', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Create diffable files for two tables
      writeFileSync(
        join(diffableDir, 'keep_table.metadata.json'),
        JSON.stringify({ name: 'keep_table', columns: ['id', 'data'], schema: 'CREATE TABLE keep_table (id INTEGER PRIMARY KEY, data TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'keep_table.ndjson'), '{"id":1,"data":"kept"}\n')

      writeFileSync(
        join(diffableDir, 'skip_table.metadata.json'),
        JSON.stringify({ name: 'skip_table', columns: ['id', 'data'], schema: 'CREATE TABLE skip_table (id INTEGER PRIMARY KEY, data TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'skip_table.ndjson'), '{"id":1,"data":"skipped"}\n')

      // Load with skipTables
      const result = load(dbPath, diffableDir, { skipTables: ['skip_table'], quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      // keep_table should exist and have data
      expect(restored.prepare('SELECT * FROM keep_table').all()).toEqual([{ id: 1, data: 'kept' }])
      // skip_table should NOT exist
      const tables = restored.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
      expect(tables.map(t => t.name)).not.toContain('skip_table')
      restored.close()
    })

    it('skipTables supports glob patterns for Pocketbase internal tables', () => {
      mkdirSync(diffableDir, { recursive: true })

      // User table (should be loaded)
      writeFileSync(
        join(diffableDir, 'users.metadata.json'),
        JSON.stringify({ name: 'users', columns: ['id', 'name'], schema: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'users.ndjson'), '{"id":1,"name":"Alice"}\n')

      // PB internal tables (should be skipped)
      writeFileSync(
        join(diffableDir, '_collections.metadata.json'),
        JSON.stringify({ name: '_collections', columns: ['id', 'name'], schema: 'CREATE TABLE _collections (id TEXT PRIMARY KEY, name TEXT)' }),
      )
      writeFileSync(join(diffableDir, '_collections.ndjson'), '{"id":"c1","name":"users"}\n')

      writeFileSync(
        join(diffableDir, '_authOrigins.metadata.json'),
        JSON.stringify({ name: '_authOrigins', columns: ['id', 'data'], schema: 'CREATE TABLE _authOrigins (id TEXT PRIMARY KEY, data TEXT)' }),
      )
      writeFileSync(join(diffableDir, '_authOrigins.ndjson'), '{"id":"a1","data":"origin"}\n')

      // Load with glob pattern to skip all underscore-prefixed tables
      const result = load(dbPath, diffableDir, { skipTables: ['_*'], quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      const tables = restored.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
      expect(tables.map(t => t.name)).toContain('users')
      expect(tables.map(t => t.name)).not.toContain('_collections')
      expect(tables.map(t => t.name)).not.toContain('_authOrigins')
      restored.close()
    })

    it('skipTables works with --data-only mode', () => {
      // Pre-create database with tables
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
        CREATE TABLE logs (id INTEGER PRIMARY KEY, message TEXT);
      `)
      db.close()

      mkdirSync(diffableDir, { recursive: true })

      writeFileSync(
        join(diffableDir, 'users.metadata.json'),
        JSON.stringify({ name: 'users', columns: ['id', 'name'], schema: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'users.ndjson'), '{"id":1,"name":"Bob"}\n')

      writeFileSync(
        join(diffableDir, 'logs.metadata.json'),
        JSON.stringify({ name: 'logs', columns: ['id', 'message'], schema: 'CREATE TABLE logs (id INTEGER PRIMARY KEY, message TEXT)' }),
      )
      writeFileSync(join(diffableDir, 'logs.ndjson'), '{"id":1,"message":"test log"}\n')

      // Load with dataOnly and skipTables
      const result = load(dbPath, diffableDir, { dataOnly: true, skipTables: ['logs'], quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      expect(restored.prepare('SELECT COUNT(*) as c FROM users').get()).toEqual({ c: 1 })
      expect(restored.prepare('SELECT COUNT(*) as c FROM logs').get()).toEqual({ c: 0 }) // Skipped
      restored.close()
    })

    it('skipTables with multiple patterns', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Regular table
      writeFileSync(
        join(diffableDir, 'data.metadata.json'),
        JSON.stringify({ name: 'data', columns: ['id'], schema: 'CREATE TABLE data (id INTEGER PRIMARY KEY)' }),
      )
      writeFileSync(join(diffableDir, 'data.ndjson'), '{"id":1}\n')

      // Tables to skip
      writeFileSync(
        join(diffableDir, '_internal.metadata.json'),
        JSON.stringify({ name: '_internal', columns: ['id'], schema: 'CREATE TABLE _internal (id INTEGER PRIMARY KEY)' }),
      )
      writeFileSync(join(diffableDir, '_internal.ndjson'), '{"id":1}\n')

      writeFileSync(
        join(diffableDir, 'temp_cache.metadata.json'),
        JSON.stringify({ name: 'temp_cache', columns: ['id'], schema: 'CREATE TABLE temp_cache (id INTEGER PRIMARY KEY)' }),
      )
      writeFileSync(join(diffableDir, 'temp_cache.ndjson'), '{"id":1}\n')

      // Skip both underscore-prefixed and temp_* tables
      const result = load(dbPath, diffableDir, { skipTables: ['_*', 'temp_*'], quiet: true })
      expect(result).toBe(0)

      const restored = new Database(dbPath, { readonly: true })
      const tables = restored.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
      expect(tables.map(t => t.name)).toContain('data')
      expect(tables.map(t => t.name)).not.toContain('_internal')
      expect(tables.map(t => t.name)).not.toContain('temp_cache')
      restored.close()
    })
  })

  // ==========================================================================
  // ROUNDTRIP TESTS (dump -> load -> verify)
  // ==========================================================================

  describe('roundtrip', () => {
    it('dump then load preserves all data exactly', () => {
      createTwoTablesDb(dbPath)

      // Dump
      const dumpResult = dump(dbPath, diffableDir, { quiet: true })
      expect(dumpResult).toBe(0)

      // Load into new database
      const newDbPath = join(testDir, 'restored.db')
      const loadResult = load(newDbPath, diffableDir, { quiet: true })
      expect(loadResult).toBe(0)

      // Compare data
      const original = new Database(dbPath, { readonly: true })
      const restored = new Database(newDbPath, { readonly: true })

      // Compare one_table
      const origRows1 = original.prepare('SELECT * FROM one_table ORDER BY id').all()
      const restRows1 = restored.prepare('SELECT * FROM one_table ORDER BY id').all()
      expect(restRows1).toEqual(origRows1)

      // Compare second_table
      const origRows2 = original.prepare('SELECT * FROM second_table ORDER BY id').all()
      const restRows2 = restored.prepare('SELECT * FROM second_table ORDER BY id').all()
      expect(restRows2).toEqual(origRows2)

      original.close()
      restored.close()
    })

    it('roundtrip preserves NULL values', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE nullable (id INTEGER PRIMARY KEY, name TEXT, value INTEGER);
        INSERT INTO nullable VALUES (1, 'has value', 100);
        INSERT INTO nullable VALUES (2, NULL, NULL);
        INSERT INTO nullable VALUES (3, 'only name', NULL);
      `)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM nullable ORDER BY id').all() as { id: number, name: string | null, value: number | null }[]

      expect(rows[0]).toEqual({ id: 1, name: 'has value', value: 100 })
      expect(rows[1]).toEqual({ id: 2, name: null, value: null })
      expect(rows[2]).toEqual({ id: 3, name: 'only name', value: null })

      restored.close()
    })

    it('roundtrip preserves special characters', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE special (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO special VALUES (1, 'line1\nline2');
        INSERT INTO special VALUES (2, 'quote"test');
        INSERT INTO special VALUES (3, 'unicode: 日本語');
      `)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM special ORDER BY id').all() as { id: number, data: string }[]

      expect(rows[0].data).toBe('line1\nline2')
      expect(rows[1].data).toBe('quote"test')
      expect(rows[2].data).toBe('unicode: 日本語')

      restored.close()
    })

    it('roundtrip preserves numeric precision', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE numbers (id INTEGER PRIMARY KEY, n INTEGER, f REAL);
        INSERT INTO numbers VALUES (1, 9007199254740991, 3.141592653589793);
        INSERT INTO numbers VALUES (2, -9007199254740991, -0.000000001);
        INSERT INTO numbers VALUES (3, 0, 0.0);
      `)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM numbers ORDER BY id').all() as { id: number, n: number, f: number }[]

      expect(rows[0].n).toBe(9007199254740991)
      expect(rows[0].f).toBeCloseTo(3.141592653589793, 10)
      expect(rows[1].n).toBe(-9007199254740991)
      expect(rows[2].n).toBe(0)
      expect(rows[2].f).toBe(0.0)

      restored.close()
    })

    it('roundtrip with many tables', () => {
      const db = new Database(dbPath)
      for (let i = 0; i < 10; i++) {
        db.exec(`
          CREATE TABLE table_${i} (id INTEGER PRIMARY KEY, value TEXT);
          INSERT INTO table_${i} VALUES (1, 'value_${i}');
        `)
      }
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      for (let i = 0; i < 10; i++) {
        const row = restored.prepare(`SELECT * FROM table_${i}`).get() as { id: number, value: string }
        expect(row.value).toBe(`value_${i}`)
      }
      restored.close()
    })
  })

  // ==========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ==========================================================================

  describe('edge cases', () => {
    it('handles table with no primary key', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE no_pk (name TEXT, value INTEGER);
        INSERT INTO no_pk VALUES ('a', 1);
        INSERT INTO no_pk VALUES ('b', 2);
      `)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM no_pk ORDER BY value').all()
      expect(rows).toEqual([
        { name: 'a', value: 1 },
        { name: 'b', value: 2 },
      ])
      restored.close()
    })

    it('handles table with composite primary key', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE composite_pk (a INTEGER, b INTEGER, value TEXT, PRIMARY KEY (a, b));
        INSERT INTO composite_pk VALUES (1, 1, 'one-one');
        INSERT INTO composite_pk VALUES (1, 2, 'one-two');
        INSERT INTO composite_pk VALUES (2, 1, 'two-one');
      `)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const rows = restored.prepare('SELECT * FROM composite_pk ORDER BY a, b').all()
      expect(rows).toEqual([
        { a: 1, b: 1, value: 'one-one' },
        { a: 1, b: 2, value: 'one-two' },
        { a: 2, b: 1, value: 'two-one' },
      ])
      restored.close()
    })

    it('handles very long text values', () => {
      const longText = 'x'.repeat(100000)
      const db = new Database(dbPath)
      db.exec(`CREATE TABLE long_text (id INTEGER PRIMARY KEY, data TEXT)`)
      db.prepare('INSERT INTO long_text VALUES (1, ?)').run(longText)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const row = restored.prepare('SELECT * FROM long_text').get() as { id: number, data: string }
      expect(row.data.length).toBe(100000)
      expect(row.data).toBe(longText)
      restored.close()
    })

    it('handles table names with special characters', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE "table-with-dashes" (id INTEGER PRIMARY KEY);
        INSERT INTO "table-with-dashes" VALUES (1);
      `)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const row = restored.prepare('SELECT * FROM "table-with-dashes"').get()
      expect(row).toEqual({ id: 1 })
      restored.close()
    })

    it('handles column names with special characters', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE special_cols ("col-with-dash" TEXT, "col with space" TEXT);
        INSERT INTO special_cols VALUES ('a', 'b');
      `)
      db.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const restored = new Database(newDbPath, { readonly: true })
      const row = restored.prepare('SELECT * FROM special_cols').get() as Record<string, string>
      expect(row['col-with-dash']).toBe('a')
      expect(row['col with space']).toBe('b')
      restored.close()
    })
  })

  // ==========================================================================
  // OBJECTS COMMAND TESTS (matching Python test_objects.py)
  // ==========================================================================

  describe('objects', () => {
    beforeEach(() => {
      // Create test NDJSON and metadata files
      mkdirSync(diffableDir, { recursive: true })

      const metadata: TableMetadata = {
        name: 'one_table',
        columns: ['id', 'name'],
        schema: 'CREATE TABLE one_table (id INTEGER PRIMARY KEY, name TEXT)',
      }
      writeFileSync(join(diffableDir, 'one_table.metadata.json'), JSON.stringify(metadata, null, 4))
      writeFileSync(
        join(diffableDir, 'one_table.ndjson'),
        '[1,"Stacey"]\n[2,"Tilda"]\n[3,"Bartek"]\n',
      )
    })

    it('converts NDJSON to newline-delimited JSON objects (test_objects equivalent)', async () => {
      const { objects } = await import('./db-diffable')

      // Capture stdout
      const originalLog = console.log
      const output: string[] = []
      console.log = (msg: string) => output.push(msg)

      const result = objects(join(diffableDir, 'one_table.ndjson'))

      console.log = originalLog

      expect(result).toBe(0)
      expect(output).toHaveLength(3)
      expect(JSON.parse(output[0])).toEqual({ id: 1, name: 'Stacey' })
      expect(JSON.parse(output[1])).toEqual({ id: 2, name: 'Tilda' })
      expect(JSON.parse(output[2])).toEqual({ id: 3, name: 'Bartek' })
    })

    it('converts NDJSON to JSON array with --array flag', async () => {
      const { objects } = await import('./db-diffable')

      const originalLog = console.log
      const output: string[] = []
      console.log = (msg: string) => output.push(msg)

      const result = objects(join(diffableDir, 'one_table.ndjson'), { asArray: true })

      console.log = originalLog

      expect(result).toBe(0)
      expect(output).toHaveLength(1)
      const parsed = JSON.parse(output[0])
      expect(parsed).toEqual([
        { id: 1, name: 'Stacey' },
        { id: 2, name: 'Tilda' },
        { id: 3, name: 'Bartek' },
      ])
    })

    it('returns error if file is not .ndjson', async () => {
      const { objects } = await import('./db-diffable')
      const result = objects(join(diffableDir, 'one_table.metadata.json'))
      expect(result).toBe(1)
    })

    it('returns error if metadata file is missing', async () => {
      const { objects } = await import('./db-diffable')

      // Create NDJSON without metadata
      writeFileSync(join(diffableDir, 'orphan.ndjson'), '[1,"test"]\n')

      const result = objects(join(diffableDir, 'orphan.ndjson'))
      expect(result).toBe(1)
    })

    it('handles empty NDJSON file', async () => {
      const { objects } = await import('./db-diffable')

      writeFileSync(join(diffableDir, 'empty.ndjson'), '')
      writeFileSync(
        join(diffableDir, 'empty.metadata.json'),
        JSON.stringify({ name: 'empty', columns: ['id'], schema: 'CREATE TABLE empty (id INTEGER)' }),
      )

      const originalLog = console.log
      const output: string[] = []
      console.log = (msg: string) => output.push(msg)

      const result = objects(join(diffableDir, 'empty.ndjson'), { asArray: false })

      console.log = originalLog

      expect(result).toBe(0)
      expect(output).toHaveLength(0) // Newline-delimited: empty = no output
    })
  })
})
