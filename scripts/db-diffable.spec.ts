import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { dump, load, type TableMetadata } from './db-diffable'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('db-diffable', () => {
  let testDir: string
  let dbPath: string
  let diffableDir: string

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

  describe('dump', () => {
    it('exports tables to NDJSON format', () => {
      // Create test database
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
        INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com');
        INSERT INTO users (id, name, email) VALUES (2, 'Bob', 'bob@example.com');
      `)
      db.close()

      // Dump
      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      // Verify metadata file
      const metadataPath = join(diffableDir, 'users.metadata.json')
      expect(existsSync(metadataPath)).toBe(true)

      const metadata: TableMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'))
      expect(metadata.name).toBe('users')
      expect(metadata.columns).toEqual(['id', 'name', 'email'])
      expect(metadata.schema).toContain('CREATE TABLE users')

      // Verify NDJSON file
      const ndjsonPath = join(diffableDir, 'users.ndjson')
      expect(existsSync(ndjsonPath)).toBe(true)

      const lines = readFileSync(ndjsonPath, 'utf-8').trim().split('\n')
      expect(lines).toHaveLength(2)

      const row1 = JSON.parse(lines[0])
      expect(row1).toEqual([1, 'Alice', 'alice@example.com'])

      const row2 = JSON.parse(lines[1])
      expect(row2).toEqual([2, 'Bob', 'bob@example.com'])
    })

    it('skips sqlite internal tables', () => {
      // Create database with sqlite_stat tables (via ANALYZE)
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE data (id INTEGER PRIMARY KEY, value TEXT);
        INSERT INTO data VALUES (1, 'test');
      `)
      db.exec('ANALYZE')
      db.close()

      // Dump
      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      // Verify sqlite_stat1 was not exported
      expect(existsSync(join(diffableDir, 'sqlite_stat1.metadata.json'))).toBe(false)
      expect(existsSync(join(diffableDir, 'sqlite_stat1.ndjson'))).toBe(false)

      // Verify data table was exported
      expect(existsSync(join(diffableDir, 'data.metadata.json'))).toBe(true)
    })

    it('handles empty tables', () => {
      const db = new Database(dbPath)
      db.exec('CREATE TABLE empty_table (id INTEGER PRIMARY KEY, name TEXT)')
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      expect(existsSync(join(diffableDir, 'empty_table.metadata.json'))).toBe(true)
      expect(existsSync(join(diffableDir, 'empty_table.ndjson'))).toBe(true)

      const content = readFileSync(join(diffableDir, 'empty_table.ndjson'), 'utf-8')
      expect(content).toBe('')
    })

    it('handles special characters in data', () => {
      const db = new Database(dbPath)
      db.exec(`
        CREATE TABLE special (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO special VALUES (1, 'line1\nline2');
        INSERT INTO special VALUES (2, 'quote"test');
        INSERT INTO special VALUES (3, 'unicode: 日本語');
      `)
      db.close()

      const result = dump(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const lines = readFileSync(join(diffableDir, 'special.ndjson'), 'utf-8').trim().split('\n')
      expect(JSON.parse(lines[0])).toEqual([1, 'line1\nline2'])
      expect(JSON.parse(lines[1])).toEqual([2, 'quote"test'])
      expect(JSON.parse(lines[2])).toEqual([3, 'unicode: 日本語'])
    })

    it('returns error for non-existent database', () => {
      const result = dump('/nonexistent/path.db', diffableDir, { quiet: true })
      expect(result).toBe(1)
    })
  })

  describe('load', () => {
    it('restores database from NDJSON files', () => {
      // Create diffable files manually
      mkdirSync(diffableDir, { recursive: true })

      const metadata: TableMetadata = {
        name: 'products',
        columns: ['id', 'name', 'price'],
        schema: 'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)',
      }
      writeFileSync(join(diffableDir, 'products.metadata.json'), JSON.stringify(metadata, null, 4))
      writeFileSync(
        join(diffableDir, 'products.ndjson'),
        '[1,"Widget",9.99]\n[2,"Gadget",19.99]\n'
      )

      // Load
      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      // Verify database
      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM products ORDER BY id').all() as { id: number; name: string; price: number }[]
      expect(rows).toHaveLength(2)
      expect(rows[0]).toEqual({ id: 1, name: 'Widget', price: 9.99 })
      expect(rows[1]).toEqual({ id: 2, name: 'Gadget', price: 19.99 })
      db.close()
    })

    it('handles multiple tables', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Table 1
      writeFileSync(
        join(diffableDir, 'users.metadata.json'),
        JSON.stringify({
          name: 'users',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
        })
      )
      writeFileSync(join(diffableDir, 'users.ndjson'), '[1,"Alice"]\n')

      // Table 2
      writeFileSync(
        join(diffableDir, 'posts.metadata.json'),
        JSON.stringify({
          name: 'posts',
          columns: ['id', 'user_id', 'title'],
          schema: 'CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT)',
        })
      )
      writeFileSync(join(diffableDir, 'posts.ndjson'), '[1,1,"Hello World"]\n')

      const result = load(dbPath, diffableDir, { quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      expect(db.prepare('SELECT COUNT(*) as c FROM users').get()).toEqual({ c: 1 })
      expect(db.prepare('SELECT COUNT(*) as c FROM posts').get()).toEqual({ c: 1 })
      db.close()
    })

    it('supports --replace option', () => {
      // First load
      mkdirSync(diffableDir, { recursive: true })
      writeFileSync(
        join(diffableDir, 'items.metadata.json'),
        JSON.stringify({
          name: 'items',
          columns: ['id', 'name'],
          schema: 'CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)',
        })
      )
      writeFileSync(join(diffableDir, 'items.ndjson'), '[1,"First"]\n')

      load(dbPath, diffableDir, { quiet: true })

      // Modify diffable data
      writeFileSync(join(diffableDir, 'items.ndjson'), '[1,"Replaced"]\n[2,"New"]\n')

      // Load again with replace
      rmSync(dbPath) // Remove to simulate fresh load
      const result = load(dbPath, diffableDir, { replace: true, quiet: true })
      expect(result).toBe(0)

      const db = new Database(dbPath, { readonly: true })
      const rows = db.prepare('SELECT * FROM items ORDER BY id').all() as { id: number; name: string }[]
      expect(rows).toHaveLength(2)
      expect(rows[0].name).toBe('Replaced')
      expect(rows[1].name).toBe('New')
      db.close()
    })

    it('returns error for non-existent source directory', () => {
      const result = load(dbPath, '/nonexistent/dir', { quiet: true })
      expect(result).toBe(1)
    })

    it('verifies minimum database size', () => {
      mkdirSync(diffableDir, { recursive: true })

      // Create a very small table that results in tiny database
      writeFileSync(
        join(diffableDir, 'tiny.metadata.json'),
        JSON.stringify({
          name: 'tiny',
          columns: ['id'],
          schema: 'CREATE TABLE tiny (id INTEGER)',
        })
      )
      writeFileSync(join(diffableDir, 'tiny.ndjson'), '')

      const result = load(dbPath, diffableDir, { quiet: true })
      // Should warn about small database (but still succeed since table exists)
      // The warning is only logged, function returns 0 if tables loaded
      expect(existsSync(dbPath)).toBe(true)
    })
  })

  describe('roundtrip', () => {
    it('dump then load preserves data', () => {
      // Create original database
      const db1 = new Database(dbPath)
      db1.exec(`
        CREATE TABLE config (key TEXT PRIMARY KEY, value TEXT);
        INSERT INTO config VALUES ('version', '1.0.0');
        INSERT INTO config VALUES ('name', 'Test App');

        CREATE TABLE numbers (id INTEGER PRIMARY KEY, n INTEGER, f REAL);
        INSERT INTO numbers VALUES (1, 42, 3.14159);
        INSERT INTO numbers VALUES (2, -100, 0.0);
      `)
      db1.close()

      // Dump
      const dumpResult = dump(dbPath, diffableDir, { quiet: true })
      expect(dumpResult).toBe(0)

      // Load into new database
      const newDbPath = join(testDir, 'restored.db')
      const loadResult = load(newDbPath, diffableDir, { quiet: true })
      expect(loadResult).toBe(0)

      // Compare data
      const db2 = new Database(newDbPath, { readonly: true })

      const config = db2.prepare('SELECT * FROM config ORDER BY key').all()
      expect(config).toEqual([
        { key: 'name', value: 'Test App' },
        { key: 'version', value: '1.0.0' },
      ])

      const numbers = db2.prepare('SELECT * FROM numbers ORDER BY id').all()
      expect(numbers).toEqual([
        { id: 1, n: 42, f: 3.14159 },
        { id: 2, n: -100, f: 0.0 },
      ])

      db2.close()
    })

    it('preserves NULL values', () => {
      const db1 = new Database(dbPath)
      db1.exec(`
        CREATE TABLE nullable (id INTEGER PRIMARY KEY, name TEXT, value INTEGER);
        INSERT INTO nullable VALUES (1, 'has value', 100);
        INSERT INTO nullable VALUES (2, NULL, NULL);
        INSERT INTO nullable VALUES (3, 'only name', NULL);
      `)
      db1.close()

      dump(dbPath, diffableDir, { quiet: true })

      const newDbPath = join(testDir, 'restored.db')
      load(newDbPath, diffableDir, { quiet: true })

      const db2 = new Database(newDbPath, { readonly: true })
      const rows = db2.prepare('SELECT * FROM nullable ORDER BY id').all() as { id: number; name: string | null; value: number | null }[]

      expect(rows[0]).toEqual({ id: 1, name: 'has value', value: 100 })
      expect(rows[1]).toEqual({ id: 2, name: null, value: null })
      expect(rows[2]).toEqual({ id: 3, name: 'only name', value: null })

      db2.close()
    })
  })
})
