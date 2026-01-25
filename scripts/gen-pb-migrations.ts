#!/usr/bin/env tsx
/**
 * Generate Pocketbase migrations from Drizzle schema
 *
 * This script bridges Drizzle ORM (schema source of truth) to Pocketbase migrations.
 *
 * Workflow:
 * 1. Reads Drizzle schema from docs/.vitepress/database/schema.ts
 * 2. Connects to Pocketbase to get current collections
 * 3. Compares and detects differences
 * 4. Generates pb_migrations/*.js files for changes
 *
 * Usage: pnpm schema:generate
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import PocketBase from 'pocketbase'

// Drizzle introspection symbols
const TABLE_SYMBOL = Symbol.for('drizzle:IsDrizzleTable')
const NAME_SYMBOL = Symbol.for('drizzle:Name')
const COLUMNS_SYMBOL = Symbol.for('drizzle:Columns')
const FK_SYMBOL = Symbol.for('drizzle:SQLiteInlineForeignKeys')

// Type mapping: Drizzle columnType → Pocketbase field type
export const TYPE_MAP: Record<string, string> = {
  SQLiteText: 'text',
  SQLiteInteger: 'number',
  SQLiteBoolean: 'bool',
  SQLiteTimestamp: 'date',
  SQLiteReal: 'number',
}

export interface DrizzleColumn {
  name: string
  columnType: string
  notNull: boolean
  primary: boolean
  isUnique: boolean
  hasDefault: boolean
  default?: unknown
}

export interface DrizzleFK {
  fromColumn: string
  toTable: string
  toColumn: string
}

export interface DrizzleTable {
  exportName: string
  tableName: string
  columns: DrizzleColumn[]
  foreignKeys: DrizzleFK[]
}

export interface PocketbaseField {
  name: string
  type: string
  required: boolean
  options?: Record<string, unknown>
}

export interface PocketbaseCollection {
  id: string
  name: string
  type: string
  fields: PocketbaseField[]
}

/**
 * Introspect Drizzle schema and extract table definitions
 */
async function introspectDrizzleSchema(): Promise<DrizzleTable[]> {
  // Dynamic import of the schema
  const schema = await import('../docs/.vitepress/database/schema.ts')

  const tables: DrizzleTable[] = []

  for (const [exportName, value] of Object.entries(schema)) {
    // Skip non-table exports (enums, relations, types)
    if (!value || typeof value !== 'object' || !(value as any)[TABLE_SYMBOL]) {
      continue
    }

    const table = value as any
    const tableName = table[NAME_SYMBOL]
    const columns = table[COLUMNS_SYMBOL]
    const fks = table[FK_SYMBOL] || []

    // Extract column info
    const columnDefs: DrizzleColumn[] = []
    for (const [colName, col] of Object.entries(columns)) {
      const column = col as any
      columnDefs.push({
        name: column.name || colName,
        columnType: column.columnType,
        notNull: column.notNull || false,
        primary: column.primary || false,
        isUnique: column.isUnique || false,
        hasDefault: column.hasDefault || false,
        default: column.default,
      })
    }

    // Extract FK info
    const foreignKeys: DrizzleFK[] = []
    for (const fk of fks) {
      if (typeof fk.reference === 'function') {
        const ref = fk.reference()
        const fromCol = ref.columns[0]?.name
        const toTable = ref.foreignTable?.[NAME_SYMBOL]
        const toCol = ref.foreignColumns[0]?.name
        if (fromCol && toTable && toCol) {
          foreignKeys.push({
            fromColumn: fromCol,
            toTable,
            toColumn: toCol,
          })
        }
      }
    }

    tables.push({
      exportName,
      tableName,
      columns: columnDefs,
      foreignKeys,
    })
  }

  return tables
}

/**
 * Get current Pocketbase collections
 */
async function getPocketbaseCollections(pb: PocketBase): Promise<Map<string, PocketbaseCollection>> {
  const collections = await pb.collections.getFullList()
  const map = new Map<string, PocketbaseCollection>()

  for (const col of collections) {
    // Skip system collections
    if (col.name.startsWith('_'))
      continue

    map.set(col.name, {
      id: col.id,
      name: col.name,
      type: col.type,
      fields: (col as any).fields || [],
    })
  }

  return map
}

/**
 * Convert Drizzle column to Pocketbase field
 */
export function drizzleColumnToPocketbaseField(
  col: DrizzleColumn,
  fks: DrizzleFK[],
  collectionIdMap: Map<string, string>,
): PocketbaseField {
  // Check if this column is a FK
  const fk = fks.find(f => f.fromColumn === col.name)

  if (fk) {
    const targetCollectionId = collectionIdMap.get(fk.toTable)
    return {
      name: col.name,
      type: 'relation',
      required: col.notNull,
      options: {
        collectionId: targetCollectionId || fk.toTable,
        cascadeDelete: true,
        maxSelect: 1,
        minSelect: 0,
      },
    }
  }

  // Regular field
  const pbType = TYPE_MAP[col.columnType] || 'text'

  const field: PocketbaseField = {
    name: col.name,
    type: pbType,
    required: col.notNull,
  }

  // Add type-specific options
  if (pbType === 'number' && col.columnType === 'SQLiteInteger') {
    field.options = { onlyInt: true }
  }

  return field
}

/**
 * Generate a Pocketbase migration file
 */
export function generateMigrationFile(
  action: 'create' | 'update' | 'delete',
  tableName: string,
  fields: PocketbaseField[],
  collectionId?: string,
): string {
  const fieldId = () => `field${Math.random().toString(36).slice(2, 12)}`

  // Build fields array for Pocketbase
  const pbFields = [
    // System ID field
    {
      autogeneratePattern: '[a-z0-9]{15}',
      hidden: false,
      id: 'text3208210256',
      max: 15,
      min: 15,
      name: 'id',
      pattern: '^[a-z0-9]+$',
      presentable: false,
      primaryKey: true,
      required: true,
      system: true,
      type: 'text',
    },
    // User-defined fields
    ...fields
      .filter(f => f.name !== 'id') // Skip ID, we added it above
      .map((f) => {
        const base: Record<string, unknown> = {
          hidden: false,
          id: fieldId(),
          name: f.name,
          presentable: false,
          required: f.required,
          system: false,
          type: f.type,
        }

        // Type-specific properties
        if (f.type === 'text') {
          base.autogeneratePattern = ''
          base.max = 0
          base.min = 0
          base.pattern = ''
        }
        else if (f.type === 'number') {
          base.max = null
          base.min = null
          base.onlyInt = f.options?.onlyInt || false
        }
        else if (f.type === 'bool') {
          // No extra options
        }
        else if (f.type === 'date') {
          base.max = ''
          base.min = ''
        }
        else if (f.type === 'relation') {
          base.cascadeDelete = f.options?.cascadeDelete || false
          base.collectionId = f.options?.collectionId || ''
          base.maxSelect = f.options?.maxSelect || 1
          base.minSelect = f.options?.minSelect || 0
        }

        return base
      }),
  ]

  const generatedId = `pbc_${Math.random().toString().slice(2, 12)}`

  if (action === 'create') {
    return `/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": ${JSON.stringify(pbFields, null, 4).split('\n').map((l, i) => i === 0 ? l : `    ${l}`).join('\n')},
    "id": "${collectionId || generatedId}",
    "indexes": [],
    "listRule": null,
    "name": "${tableName}",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("${collectionId || generatedId}");

  return app.delete(collection);
})
`
  }

  if (action === 'delete') {
    return `/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("${collectionId}");
  return app.delete(collection);
}, (app) => {
  // Rollback: recreate the collection
  // TODO: Store original collection definition for proper rollback
})
`
  }

  // Update - more complex, would need field-level diff
  return `/// <reference path="../pb_data/types.d.ts" />
// TODO: Implement update migration for ${tableName}
`
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Introspecting Drizzle schema...')
  const drizzleTables = await introspectDrizzleSchema()
  console.log(`   Found ${drizzleTables.length} tables in schema.ts`)

  // Connect to Pocketbase
  const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
  const pbEmail = process.env.POCKETBASE_EMAIL || 'admin@localhost.com'
  const pbPassword = process.env.POCKETBASE_PASSWORD || 'testpassword123'

  console.log(`\n🔌 Connecting to Pocketbase at ${pbUrl}...`)
  const pb = new PocketBase(pbUrl)

  try {
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)
    console.log('   Authenticated successfully')
  }
  catch (err) {
    console.error('❌ Failed to authenticate with Pocketbase:', err instanceof Error ? err.message : err)
    console.error('   Make sure Pocketbase is running: cd .pocketbase && ./pocketbase serve')
    process.exit(1)
  }

  console.log('\n📦 Fetching current Pocketbase collections...')
  const pbCollections = await getPocketbaseCollections(pb)
  console.log(`   Found ${pbCollections.size} collections in Pocketbase`)

  // Build collection ID map for FK resolution
  const collectionIdMap = new Map<string, string>()
  for (const [name, col] of pbCollections) {
    collectionIdMap.set(name, col.id)
  }

  // Compare and find differences
  console.log('\n🔄 Comparing schemas...')

  const toCreate: DrizzleTable[] = []
  const toDelete: string[] = []
  const toUpdate: DrizzleTable[] = []

  // Find tables to create (in Drizzle but not in Pocketbase)
  for (const table of drizzleTables) {
    if (!pbCollections.has(table.tableName)) {
      toCreate.push(table)
    }
    else {
      // TODO: Compare fields for updates
      // For now, skip existing tables
    }
  }

  // Find tables to delete (in Pocketbase but not in Drizzle)
  const drizzleTableNames = new Set(drizzleTables.map(t => t.tableName))
  for (const [name, _col] of pbCollections) {
    if (!drizzleTableNames.has(name)) {
      toDelete.push(name)
    }
  }

  console.log(`   Tables to create: ${toCreate.length}`)
  console.log(`   Tables to delete: ${toDelete.length}`)
  console.log(`   Tables to update: ${toUpdate.length}`)

  if (toCreate.length === 0 && toDelete.length === 0 && toUpdate.length === 0) {
    console.log('\n✅ Schemas are in sync. No migrations needed.')
    return
  }

  // Generate migrations
  const migrationsDir = '.pocketbase/pb_migrations'
  if (!existsSync(migrationsDir)) {
    mkdirSync(migrationsDir, { recursive: true })
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const table of toCreate) {
    const fields = table.columns.map(col =>
      drizzleColumnToPocketbaseField(col, table.foreignKeys, collectionIdMap),
    )
    const migration = generateMigrationFile('create', table.tableName, fields)
    const filename = `${migrationsDir}/${timestamp}_create_${table.tableName}.js`
    writeFileSync(filename, migration)
    console.log(`   📝 Created: ${filename}`)
  }

  for (const tableName of toDelete) {
    const col = pbCollections.get(tableName)
    const migration = generateMigrationFile('delete', tableName, [], col?.id)
    const filename = `${migrationsDir}/${timestamp}_delete_${tableName}.js`
    writeFileSync(filename, migration)
    console.log(`   📝 Created: ${filename}`)
  }

  console.log('\n✅ Migrations generated. Run `pnpm dev:setup` to apply them.')
}

// Run only when executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
}
