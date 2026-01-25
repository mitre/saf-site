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

      // Verify exact NDJSON content (matches Python test)
      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')
      expect(lines.map(l => JSON.parse(l))).toEqual([
        [1, 'Stacey'],
        [2, 'Tilda'],
        [3, 'Bartek'],
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
      expect(JSON.parse(lines[0])).toEqual([1, 'line1\nline2'])
      expect(JSON.parse(lines[1])).toEqual([2, 'quote"test'])
      expect(JSON.parse(lines[2])).toEqual([3, 'backslash\\test'])
      expect(JSON.parse(lines[3])).toEqual([4, 'unicode: 日本語'])
      expect(JSON.parse(lines[4])).toEqual([5, 'tab\there'])
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
      expect(JSON.parse(lines[0])).toEqual([1, 'has value', 100])
      expect(JSON.parse(lines[1])).toEqual([2, null, null])
      expect(JSON.parse(lines[2])).toEqual([3, 'only name', null])
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
      expect(row1[0]).toBe(1)
      expect(row1[1]).toBe(42)
      expect(row1[2]).toBeCloseTo(3.14159)
      expect(row1[3]).toBe('hello')
      // BLOB is base64 encoded
      expect(typeof row1[4]).toBe('string')
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
    // OBJECT FORMAT TESTS (saf-site-0by)
    // ========================================================================

    it('outputs NDJSON with objects when format=object', () => {
      createOneTableDb(dbPath)

      const result = dump(dbPath, diffableDir, { quiet: true, format: 'object' })
      expect(result).toBe(0)

      // Verify each line is a JSON object with column names as keys
      const ndjsonPath = join(diffableDir, 'one_table.ndjson')
      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')
      const objects = lines.map(l => JSON.parse(l))

      expect(objects).toEqual([
        { id: 1, name: 'Stacey' },
        { id: 2, name: 'Tilda' },
        { id: 3, name: 'Bartek' },
      ])
    })

    it('each object line is self-contained with all column names', () => {
      createOneTableDb(dbPath)

      const result = dump(dbPath, diffableDir, { quiet: true, format: 'object' })
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

    it('maintains backward compatibility with format=array (default)', () => {
      createOneTableDb(dbPath)

      // Default should be array format
      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const ndjsonPath = join(diffableDir, 'one_table.ndjson')
      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')

      // Default format should still be arrays
      expect(lines.map(l => JSON.parse(l))).toEqual([
        [1, 'Stacey'],
        [2, 'Tilda'],
        [3, 'Bartek'],
      ])
    })

    it('explicit format=array outputs arrays', () => {
      createOneTableDb(dbPath)

      const result = dump(dbPath, diffableDir, { quiet: true, format: 'array' })
      expect(result).toBe(0)

      const ndjsonPath = join(diffableDir, 'one_table.ndjson')
      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')

      // Array format should output arrays
      expect(lines.map(l => JSON.parse(l))).toEqual([
        [1, 'Stacey'],
        [2, 'Tilda'],
        [3, 'Bartek'],
      ])
    })

    it('object format handles NULL values correctly', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE with_nulls (id INTEGER PRIMARY KEY, name TEXT, value TEXT);
        INSERT INTO with_nulls VALUES (1, 'test', NULL);
        INSERT INTO with_nulls VALUES (2, NULL, 'data');
      `)
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true, format: 'object' })
      expect(result).toBe(0)

      const ndjsonPath = join(diffableDir, 'with_nulls.ndjson')
      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')
      const objects = lines.map(l => JSON.parse(l))

      expect(objects[0]).toEqual({ id: 1, name: 'test', value: null })
      expect(objects[1]).toEqual({ id: 2, name: null, value: 'data' })
    })

    it('object format handles empty tables', () => {
      const db = new Database(dbPath)
      db.exec('CREATE TABLE empty_table (id INTEGER PRIMARY KEY, name TEXT)')
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true, format: 'object' })
      expect(result).toBe(0)

      const ndjsonPath = join(diffableDir, 'empty_table.ndjson')
      const content = readFileSync(ndjsonPath, 'utf-8')
      expect(content.trim()).toBe('')
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
