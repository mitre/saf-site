#!/usr/bin/env tsx
/**
 * SQLite Diffable - TypeScript replacement for sqlite-diffable (Python)
 *
 * Exports SQLite databases to git-friendly NDJSON format and restores them.
 * Each table becomes two files:
 *   - table.metadata.json: column names and CREATE TABLE schema
 *   - table.ndjson: one JSON array per row (values in column order)
 *
 * Usage:
 *   pnpm db:dump              # Export data.db to diffable/
 *   pnpm db:load              # Restore data.db from diffable/
 *   tsx scripts/db-diffable.ts dump <db> <dir>
 *   tsx scripts/db-diffable.ts load <db> <dir> [--replace]
 *
 * Based on sqlite-diffable (Python) by Simon Willison
 * https://github.com/simonw/sqlite-diffable
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'

export interface TableMetadata {
  name: string
  columns: string[]
  schema: string
}

// Tables to skip (SQLite internal tables that can't be restored)
const SKIP_TABLES = new Set([
  'sqlite_stat1',
  'sqlite_stat4',
  'sqlite_sequence',
])

/**
 * Convert a value to JSON-serializable format
 * Handles Buffer, Date, BigInt, and other non-JSON types
 * Must be called BEFORE JSON.stringify (not as replacer) for Buffers
 */
function toJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('base64')
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  return value
}

export type DumpFormat = 'array' | 'object'

export function dump(dbPath: string, outDir: string, options: { quiet?: boolean, exclude?: string[], tables?: string[], format?: DumpFormat } = {}): number {
  const log = options.quiet ? () => {} : console.log
  const excludeSet = new Set(options.exclude || [])
  const tablesSet = options.tables ? new Set(options.tables) : null

  if (!existsSync(dbPath)) {
    console.error(`Error: Database not found: ${dbPath}`)
    return 1
  }

  const db = new Database(dbPath, { readonly: true })

  // Create output directory
  mkdirSync(outDir, { recursive: true })

  // Get all tables (including internal Pocketbase tables that start with _)
  const allTables = db
    .prepare(`
      SELECT name, sql FROM sqlite_master
      WHERE type='table'
        AND sql IS NOT NULL
      ORDER BY
        CASE WHEN name LIKE '\\_%' ESCAPE '\\' THEN 0 ELSE 1 END,
        name
    `)
    .all() as { name: string, sql: string }[]

  log(`Exporting ${allTables.length} tables to ${outDir}/`)

  let exportedCount = 0
  for (const table of allTables) {
    if (SKIP_TABLES.has(table.name)) {
      log(`  Skipping ${table.name} (internal SQLite table)`)
      continue
    }

    if (excludeSet.has(table.name)) {
      log(`  Skipping ${table.name} (excluded)`)
      continue
    }

    if (tablesSet && !tablesSet.has(table.name)) {
      continue // Not in the requested tables list
    }

    // Get column info
    const columns = db.prepare(`PRAGMA table_info("${table.name}")`).all() as {
      cid: number
      name: string
      type: string
      notnull: number
      dflt_value: string | null
      pk: number
    }[]

    const columnNames = columns.map(c => c.name)

    // Write metadata
    const metadata: TableMetadata = {
      name: table.name,
      columns: columnNames,
      schema: table.sql,
    }
    writeFileSync(join(outDir, `${table.name}.metadata.json`), `${JSON.stringify(metadata, null, 4)}\n`)

    // Write data as NDJSON (convert non-JSON types before serializing)
    const rows = db.prepare(`SELECT * FROM "${table.name}"`).all() as Record<string, unknown>[]
    const format = options.format || 'array'

    const ndjsonLines = rows.map((row) => {
      if (format === 'object') {
        // Object format: {"col1": val1, "col2": val2, ...}
        const obj: Record<string, unknown> = {}
        for (const col of columnNames) {
          obj[col] = toJsonValue(row[col])
        }
        return JSON.stringify(obj)
      }
      else {
        // Array format (default): [val1, val2, ...]
        const values = columnNames.map(col => toJsonValue(row[col]))
        return JSON.stringify(values)
      }
    })
    writeFileSync(join(outDir, `${table.name}.ndjson`), ndjsonLines.join('\n') + (ndjsonLines.length ? '\n' : ''))

    log(`  ${table.name}: ${rows.length} rows`)
    exportedCount++
  }

  db.close()
  log(`Done. Exported ${exportedCount} tables.`)
  return 0
}

export function load(dbPath: string, srcDir: string, options: { replace?: boolean, quiet?: boolean } = {}): number {
  const log = options.quiet ? () => {} : console.log

  if (!existsSync(srcDir)) {
    console.error(`Error: Source directory not found: ${srcDir}`)
    return 1
  }

  // Remove existing database files if they exist
  for (const suffix of ['', '-shm', '-wal']) {
    const file = dbPath + suffix
    if (existsSync(file)) {
      rmSync(file)
    }
  }

  const db = new Database(dbPath)

  // Find all metadata files
  const metadataFiles = readdirSync(srcDir)
    .filter(f => f.endsWith('.metadata.json'))
    .sort()

  log(`Restoring ${metadataFiles.length} tables from ${srcDir}/`)

  let loadedCount = 0

  // First pass: create all tables
  for (const metaFile of metadataFiles) {
    const metadata: TableMetadata = JSON.parse(readFileSync(join(srcDir, metaFile), 'utf-8'))

    if (SKIP_TABLES.has(metadata.name)) {
      log(`  Skipping ${metadata.name} (internal SQLite table)`)
      continue
    }

    // Drop table if --replace and it exists
    if (options.replace) {
      try {
        db.exec(`DROP TABLE IF EXISTS "${metadata.name}"`)
      }
      catch {
        // Ignore errors
      }
    }

    // Create table using original schema
    try {
      db.exec(metadata.schema)
    }
    catch (err) {
      const msg = (err as Error).message
      if (msg.includes('already exists')) {
        console.error(`Error: Table ${metadata.name} already exists. Use --replace to overwrite.`)
        db.close()
        return 1
      }
      console.error(`Error creating ${metadata.name}: ${msg}`)
      db.close()
      return 1
    }
  }

  // Second pass: insert data
  for (const metaFile of metadataFiles) {
    const metadata: TableMetadata = JSON.parse(readFileSync(join(srcDir, metaFile), 'utf-8'))

    if (SKIP_TABLES.has(metadata.name)) {
      continue
    }

    const ndjsonFile = join(srcDir, `${metadata.name}.ndjson`)
    if (!existsSync(ndjsonFile)) {
      log(`  ${metadata.name}: no data file`)
      continue
    }

    const content = readFileSync(ndjsonFile, 'utf-8').trim()
    if (!content) {
      log(`  ${metadata.name}: 0 rows`)
      loadedCount++
      continue
    }

    const lines = content.split('\n')
    const placeholders = metadata.columns.map(() => '?').join(', ')
    const columnList = metadata.columns.map(c => `"${c}"`).join(', ')
    const insert = db.prepare(`INSERT INTO "${metadata.name}" (${columnList}) VALUES (${placeholders})`)

    const insertMany = db.transaction((rows: unknown[][]) => {
      for (const row of rows) {
        insert.run(...row)
      }
    })

    const rows = lines.map(line => JSON.parse(line) as unknown[])
    insertMany(rows)

    log(`  ${metadata.name}: ${rows.length} rows`)
    loadedCount++
  }

  db.close()

  // Verify database size (warning only, not an error)
  const stats = statSync(dbPath)
  log(`Done. Loaded ${loadedCount} tables. Database size: ${stats.size} bytes`)

  if (stats.size < 10000 && loadedCount > 0) {
    console.error('Warning: Database seems small. Verify data was loaded correctly.')
    // This is just a warning, not a failure - data may still be valid
  }

  return 0
}

/**
 * Convert NDJSON file to JSON objects (debugging utility)
 * Reads metadata to get column names, then outputs rows as objects
 */
export function objects(ndjsonPath: string, options: { asArray?: boolean } = {}): number {
  if (!ndjsonPath.endsWith('.ndjson')) {
    console.error('Error: Must be a .ndjson file')
    return 1
  }

  if (!existsSync(ndjsonPath)) {
    console.error(`Error: File not found: ${ndjsonPath}`)
    return 1
  }

  const metadataPath = ndjsonPath.replace('.ndjson', '.metadata.json')
  if (!existsSync(metadataPath)) {
    console.error(`Error: No accompanying .metadata.json file: ${metadataPath}`)
    return 1
  }

  const metadata: TableMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'))
  const content = readFileSync(ndjsonPath, 'utf-8').trim()

  if (!content) {
    if (options.asArray) {
      console.log('[]')
    }
    // For newline-delimited, output nothing (empty = no records)
    return 0
  }

  const lines = content.split('\n')
  const objects = lines.map((line) => {
    const values = JSON.parse(line) as unknown[]
    const obj: Record<string, unknown> = {}
    metadata.columns.forEach((col, i) => {
      obj[col] = values[i]
    })
    return obj
  })

  if (options.asArray) {
    console.log(JSON.stringify(objects, null, 2))
  }
  else {
    objects.forEach((obj) => {
      console.log(JSON.stringify(obj))
    })
  }

  return 0
}

// CLI - only run when executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('db-diffable.ts')) {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(`
SQLite Diffable - Export/import SQLite to git-friendly format

Usage:
  tsx scripts/db-diffable.ts dump <database.db> <output-dir> [options]
  tsx scripts/db-diffable.ts load <database.db> <source-dir> [--replace]
  tsx scripts/db-diffable.ts objects <file.ndjson> [--array]

Commands:
  dump      Export database to NDJSON format
  load      Restore database from NDJSON format
  objects   Convert NDJSON to JSON objects (debugging)

Options:
  --format     Output format: 'array' (default) or 'object' (dump command)
  --exclude    Skip specific tables (dump command)
  --replace    Drop existing tables before loading (load command)
  --array      Output as JSON array instead of newline-delimited (objects command)

Examples:
  tsx scripts/db-diffable.ts dump .pocketbase/pb_data/data.db .pocketbase/pb_data/diffable
  tsx scripts/db-diffable.ts dump data.db diffable/ --format object
  tsx scripts/db-diffable.ts dump data.db diffable/ --exclude temp_table log_table
  tsx scripts/db-diffable.ts load .pocketbase/pb_data/data.db .pocketbase/pb_data/diffable
  tsx scripts/db-diffable.ts load data.db diffable/ --replace
  tsx scripts/db-diffable.ts objects diffable/users.ndjson
  tsx scripts/db-diffable.ts objects diffable/users.ndjson --array
`)
    process.exit(1)
  }

  let exitCode: number

  if (command === 'dump') {
    const dbPath = args[1]
    const dirPath = args[2]
    const excludeArgs: string[] = []
    let format: DumpFormat | undefined
    let i = 3
    while (i < args.length) {
      if (args[i] === '--exclude' && args[i + 1]) {
        excludeArgs.push(args[i + 1])
        i += 2
      }
      else if (args[i] === '--format' && args[i + 1]) {
        const fmt = args[i + 1]
        if (fmt === 'array' || fmt === 'object') {
          format = fmt
        }
        else {
          console.error(`Error: Invalid format '${fmt}'. Use 'array' or 'object'.`)
          process.exit(1)
        }
        i += 2
      }
      else {
        i++
      }
    }
    if (!dbPath || !dirPath) {
      console.error('Error: dump requires <database.db> <output-dir>')
      process.exit(1)
    }
    exitCode = dump(dbPath, dirPath, { exclude: excludeArgs.length > 0 ? excludeArgs : undefined, format })
  }
  else if (command === 'load') {
    const dbPath = args[1]
    const dirPath = args[2]
    const hasReplace = args.slice(3).includes('--replace')
    if (!dbPath || !dirPath) {
      console.error('Error: load requires <database.db> <source-dir>')
      process.exit(1)
    }
    exitCode = load(dbPath, dirPath, { replace: hasReplace })
  }
  else if (command === 'objects') {
    const ndjsonPath = args[1]
    const hasArray = args.slice(2).includes('--array')
    if (!ndjsonPath) {
      console.error('Error: objects requires <file.ndjson>')
      process.exit(1)
    }
    exitCode = objects(ndjsonPath, { asArray: hasArray })
  }
  else {
    console.error(`Unknown command: ${command}. Use 'dump', 'load', or 'objects'.`)
    exitCode = 1
  }

  process.exit(exitCode)
}
