/**
 * Drizzle Data Layer (saf-site-gf9)
 *
 * Generic CRUD operations for any table in the Drizzle schema.
 * Replaces Pocketbase for CLI database access.
 *
 * Design influenced by lazysql UX patterns:
 * - SQL-like WHERE filtering
 * - Explicit save/confirm for mutations
 * - Batch operations support
 */

import { existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import Database from 'better-sqlite3'
import * as schema from '@schema/schema.js'

// ============================================================================
// TYPES
// ============================================================================

/**
 * The raw better-sqlite3 database type
 */
export type DrizzleDatabase = Database.Database

/**
 * Generic record type (row from any table)
 */
export type GenericRecord = Record<string, unknown>

/**
 * Options for listing records
 */
export interface ListOptions {
  /** SQL WHERE conditions as key-value pairs */
  where?: Record<string, unknown>
  /** Column to sort by */
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
 * Get a better-sqlite3 database connection
 *
 * @param dbPath - Path to SQLite database file
 * @returns Database connection
 * @throws If database file doesn't exist
 */
export function getDrizzle(dbPath: string): DrizzleDatabase {
  if (!existsSync(dbPath)) {
    throw new Error(`Database not found: ${dbPath}`)
  }

  const db = new Database(dbPath)

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON')

  return db
}

// ============================================================================
// SCHEMA INTROSPECTION
// ============================================================================

/**
 * Map of table names to their schema definitions
 * Built from the exported schema
 */
const tableMap = new Map<string, typeof schema[keyof typeof schema]>()

// Symbol used by Drizzle to store table name
const DRIZZLE_BASE_NAME = Symbol.for('drizzle:BaseName')

// Build table map from schema exports
for (const [key, value] of Object.entries(schema)) {
  // Skip relations and type exports (they have different structure)
  // Tables have the drizzle:BaseName symbol
  if (
    value
    && typeof value === 'object'
    && DRIZZLE_BASE_NAME in value
  ) {
    const tableName = (value as any)[DRIZZLE_BASE_NAME] as string
    tableMap.set(tableName, value as any)
  }
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

/**
 * Validate table name and throw if invalid
 */
function assertValidTable(tableName: string): void {
  if (!isValidTable(tableName)) {
    const validTables = getTableNames().join(', ')
    throw new Error(`Unknown table: "${tableName}". Valid tables: ${validTables}`)
  }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Generate a Pocketbase-style ID (15 alphanumeric characters)
 */
export function generateId(): string {
  // Generate 12 random bytes and convert to base36 (alphanumeric)
  const bytes = randomBytes(12)
  let id = ''
  for (const byte of bytes) {
    id += byte.toString(36)
  }
  return id.slice(0, 15).toLowerCase()
}

/**
 * List records from a table with optional filtering and sorting
 *
 * @param db - Database connection
 * @param tableName - Name of the table
 * @param options - List options (where, orderBy, limit, etc.)
 * @returns Array of records
 */
export function listRecords(
  db: DrizzleDatabase,
  tableName: string,
  options: ListOptions = {},
): GenericRecord[] {
  assertValidTable(tableName)

  const { where, orderBy, order = 'asc', limit, offset } = options

  // Build SQL query
  let sql = `SELECT * FROM "${tableName}"`
  const params: unknown[] = []

  // Add WHERE clause
  if (where && Object.keys(where).length > 0) {
    const conditions = Object.entries(where).map(([key, value]) => {
      params.push(value)
      return `"${key}" = ?`
    })
    sql += ` WHERE ${conditions.join(' AND ')}`
  }

  // Add ORDER BY
  if (orderBy) {
    sql += ` ORDER BY "${orderBy}" ${order.toUpperCase()}`
  }

  // Add LIMIT and OFFSET
  if (limit !== undefined) {
    sql += ` LIMIT ?`
    params.push(limit)
  }

  if (offset !== undefined) {
    sql += ` OFFSET ?`
    params.push(offset)
  }

  return db.prepare(sql).all(...params) as GenericRecord[]
}

/**
 * Get a single record by ID
 *
 * @param db - Database connection
 * @param tableName - Name of the table
 * @param id - Record ID
 * @returns Record or null if not found
 */
export function getRecord(
  db: DrizzleDatabase,
  tableName: string,
  id: string,
): GenericRecord | null {
  assertValidTable(tableName)

  const sql = `SELECT * FROM "${tableName}" WHERE "id" = ?`
  const result = db.prepare(sql).get(id) as GenericRecord | undefined

  return result ?? null
}

/**
 * Create a new record
 *
 * @param db - Database connection
 * @param tableName - Name of the table
 * @param data - Record data (id is optional, will be generated)
 * @returns Created record
 */
export function createRecord(
  db: DrizzleDatabase,
  tableName: string,
  data: GenericRecord,
): GenericRecord {
  assertValidTable(tableName)

  // Generate ID if not provided
  const recordData = { ...data }
  if (!recordData.id) {
    recordData.id = generateId()
  }

  // Build INSERT statement
  const columns = Object.keys(recordData)
  const placeholders = columns.map(() => '?')
  const values = columns.map(col => recordData[col])

  const sql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`

  db.prepare(sql).run(...values)

  // Return the created record
  return getRecord(db, tableName, recordData.id as string)!
}

/**
 * Update an existing record
 *
 * @param db - Database connection
 * @param tableName - Name of the table
 * @param id - Record ID
 * @param data - Fields to update
 * @returns Updated record or null if not found
 */
export function updateRecord(
  db: DrizzleDatabase,
  tableName: string,
  id: string,
  data: GenericRecord,
): GenericRecord | null {
  assertValidTable(tableName)

  // Check if record exists
  const existing = getRecord(db, tableName, id)
  if (!existing) {
    return null
  }

  // Build UPDATE statement
  const columns = Object.keys(data)
  if (columns.length === 0) {
    return existing // Nothing to update
  }

  const setClause = columns.map(col => `"${col}" = ?`).join(', ')
  const values = columns.map(col => data[col])

  const sql = `UPDATE "${tableName}" SET ${setClause} WHERE "id" = ?`

  db.prepare(sql).run(...values, id)

  // Return the updated record
  return getRecord(db, tableName, id)!
}

/**
 * Delete a record by ID
 *
 * @param db - Database connection
 * @param tableName - Name of the table
 * @param id - Record ID
 * @returns true if deleted, false if not found
 */
export function deleteRecord(
  db: DrizzleDatabase,
  tableName: string,
  id: string,
): boolean {
  assertValidTable(tableName)

  const sql = `DELETE FROM "${tableName}" WHERE "id" = ?`
  const result = db.prepare(sql).run(id)

  return result.changes > 0
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
 * @param db - Database connection
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

  for (const table of tables) {
    const records = listRecords(db, table) as Array<{ id: string, name?: string }>
    const map = new Map<string, string>()

    for (const record of records) {
      if (record.name) {
        map.set(record.name.toLowerCase(), record.id)
      }
    }

    result[table] = map
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
