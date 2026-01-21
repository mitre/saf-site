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

import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'fs'
import { join } from 'path'

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
 * Custom JSON serializer that handles non-JSON types
 * Mimics Python's `default=repr` behavior
 */
function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Buffer) {
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

export function dump(dbPath: string, outDir: string, options: { quiet?: boolean } = {}): number {
  const log = options.quiet ? () => {} : console.log

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
    .all() as { name: string; sql: string }[]

  log(`Exporting ${allTables.length} tables to ${outDir}/`)

  let exportedCount = 0
  for (const table of allTables) {
    if (SKIP_TABLES.has(table.name)) {
      log(`  Skipping ${table.name} (internal SQLite table)`)
      continue
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

    const columnNames = columns.map((c) => c.name)

    // Write metadata
    const metadata: TableMetadata = {
      name: table.name,
      columns: columnNames,
      schema: table.sql,
    }
    writeFileSync(join(outDir, `${table.name}.metadata.json`), JSON.stringify(metadata, null, 4) + '\n')

    // Write data as NDJSON (using custom replacer for non-JSON types)
    const rows = db.prepare(`SELECT * FROM "${table.name}"`).all() as Record<string, unknown>[]
    const ndjsonLines = rows.map((row) => {
      const values = columnNames.map((col) => row[col])
      return JSON.stringify(values, jsonReplacer)
    })
    writeFileSync(join(outDir, `${table.name}.ndjson`), ndjsonLines.join('\n') + (ndjsonLines.length ? '\n' : ''))

    log(`  ${table.name}: ${rows.length} rows`)
    exportedCount++
  }

  db.close()
  log(`Done. Exported ${exportedCount} tables.`)
  return 0
}

export function load(dbPath: string, srcDir: string, options: { replace?: boolean; quiet?: boolean } = {}): number {
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
    .filter((f) => f.endsWith('.metadata.json'))
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
      } catch {
        // Ignore errors
      }
    }

    // Create table using original schema
    try {
      db.exec(metadata.schema)
    } catch (err) {
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
    const columnList = metadata.columns.map((c) => `"${c}"`).join(', ')
    const insert = db.prepare(`INSERT INTO "${metadata.name}" (${columnList}) VALUES (${placeholders})`)

    const insertMany = db.transaction((rows: unknown[][]) => {
      for (const row of rows) {
        insert.run(...row)
      }
    })

    const rows = lines.map((line) => JSON.parse(line) as unknown[])
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

// CLI - only run when executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('db-diffable.ts')) {
  const args = process.argv.slice(2)
  const command = args[0]
  const dbPath = args[1]
  const dirPath = args[2]
  const flags = args.slice(3)

  const hasReplace = flags.includes('--replace')

  if (!command || !dbPath || !dirPath) {
    console.log(`
SQLite Diffable - Export/import SQLite to git-friendly format

Usage:
  tsx scripts/db-diffable.ts dump <database.db> <output-dir>
  tsx scripts/db-diffable.ts load <database.db> <source-dir> [--replace]

Options:
  --replace    Drop existing tables before loading (for load command)

Examples:
  tsx scripts/db-diffable.ts dump .pocketbase/pb_data/data.db .pocketbase/pb_data/diffable
  tsx scripts/db-diffable.ts load .pocketbase/pb_data/data.db .pocketbase/pb_data/diffable
  tsx scripts/db-diffable.ts load .pocketbase/pb_data/data.db .pocketbase/pb_data/diffable --replace
`)
    process.exit(1)
  }

  let exitCode: number
  if (command === 'dump') {
    exitCode = dump(dbPath, dirPath)
  } else if (command === 'load') {
    exitCode = load(dbPath, dirPath, { replace: hasReplace })
  } else {
    console.error(`Unknown command: ${command}. Use 'dump' or 'load'.`)
    exitCode = 1
  }

  process.exit(exitCode)
}
