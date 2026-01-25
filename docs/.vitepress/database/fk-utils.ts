/**
 * FK Utilities - Foreign Key detection, ordering, and validation
 *
 * Centralizes FK operations for:
 * - db-diffable (insert ordering)
 * - CLI CRUD (FK validation)
 * - VitePress loaders (relation expansion)
 *
 * Uses Drizzle introspection symbols to extract FK info from schema.
 */

// Drizzle introspection symbols (same as gen-pb-migrations.ts)
const TABLE_SYMBOL = Symbol.for('drizzle:IsDrizzleTable')
const NAME_SYMBOL = Symbol.for('drizzle:Name')
const FK_SYMBOL = Symbol.for('drizzle:SQLiteInlineForeignKeys')

export interface ForeignKeyInfo {
  fromColumn: string
  toTable: string
  toColumn: string
  onDelete?: 'cascade' | 'set null' | 'restrict' | 'no action'
}

/**
 * Detect foreign key columns from a Drizzle table definition
 *
 * Uses Drizzle's internal symbols to introspect the table and extract FK info.
 */
export function detectForeignKeys(table: unknown): ForeignKeyInfo[] {
  if (!table || typeof table !== 'object') {
    return []
  }

  const tableObj = table as Record<symbol | string, unknown>

  // Check if this is a Drizzle table
  if (!tableObj[TABLE_SYMBOL]) {
    return []
  }

  // Get the FK definitions
  const fks = tableObj[FK_SYMBOL] as unknown[] | undefined
  if (!fks || !Array.isArray(fks)) {
    return []
  }

  const result: ForeignKeyInfo[] = []

  for (const fk of fks) {
    if (!fk || typeof fk !== 'object') {
      continue
    }

    const fkObj = fk as Record<string, unknown>

    // FK has a reference() function that returns the reference info
    if (typeof fkObj.reference !== 'function') {
      continue
    }

    try {
      const ref = fkObj.reference() as {
        columns?: Array<{ name?: string }>
        foreignTable?: Record<symbol, string>
        foreignColumns?: Array<{ name?: string }>
        onDelete?: string
      }

      const fromCol = ref.columns?.[0]?.name
      const toTable = ref.foreignTable?.[NAME_SYMBOL]
      const toCol = ref.foreignColumns?.[0]?.name

      if (fromCol && toTable && toCol) {
        const info: ForeignKeyInfo = {
          fromColumn: fromCol,
          toTable,
          toColumn: toCol,
        }

        // Add onDelete if specified (it's on the FK object, not the reference result)
        if (fkObj.onDelete) {
          info.onDelete = fkObj.onDelete as ForeignKeyInfo['onDelete']
        }

        result.push(info)
      }
    }
    catch {
      // Skip malformed FK definitions
      continue
    }
  }

  return result
}

/**
 * Get tables in insert-safe order (parents before children)
 *
 * Uses topological sort based on FK dependencies.
 * Tables with no dependencies come first, tables that depend on others come later.
 */
export function getInsertOrder(schema: Record<string, unknown>): string[] {
  // First, collect all tables and their dependencies
  const tables = new Map<string, Set<string>>()

  for (const value of Object.values(schema)) {
    if (!value || typeof value !== 'object') {
      continue
    }

    const tableObj = value as Record<symbol, unknown>

    // Check if this is a Drizzle table
    if (!tableObj[TABLE_SYMBOL]) {
      continue
    }

    const tableName = tableObj[NAME_SYMBOL] as string
    if (!tableName) {
      continue
    }

    // Get FK dependencies
    const fks = detectForeignKeys(value)
    const deps = new Set<string>()

    for (const fk of fks) {
      // Don't add self-references as dependencies (would cause cycle)
      if (fk.toTable !== tableName) {
        deps.add(fk.toTable)
      }
    }

    tables.set(tableName, deps)
  }

  // Topological sort using Kahn's algorithm
  const result: string[] = []
  const inDegree = new Map<string, number>()

  // Initialize in-degree for all tables
  for (const tableName of tables.keys()) {
    inDegree.set(tableName, 0)
  }

  // Calculate in-degree: how many unprocessed dependencies each table has
  for (const [tableName, deps] of tables) {
    let count = 0
    for (const dep of deps) {
      if (tables.has(dep)) {
        count++
      }
    }
    inDegree.set(tableName, count)
  }

  // Start with tables that have no dependencies
  const queue: string[] = []
  for (const [tableName, degree] of inDegree) {
    if (degree === 0) {
      queue.push(tableName)
    }
  }

  // Sort queue for deterministic output
  queue.sort()

  while (queue.length > 0) {
    // Sort to ensure deterministic order among equally-ready tables
    queue.sort()
    const current = queue.shift()!
    result.push(current)

    // For each table that depends on current, reduce its in-degree
    for (const [tableName, deps] of tables) {
      if (deps.has(current)) {
        const newDegree = (inDegree.get(tableName) || 0) - 1
        inDegree.set(tableName, newDegree)
        if (newDegree === 0) {
          queue.push(tableName)
        }
      }
    }
  }

  // If we didn't process all tables, there's a cycle
  // Add remaining tables at the end (they have circular dependencies)
  for (const tableName of tables.keys()) {
    if (!result.includes(tableName)) {
      result.push(tableName)
    }
  }

  return result
}

/**
 * Validate that a FK value exists in the target table's data
 *
 * @param value - The FK value to validate (null/undefined/empty = optional, always valid)
 * @param targetData - Array of records from the target table (must have 'id' field)
 * @returns true if the FK value is valid (exists in target or is empty/null)
 */
export function validateFkReference(
  value: string | null | undefined,
  targetData: Array<{ id: string }>,
): boolean {
  // Null, undefined, or empty string = optional FK, always valid
  if (value === null || value === undefined || value === '') {
    return true
  }

  // Check if the ID exists in target data (case-sensitive)
  return targetData.some(record => record.id === value)
}

// Re-export symbols for external use
export { TABLE_SYMBOL, NAME_SYMBOL, FK_SYMBOL }
