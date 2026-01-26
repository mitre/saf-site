/**
 * Table CLI Layer (saf-site-gf9 Step 2)
 *
 * Output formatting for generic table commands.
 * Separates CLI concerns from data layer.
 */

import type { OutputFormat } from '../lib/cli-utils.js'
import pc from 'picocolors'

// Re-export OutputFormat for consumers
export type { OutputFormat }

// ============================================================================
// TYPES
// ============================================================================

export type TableRecord = Record<string, unknown>

// ============================================================================
// FORMAT TABLE LIST
// ============================================================================

/**
 * Format a list of records for output
 *
 * @param records - Array of records from any table
 * @param tableName - Name of the table (for display)
 * @param format - Output format: json, text, or quiet
 */
export function formatTableList(
  records: TableRecord[],
  tableName: string,
  format: OutputFormat,
): string {
  if (format === 'json') {
    return JSON.stringify(records, null, 2)
  }

  if (format === 'quiet') {
    if (records.length === 0) {
      return ''
    }
    return records.map(r => String(r.id)).join('\n')
  }

  // Text format
  if (records.length === 0) {
    return pc.dim('No records found')
  }

  const lines: string[] = []
  lines.push(pc.bold(`\n${tableName} (${records.length} records)`))
  lines.push(pc.dim('─'.repeat(60)))

  // Get columns to display (first few important ones)
  const allKeys = Object.keys(records[0])
  const displayKeys = allKeys.slice(0, 5) // Show first 5 columns

  // Header
  lines.push(displayKeys.map(k => k.padEnd(15)).join(' '))
  lines.push(pc.dim('─'.repeat(60)))

  // Rows
  for (const record of records) {
    const values = displayKeys.map((key) => {
      const value = record[key]
      const str = value === null || value === undefined ? '-' : String(value)
      return str.slice(0, 14).padEnd(15)
    })
    lines.push(values.join(' '))
  }

  return lines.join('\n')
}

// ============================================================================
// FORMAT TABLE RECORD
// ============================================================================

/**
 * Format a single record for output
 *
 * @param record - Single record from any table
 * @param tableName - Name of the table (for display)
 * @param format - Output format: json, text, or quiet
 */
export function formatTableRecord(
  record: TableRecord,
  tableName: string,
  format: OutputFormat,
): string {
  if (format === 'json') {
    return JSON.stringify(record, null, 2)
  }

  if (format === 'quiet') {
    return String(record.id)
  }

  // Text format
  const lines: string[] = []
  lines.push(pc.bold(`\n${tableName}`))
  lines.push(pc.dim('─'.repeat(40)))

  for (const [key, value] of Object.entries(record)) {
    const displayValue = value === null || value === undefined ? pc.dim('-') : String(value)
    lines.push(`${pc.cyan(key.padEnd(20))} ${displayValue}`)
  }

  return lines.join('\n')
}
