/**
 * Content CLI Layer (Phase 4.1)
 *
 * Argument parsing and output formatting for non-interactive CLI.
 * Separates CLI concerns from business logic.
 */

import type { OutputFormat } from '../lib/cli-utils.js'
import type { ContentFKNames } from '../lib/content-service.js'
import type { UpdateContentInput } from '../lib/pocketbase.js'
import type { PrepareAddInput, PrepareAddResult, PrepareUpdateResult } from './content.logic.js'
import Table from 'cli-table3'
import pc from 'picocolors'
import {
  formatErrorsText,
  formatWarnings,

  VALID_AUTOMATION_LEVELS,
  VALID_CONTENT_TYPES,
  VALID_STATUSES,
} from '../lib/cli-utils.js'

// Re-export OutputFormat for consumers
export type { OutputFormat }

// ============================================================================
// TYPES
// ============================================================================

export interface AddCommandArgs extends PrepareAddInput {
  errors: string[]
}

export interface UpdateCommandArgs {
  id?: string
  updates?: Partial<UpdateContentInput>
  syncReadme?: boolean
  errors: string[]
}

interface RawAddArgs {
  url?: string
  type?: string
  vendor?: string
  standard?: string
  technology?: string
  target?: string
  maintainer?: string
  name?: string
  slug?: string
  version?: string
  status?: string
  controlCount?: string
  automationLevel?: string
}

interface RawUpdateArgs {
  id?: string
  name?: string
  description?: string
  version?: string
  status?: string
  controlCount?: string
  syncReadme?: boolean
}

// ============================================================================
// PARSE ADD ARGS
// ============================================================================

/**
 * Parse command line arguments for content add command
 */
export function parseAddArgs(raw: RawAddArgs): AddCommandArgs {
  const errors: string[] = []

  // Validate required fields
  if (!raw.url) {
    errors.push('GitHub URL is required')
  }

  if (!raw.type) {
    errors.push('Content type is required (--type validation|hardening)')
  }
  else if (!VALID_CONTENT_TYPES.includes(raw.type as any)) {
    errors.push('Content type must be "validation" or "hardening"')
  }

  // Validate optional enums
  if (raw.status && !VALID_STATUSES.includes(raw.status as any)) {
    errors.push('Status must be one of: active, beta, deprecated, draft')
  }

  if (raw.automationLevel && !VALID_AUTOMATION_LEVELS.includes(raw.automationLevel as any)) {
    errors.push('Automation level must be one of: full, partial, manual')
  }

  // Build FK names
  const fkNames: ContentFKNames = {}
  if (raw.vendor)
    fkNames.vendor = raw.vendor
  if (raw.standard)
    fkNames.standard = raw.standard
  if (raw.technology)
    fkNames.technology = raw.technology
  if (raw.target)
    fkNames.target = raw.target
  if (raw.maintainer)
    fkNames.maintainer = raw.maintainer

  // Build overrides
  const overrides: PrepareAddInput['overrides'] = {}
  if (raw.name)
    overrides.name = raw.name
  if (raw.slug)
    overrides.slug = raw.slug
  if (raw.version)
    overrides.version = raw.version
  if (raw.status)
    overrides.status = raw.status as any
  if (raw.controlCount)
    overrides.controlCount = Number.parseInt(raw.controlCount, 10)
  if (raw.automationLevel)
    overrides.automationLevel = raw.automationLevel as any

  return {
    githubUrl: raw.url || '',
    contentType: (raw.type as 'validation' | 'hardening') || 'validation',
    fkNames: Object.keys(fkNames).length > 0 ? fkNames : undefined,
    overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
    errors,
  }
}

// ============================================================================
// PARSE UPDATE ARGS
// ============================================================================

/**
 * Parse command line arguments for content update command
 */
export function parseUpdateArgs(raw: RawUpdateArgs): UpdateCommandArgs {
  const errors: string[] = []

  // Validate required fields
  if (!raw.id) {
    errors.push('Content ID is required')
  }

  // Build updates
  const updates: Partial<UpdateContentInput> = {}
  if (raw.name)
    updates.name = raw.name
  if (raw.description)
    updates.description = raw.description
  if (raw.version)
    updates.version = raw.version
  if (raw.status)
    updates.status = raw.status as any
  if (raw.controlCount)
    updates.controlCount = Number.parseInt(raw.controlCount, 10)

  // Check if any updates or syncReadme specified
  const hasUpdates = Object.keys(updates).length > 0 || raw.syncReadme

  if (!hasUpdates) {
    errors.push('No updates specified')
  }

  return {
    id: raw.id,
    updates: Object.keys(updates).length > 0 ? updates : undefined,
    syncReadme: raw.syncReadme,
    errors,
  }
}

// ============================================================================
// FORMAT ADD RESULT
// ============================================================================

/**
 * Format prepareContentAdd result for output
 */
export function formatAddResult(result: PrepareAddResult, format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify({
      success: result.success,
      content: result.content,
      warnings: result.warnings,
      errors: result.errors,
    }, null, 2)
  }

  if (format === 'quiet') {
    return result.success && result.content ? result.content.slug : ''
  }

  // Text format
  const lines: string[] = []

  if (result.success && result.content) {
    lines.push(pc.green('✓ Content prepared successfully'))
    lines.push('')
    lines.push(`${pc.bold('Name:')}     ${result.content.name}`)
    lines.push(`${pc.bold('Slug:')}     ${result.content.slug}`)
    lines.push(`${pc.bold('Type:')}     ${result.content.contentType}`)
    if (result.content.version) {
      lines.push(`${pc.bold('Version:')}  ${result.content.version}`)
    }
    if (result.content.status) {
      lines.push(`${pc.bold('Status:')}   ${result.content.status}`)
    }
    if (result.content.controlCount) {
      lines.push(`${pc.bold('Controls:')} ${result.content.controlCount}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push(formatWarnings(result.warnings))
  }

  if (result.errors.length > 0) {
    lines.push(formatErrorsText(result.errors))
  }

  return lines.join('\n')
}

// ============================================================================
// FORMAT UPDATE RESULT
// ============================================================================

/**
 * Format prepareContentUpdate result for output
 */
export function formatUpdateResult(
  result: PrepareUpdateResult,
  id: string,
  format: OutputFormat,
): string {
  if (format === 'json') {
    return JSON.stringify({
      success: result.success,
      id,
      hasChanges: result.hasChanges,
      changes: result.diff?.changes || {},
      warnings: result.warnings,
      errors: result.errors,
    }, null, 2)
  }

  if (format === 'quiet') {
    return result.success && result.hasChanges ? id : ''
  }

  // Text format
  const lines: string[] = []

  if (result.success) {
    if (result.hasChanges && result.diff) {
      lines.push(pc.green(`✓ Update prepared for ${id}`))
      lines.push('')
      lines.push(pc.bold('Changes:'))

      for (const [field, change] of Object.entries(result.diff.changes)) {
        lines.push(`  ${field}: ${pc.red(String(change.old))} → ${pc.green(String(change.new))}`)
      }
    }
    else {
      lines.push(pc.yellow('No changes detected'))
    }
  }

  if (result.warnings.length > 0) {
    lines.push(formatWarnings(result.warnings))
  }

  if (result.errors.length > 0) {
    lines.push(formatErrorsText(result.errors))
  }

  return lines.join('\n')
}

// ============================================================================
// FORMAT LIST RESULT
// ============================================================================

/**
 * Format content list for output
 */
export function formatListResult(
  records: Array<Record<string, any>>,
  format: OutputFormat,
): string {
  if (format === 'json') {
    return JSON.stringify(records, null, 2)
  }

  if (format === 'quiet') {
    return records.map(r => r.id).join('\n')
  }

  // Text format - table
  const table = new Table({
    head: [
      pc.bold('ID'),
      pc.bold('Name'),
      pc.bold('Type'),
      pc.bold('Target'),
      pc.bold('Standard'),
      pc.bold('Version'),
    ],
    colWidths: [12, 35, 12, 20, 10, 10],
  })

  for (const record of records) {
    table.push([
      record.id.substring(0, 10),
      (record.name || '').substring(0, 33),
      record.content_type || '-',
      record.expand?.target?.name?.substring(0, 18) || '-',
      record.expand?.standard?.short_name || '-',
      record.version || '-',
    ])
  }

  return table.toString()
}
