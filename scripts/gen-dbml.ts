/**
 * Generate DBML from Drizzle schema
 *
 * Dynamically parses schema.ts to extract:
 * - All tables
 * - All foreign key references (including junction tables)
 * - Auto-generates TableGroups based on naming conventions
 *
 * Usage: pnpm db:dbml
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { sqliteGenerate } from 'drizzle-dbml-generator'
import * as schema from '../docs/.vitepress/database/schema'

const SCHEMA_PATH = 'docs/.vitepress/database/schema.ts'
const OUTPUT_PATH = 'docs/.vitepress/database/schema.dbml'

// Parse schema file to find ALL references dynamically
export function findAllRefs(schemaContent: string): string[] {
  const refs: string[] = []

  // Find all sqliteTable definitions
  const tableRegex = /export const (\w+) = sqliteTable\('([^']+)'/g
  const tables: Map<string, string> = new Map() // varName -> tableName

  for (const match of schemaContent.matchAll(tableRegex)) {
    tables.set(match[1], match[2])
  }

  // For each table, find all .references() calls
  for (const [varName, tableName] of tables) {
    const tableStart = schemaContent.indexOf(`export const ${varName} = sqliteTable`)
    const nextExport = schemaContent.indexOf('export const', tableStart + 1)
    const tableBlock = schemaContent.slice(tableStart, nextExport > 0 ? nextExport : undefined)

    // Match: fieldName: text('column').references(() => targetTable.id)
    // Also handles .notNull() before .references()
    const refRegex = /(\w+):\s*text\([^)]+\)(?:\.notNull\(\))?\.references\(\(\)\s*=>\s*(\w+)\.(\w+)/g

    for (const refMatch of tableBlock.matchAll(refRegex)) {
      const fieldName = refMatch[1]
      const targetVar = refMatch[2]
      const targetCol = refMatch[3]
      const targetTable = tables.get(targetVar) ?? targetVar

      refs.push(`ref: ${tableName}.${fieldName} > ${targetTable}.${targetCol}`)
    }
  }

  return refs
}

// Auto-detect table groups based on naming patterns
export function generateTableGroups(schemaContent: string): string {
  const tableRegex = /export const \w+ = sqliteTable\('([^']+)'/g
  const allTables: string[] = []

  for (const match of schemaContent.matchAll(tableRegex)) {
    allTables.push(match[1])
  }

  // Group by prefix/pattern
  const coreContent = allTables.filter(t =>
    ['content', 'targets', 'standards', 'technologies', 'organizations', 'teams', 'categories', 'capabilities', 'tags'].includes(t)
    || t.startsWith('content_'),
  )

  const tools = allTables.filter(t =>
    ['tools', 'tool_types', 'distributions', 'distribution_types', 'registries'].includes(t)
    || t.startsWith('tool_') || t.startsWith('distribution_'),
  )

  const learning = allTables.filter(t =>
    ['courses', 'media', 'resource_types', 'media_types'].includes(t)
    || t.startsWith('course_') || t.startsWith('media_'),
  )

  const reference = allTables.filter(t =>
    !coreContent.includes(t) && !tools.includes(t) && !learning.includes(t),
  )

  let groups = ''

  if (coreContent.length > 0) {
    groups += `TableGroup core_content {\n  ${coreContent.join('\n  ')}\n}\n\n`
  }
  if (tools.length > 0) {
    groups += `TableGroup tools_distributions {\n  ${tools.join('\n  ')}\n}\n\n`
  }
  if (learning.length > 0) {
    groups += `TableGroup learning {\n  ${learning.join('\n  ')}\n}\n\n`
  }
  if (reference.length > 0) {
    groups += `TableGroup reference {\n  ${reference.join('\n  ')}\n}\n\n`
  }

  return groups
}

// Main - only run when executed directly
function main() {
  const schemaContent = readFileSync(SCHEMA_PATH, 'utf-8')

  // Generate base DBML from drizzle-dbml-generator
  const dbml = sqliteGenerate({ schema, relational: true })

  // Find all refs from schema (drizzle-dbml-generator misses some)
  const allRefs = findAllRefs(schemaContent)
  const existingRefs = new Set(dbml.match(/ref: .+/g) || [])

  // Find missing refs
  const missingRefs = allRefs.filter(ref => !existingRefs.has(ref))

  // Generate table groups
  const tableGroups = generateTableGroups(schemaContent)

  // Build final output
  const header = `// SAF Content Catalog - Database Schema
// Auto-generated from Drizzle schema
// Run: pnpm db:dbml
// DO NOT EDIT - changes will be overwritten

`

  let output = header + tableGroups + dbml

  if (missingRefs.length > 0) {
    output += '\n// Additional refs found in schema\n'
    output += `${missingRefs.join('\n')}\n`
  }

  writeFileSync(OUTPUT_PATH, output)
  console.log(`✅ Generated ${OUTPUT_PATH}`)
  console.log(`   Tables: ${(schemaContent.match(/sqliteTable/g) || []).length}`)
  console.log(`   Refs: ${allRefs.length} (${missingRefs.length} added by this script)`)
}

// Run only when executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
