/**
 * Shared Drizzle Database Instance
 *
 * Single database connection for both CLI and VitePress.
 * Uses Drizzle ORM with better-sqlite3 for synchronous SQLite access.
 *
 * Relations are defined in schema.ts and enable relational queries:
 *   db.query.content.findMany({ with: { target: true, standard: true } })
 */

import { join } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Database path - relative to this file (docs/.vitepress/database/db.ts)
// import.meta.dirname is the directory containing this file
const dbPath = join(import.meta.dirname, 'drizzle.db')

// Initialize SQLite connection
const sqlite = new Database(dbPath)

// Enable foreign key constraints
sqlite.pragma('foreign_keys = ON')

/**
 * Drizzle database instance with schema and relations
 *
 * Usage with relational queries:
 * ```ts
 * const items = db.query.content.findMany({
 *   with: {
 *     target: true,
 *     standard: true,
 *     technology: true,
 *     vendor: true,
 *     maintainer: {
 *       with: { organization: true }
 *     }
 *   }
 * })
 * ```
 */
export const db = drizzle(sqlite, { schema })

// Re-export schema types for convenience
export type {
  Content,
  Organization,
  Standard,
  Target,
  Team,
  Technology,
} from './schema'
