/**
 * Generic Table Commands (saf-site-gf9 Step 2)
 *
 * CRUD operations for any table in the Drizzle schema.
 * Thin CLI wrapper around drizzle.ts - no business logic.
 *
 * Commands:
 *   pnpm cli table list <table> [--filter key=value] [--json]
 *   pnpm cli table show <table> <id> [--json]
 *   pnpm cli table add <table> --data <json> [--json]
 *   pnpm cli table update <table> <id> --data <json> [--json]
 *   pnpm cli table delete <table> <id> [--yes]
 */

import { join } from 'node:path'
import { Command } from 'commander'
import pc from 'picocolors'
import {
  createRecord,
  deleteRecord,
  getDrizzle,
  getRecord,
  getTableNames,
  isValidTable,
  listRecords,
  updateRecord,
} from '../lib/drizzle.js'
import { exitWithError, getOutputFormat } from '../lib/cli-utils.js'

// Database path
function getDbPath(): string {
  const cwd = process.cwd()
  if (cwd.endsWith('/cli')) {
    return join(cwd, '../docs/.vitepress/database/drizzle.db')
  }
  return join(cwd, 'docs/.vitepress/database/drizzle.db')
}

export const tableCommand = new Command('table')
  .description('Generic CRUD operations for any table')

// ============================================================================
// LIST COMMAND
// ============================================================================

tableCommand
  .command('list <table>')
  .description('List records from a table')
  .option('-f, --filter <key=value>', 'Filter by field value (can be used multiple times)', collect, [])
  .option('-s, --sort <field>', 'Sort by field')
  .option('-o, --order <asc|desc>', 'Sort order', 'asc')
  .option('-l, --limit <number>', 'Limit results')
  .option('--json', 'Output as JSON')
  .action((table, options) => {
    const format = getOutputFormat(options)

    // Validate table
    if (!isValidTable(table)) {
      exitWithError(`Unknown table: "${table}". Valid tables: ${getTableNames().join(', ')}`, format)
    }

    try {
      const db = getDrizzle(getDbPath())

      // Build where clause from filters
      const where: Record<string, unknown> = {}
      for (const filter of options.filter) {
        const [key, value] = filter.split('=')
        if (key && value !== undefined) {
          where[key] = value
        }
      }

      const records = listRecords(db, table, {
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: options.sort,
        order: options.order,
        limit: options.limit ? Number.parseInt(options.limit, 10) : undefined,
      })

      if (format === 'json') {
        console.log(JSON.stringify(records, null, 2))
      }
      else {
        formatTable(records, table)
      }
    }
    catch (error) {
      exitWithError(error instanceof Error ? error.message : 'Failed to list records', format)
    }
  })

// ============================================================================
// SHOW COMMAND
// ============================================================================

tableCommand
  .command('show <table> <id>')
  .description('Show a single record by ID')
  .option('--json', 'Output as JSON')
  .action((table, id, options) => {
    const format = getOutputFormat(options)

    // Validate table
    if (!isValidTable(table)) {
      exitWithError(`Unknown table: "${table}". Valid tables: ${getTableNames().join(', ')}`, format)
    }

    try {
      const db = getDrizzle(getDbPath())
      const record = getRecord(db, table, id)

      if (!record) {
        exitWithError(`Record not found: ${id}`, format)
      }

      if (format === 'json') {
        console.log(JSON.stringify(record, null, 2))
      }
      else {
        formatRecord(record, table)
      }
    }
    catch (error) {
      exitWithError(error instanceof Error ? error.message : 'Failed to show record', format)
    }
  })

// ============================================================================
// ADD COMMAND
// ============================================================================

tableCommand
  .command('add <table>')
  .description('Add a new record')
  .option('-d, --data <json>', 'Record data as JSON')
  .option('--json', 'Output as JSON')
  .action((table, options) => {
    const format = getOutputFormat(options)

    // Validate table
    if (!isValidTable(table)) {
      exitWithError(`Unknown table: "${table}". Valid tables: ${getTableNames().join(', ')}`, format)
    }

    if (!options.data) {
      exitWithError('--data is required', format)
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(options.data)
    }
    catch {
      exitWithError('Invalid JSON in --data', format)
      return
    }

    try {
      const db = getDrizzle(getDbPath())
      const record = createRecord(db, table, data)

      if (format === 'json') {
        console.log(JSON.stringify(record, null, 2))
      }
      else {
        console.log(pc.green(`Created record: ${record.id}`))
        formatRecord(record, table)
      }
    }
    catch (error) {
      exitWithError(error instanceof Error ? error.message : 'Failed to create record', format)
    }
  })

// ============================================================================
// UPDATE COMMAND
// ============================================================================

tableCommand
  .command('update <table> <id>')
  .description('Update an existing record')
  .option('-d, --data <json>', 'Fields to update as JSON')
  .option('--json', 'Output as JSON')
  .action((table, id, options) => {
    const format = getOutputFormat(options)

    // Validate table
    if (!isValidTable(table)) {
      exitWithError(`Unknown table: "${table}". Valid tables: ${getTableNames().join(', ')}`, format)
    }

    if (!options.data) {
      exitWithError('--data is required', format)
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(options.data)
    }
    catch {
      exitWithError('Invalid JSON in --data', format)
      return
    }

    try {
      const db = getDrizzle(getDbPath())
      const record = updateRecord(db, table, id, data)

      if (!record) {
        exitWithError(`Record not found: ${id}`, format)
      }

      if (format === 'json') {
        console.log(JSON.stringify(record, null, 2))
      }
      else {
        console.log(pc.green(`Updated record: ${id}`))
        formatRecord(record!, table)
      }
    }
    catch (error) {
      exitWithError(error instanceof Error ? error.message : 'Failed to update record', format)
    }
  })

// ============================================================================
// DELETE COMMAND
// ============================================================================

tableCommand
  .command('delete <table> <id>')
  .description('Delete a record')
  .option('-y, --yes', 'Skip confirmation')
  .action((table, id, options) => {
    // Validate table
    if (!isValidTable(table)) {
      console.error(pc.red(`Unknown table: "${table}". Valid tables: ${getTableNames().join(', ')}`))
      process.exit(1)
    }

    // Require --yes for non-interactive
    if (!options.yes) {
      console.error(pc.red('Use --yes to confirm deletion'))
      process.exit(1)
    }

    try {
      const db = getDrizzle(getDbPath())
      const deleted = deleteRecord(db, table, id)

      if (!deleted) {
        console.error(pc.red(`Record not found: ${id}`))
        process.exit(1)
      }

      console.log(pc.green(`Deleted record: ${id}`))
    }
    catch (error) {
      console.error(pc.red(error instanceof Error ? error.message : 'Failed to delete record'))
      process.exit(1)
    }
  })

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Collect multiple --filter options into an array
 */
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value])
}

/**
 * Format records as a text table
 */
function formatTable(records: Record<string, unknown>[], table: string): void {
  if (records.length === 0) {
    console.log(pc.dim('No records found'))
    return
  }

  console.log(pc.bold(`\n${table} (${records.length} records)`))
  console.log(pc.dim('─'.repeat(60)))

  // Get columns to display (first few important ones)
  const allKeys = Object.keys(records[0])
  const displayKeys = allKeys.slice(0, 5) // Show first 5 columns

  // Header
  console.log(displayKeys.map(k => k.padEnd(15)).join(' '))
  console.log(pc.dim('─'.repeat(60)))

  // Rows
  for (const record of records) {
    const values = displayKeys.map((key) => {
      const value = record[key]
      const str = value === null || value === undefined ? '-' : String(value)
      return str.slice(0, 14).padEnd(15)
    })
    console.log(values.join(' '))
  }
}

/**
 * Format a single record
 */
function formatRecord(record: Record<string, unknown>, table: string): void {
  console.log(pc.bold(`\n${table}`))
  console.log(pc.dim('─'.repeat(40)))

  for (const [key, value] of Object.entries(record)) {
    const displayValue = value === null || value === undefined ? pc.dim('-') : String(value)
    console.log(`${pc.cyan(key.padEnd(20))} ${displayValue}`)
  }
}
