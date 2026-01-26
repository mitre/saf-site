/**
 * Drizzle Data Layer (saf-site-gf9)
 *
 * Generic CRUD operations using Drizzle ORM.
 * Replaces Pocketbase for CLI database access.
 *
 * Uses Drizzle ORM properly - types from schema.zod.ts flow through directly.
 * No manual case conversion needed - Drizzle handles column name mapping.
 */

import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '@schema/schema.js'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Drizzle ORM database instance
 */
export type DrizzleDatabase = ReturnType<typeof drizzle>

/**
 * Generic record type (row from any table)
 */
export type GenericRecord = Record<string, unknown>

/**
 * Options for listing records
 */
export interface ListOptions {
  /** Filter conditions as key-value pairs (uses camelCase field names) */
  where?: Record<string, unknown>
  /** Column to sort by (camelCase field name) */
  orderBy?: string
  /** Sort order */
  order?: 'asc' | 'desc'
  /** Maximum records to return */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

/**
 * Get a Drizzle ORM database connection
 *
 * @param dbPath - Path to SQLite database file
 * @returns Drizzle database instance
 * @throws If database file doesn't exist
 */
export function getDrizzle(dbPath: string): DrizzleDatabase {
  if (!existsSync(dbPath)) {
    throw new Error(`Database not found: ${dbPath}`)
  }

  const sqlite = new Database(dbPath)

  // Enable foreign key constraints
  sqlite.pragma('foreign_keys = ON')

  return drizzle(sqlite, { schema })
}

// ============================================================================
// SCHEMA INTROSPECTION
// ============================================================================

/**
 * Map of table names to their Drizzle schema definitions
 */
const tableMap = new Map<string, SQLiteTable>()

// Symbol used by Drizzle to store table name
const DRIZZLE_BASE_NAME = Symbol.for('drizzle:BaseName')

// Build table map from schema exports
for (const [_key, value] of Object.entries(schema)) {
  if (
    value
    && typeof value === 'object'
    && DRIZZLE_BASE_NAME in value
  ) {
    const tableName = (value as any)[DRIZZLE_BASE_NAME] as string
    tableMap.set(tableName, value as SQLiteTable)
  }
}

/**
 * Get a table schema by name
 */
function getTable(tableName: string): SQLiteTable {
  const table = tableMap.get(tableName)
  if (!table) {
    const validTables = getTableNames().join(', ')
    throw new Error(`Unknown table: "${tableName}". Valid tables: ${validTables}`)
  }
  return table
}

/**
 * Get all table names from the schema
 */
export function getTableNames(): string[] {
  return Array.from(tableMap.keys()).sort()
}

/**
 * Check if a table exists in the schema
 */
export function isValidTable(tableName: string): boolean {
  return tableMap.has(tableName)
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a Pocketbase-style ID (15 alphanumeric characters)
 */
export function generateId(): string {
  const bytes = randomBytes(12)
  let id = ''
  for (const byte of bytes) {
    id += byte.toString(36)
  }
  return id.slice(0, 15).toLowerCase()
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * List records from a table with optional filtering and sorting
 *
 * @param db - Drizzle database instance
 * @param tableName - Name of the table
 * @param options - List options (where, orderBy, limit, etc.)
 * @returns Array of records with camelCase keys
 */
export function listRecords(
  db: DrizzleDatabase,
  tableName: string,
  options: ListOptions = {},
): GenericRecord[] {
  const table = getTable(tableName)
  const { where, orderBy, order = 'asc', limit, offset } = options

  // Use Drizzle ORM select - returns camelCase keys
  let query = db.select().from(table).$dynamic()

  // Add WHERE conditions
  if (where && Object.keys(where).length > 0) {
    for (const [key, value] of Object.entries(where)) {
      const column = (table as any)[key]
      if (column) {
        query = query.where(eq(column, value))
      }
    }
  }

  // Add ORDER BY with COLLATE NOCASE
  if (orderBy) {
    const column = (table as any)[orderBy]
    if (column) {
      // Use sql template for COLLATE NOCASE
      const orderExpr = order === 'desc'
        ? sql`${column} COLLATE NOCASE DESC`
        : sql`${column} COLLATE NOCASE ASC`
      query = query.orderBy(orderExpr)
    }
  }

  // Add LIMIT
  if (limit !== undefined) {
    query = query.limit(limit)
  }

  // Add OFFSET
  if (offset !== undefined) {
    query = query.offset(offset)
  }

  return query.all() as GenericRecord[]
}

/**
 * Get a single record by ID
 *
 * @param db - Drizzle database instance
 * @param tableName - Name of the table
 * @param id - Record ID
 * @returns Record with camelCase keys, or null if not found
 */
export function getRecord(
  db: DrizzleDatabase,
  tableName: string,
  id: string,
): GenericRecord | null {
  const table = getTable(tableName)
  const idColumn = (table as any).id

  const result = db.select().from(table).where(eq(idColumn, id)).get()

  return (result as GenericRecord) ?? null
}

/**
 * Create a new record
 *
 * @param db - Drizzle database instance
 * @param tableName - Name of the table
 * @param data - Record data (camelCase keys, id is optional)
 * @returns Created record
 */
export function createRecord(
  db: DrizzleDatabase,
  tableName: string,
  data: GenericRecord,
): GenericRecord {
  const table = getTable(tableName)

  // Generate ID if not provided
  const recordData = { ...data }
  if (!recordData.id) {
    recordData.id = generateId()
  }

  // Use Drizzle ORM insert - it handles camelCase to snake_case mapping
  db.insert(table).values(recordData as any).run()

  // Return the created record
  return getRecord(db, tableName, recordData.id as string)!
}

/**
 * Update an existing record
 *
 * @param db - Drizzle database instance
 * @param tableName - Name of the table
 * @param id - Record ID
 * @param data - Fields to update (camelCase keys)
 * @returns Updated record or null if not found
 */
export function updateRecord(
  db: DrizzleDatabase,
  tableName: string,
  id: string,
  data: GenericRecord,
): GenericRecord | null {
  const table = getTable(tableName)

  // Check if record exists
  const existing = getRecord(db, tableName, id)
  if (!existing) {
    return null
  }

  if (Object.keys(data).length === 0) {
    return existing // Nothing to update
  }

  // Use Drizzle ORM update - it handles camelCase to snake_case mapping
  // Need to find the id column dynamically
  const idColumn = (table as any).id
  db.update(table).set(data as any).where(eq(idColumn, id)).run()

  // Return the updated record
  return getRecord(db, tableName, id)!
}

/**
 * Delete a record by ID
 *
 * @param db - Drizzle database instance
 * @param tableName - Name of the table
 * @param id - Record ID
 * @returns true if deleted, false if not found
 */
export function deleteRecord(
  db: DrizzleDatabase,
  tableName: string,
  id: string,
): boolean {
  const table = getTable(tableName)

  // Check if exists first
  const existing = getRecord(db, tableName, id)
  if (!existing) {
    return false
  }

  // Use Drizzle ORM delete
  const idColumn = (table as any).id
  db.delete(table).where(eq(idColumn, id)).run()

  return true
}

// ============================================================================
// FK RESOLUTION (for interactive mode)
// ============================================================================

/**
 * FK lookup maps for name → ID resolution
 */
export interface FkMaps {
  organizations: Map<string, string>
  teams: Map<string, string>
  standards: Map<string, string>
  technologies: Map<string, string>
  targets: Map<string, string>
  categories: Map<string, string>
  capabilities: Map<string, string>
  tags: Map<string, string>
}

/**
 * Load FK lookup maps from database
 *
 * @param db - Drizzle database instance
 * @returns Maps of lowercase name → ID for each FK table
 */
export function loadFkMaps(db: DrizzleDatabase): FkMaps {
  const tables = [
    'organizations',
    'teams',
    'standards',
    'technologies',
    'targets',
    'categories',
    'capabilities',
    'tags',
  ] as const

  const result: Partial<FkMaps> = {}

  for (const tableName of tables) {
    const records = listRecords(db, tableName) as Array<{ id: string, name?: string }>
    const map = new Map<string, string>()

    for (const record of records) {
      if (record.name) {
        map.set(record.name.toLowerCase(), record.id)
      }
    }

    result[tableName] = map
  }

  return result as FkMaps
}

/**
 * Resolve a name to an ID using FK maps
 *
 * @param maps - FK lookup maps
 * @param collection - Which collection to look in
 * @param name - Name to resolve
 * @returns ID or null if not found
 */
export function resolveFK(
  maps: FkMaps,
  collection: keyof FkMaps,
  name: string,
): string | null {
  const map = maps[collection]
  return map.get(name.toLowerCase()) ?? null
}

// ============================================================================
// DATABASE PATH
// ============================================================================

/**
 * Get the default database path
 *
 * Uses DRIZZLE_DB_PATH env var or defaults to the standard location.
 */
export function getDefaultDbPath(): string {
  if (process.env.DRIZZLE_DB_PATH) {
    return process.env.DRIZZLE_DB_PATH
  }
  // Default: relative to CLI directory
  return join(process.cwd(), '../docs/.vitepress/database/drizzle.db')
}

// ============================================================================
// FK EXPANSION (for mimicking Pocketbase expand behavior)
// ============================================================================

/**
 * FK name maps for ID → name resolution
 */
export interface FkNameMaps {
  organizations: Map<string, string>
  teams: Map<string, string>
  standards: Map<string, { name: string, shortName?: string }>
  technologies: Map<string, string>
  targets: Map<string, string>
  categories: Map<string, string>
  capabilities: Map<string, string>
  tags: Map<string, string>
}

/**
 * Load FK name maps from database (id → name)
 *
 * @param db - Drizzle database instance
 * @returns Maps of ID → name/object for each FK table
 */
export function loadFkNameMaps(db: DrizzleDatabase): FkNameMaps {
  const result: Partial<FkNameMaps> = {}

  // Simple tables (id → name)
  const simpleTables = ['organizations', 'teams', 'technologies', 'targets', 'categories', 'capabilities', 'tags'] as const
  for (const tableName of simpleTables) {
    const records = listRecords(db, tableName) as Array<{ id: string, name?: string }>
    const map = new Map<string, string>()
    for (const record of records) {
      if (record.name) {
        map.set(record.id, record.name)
      }
    }
    result[tableName] = map
  }

  // Standards table (id → { name, shortName })
  const standards = listRecords(db, 'standards') as Array<{ id: string, name?: string, shortName?: string }>
  const standardsMap = new Map<string, { name: string, shortName?: string }>()
  for (const record of standards) {
    if (record.name) {
      standardsMap.set(record.id, { name: record.name, shortName: record.shortName })
    }
  }
  result.standards = standardsMap

  return result as FkNameMaps
}

/**
 * Expand FK IDs in a record to their names
 *
 * Mimics Pocketbase's expand behavior by adding an `expand` property
 * with resolved FK objects.
 *
 * @param record - Record with FK ID fields
 * @param nameMaps - FK name maps from loadFkNameMaps
 * @returns Record with expand property added
 */
export function expandRecord(
  record: GenericRecord,
  nameMaps: FkNameMaps,
): GenericRecord {
  const expand: Record<string, { name: string, shortName?: string }> = {}

  // Map FK field names to their lookup tables
  const fkFields: Array<{ field: string, table: keyof FkNameMaps }> = [
    { field: 'target', table: 'targets' },
    { field: 'standard', table: 'standards' },
    { field: 'technology', table: 'technologies' },
    { field: 'vendor', table: 'organizations' },
    { field: 'maintainer', table: 'teams' },
    { field: 'category', table: 'categories' },
  ]

  for (const { field, table } of fkFields) {
    const id = record[field] as string | undefined
    if (id) {
      if (table === 'standards') {
        const standardData = nameMaps.standards.get(id)
        if (standardData) {
          expand[field] = standardData
        }
      }
      else {
        const name = (nameMaps[table] as Map<string, string>).get(id)
        if (name) {
          expand[field] = { name }
        }
      }
    }
  }

  return { ...record, expand }
}
