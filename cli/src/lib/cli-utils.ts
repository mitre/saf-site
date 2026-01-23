/**
 * CLI Utilities
 *
 * Shared utilities for CLI commands to ensure consistent
 * output formatting, error handling, and validation.
 */

import pc from 'picocolors'

// ============================================================================
// TYPES
// ============================================================================

export type OutputFormat = 'json' | 'text' | 'quiet'

export interface CommandOptions {
  json?: boolean
  quiet?: boolean
  [key: string]: unknown
}

export interface ErrorResult {
  success: false
  errors: string[]
}

export interface SuccessResult<T = unknown> {
  success: true
  data?: T
  warnings?: string[]
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALID_CONTENT_TYPES = ['validation', 'hardening'] as const
export const VALID_STATUSES = ['active', 'beta', 'deprecated', 'draft'] as const
export const VALID_AUTOMATION_LEVELS = ['full', 'partial', 'manual'] as const

export type ContentType = typeof VALID_CONTENT_TYPES[number]
export type Status = typeof VALID_STATUSES[number]
export type AutomationLevel = typeof VALID_AUTOMATION_LEVELS[number]

// ============================================================================
// FORMAT DETECTION
// ============================================================================

/**
 * Determine output format from command options
 *
 * Priority: json > quiet > text
 */
export function getOutputFormat(options: CommandOptions): OutputFormat {
  if (options.json) return 'json'
  if (options.quiet) return 'quiet'
  return 'text'
}

/**
 * Check if running in non-interactive mode
 *
 * Non-interactive when any of: --yes, --json, --quiet
 */
export function isNonInteractive(options: CommandOptions): boolean {
  return !!(options.yes || options.json || options.quiet)
}

// ============================================================================
// ERROR OUTPUT
// ============================================================================

/**
 * Format errors for output (does not exit)
 */
export function formatErrors(errors: string[], format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify({ success: false, errors }, null, 2)
  }

  if (format === 'quiet') {
    return ''
  }

  // Text format
  const lines: string[] = [pc.red('Errors:')]
  for (const error of errors) {
    lines.push(pc.red(`  ✗ ${error}`))
  }
  return lines.join('\n')
}

/**
 * Output errors to console
 */
export function outputErrors(errors: string[], format: OutputFormat): void {
  const output = formatErrors(errors, format)
  if (output) {
    if (format === 'json') {
      console.log(output)
    } else {
      console.error(output)
    }
  }
}

/**
 * Output errors and exit with code 1
 */
export function exitWithErrors(errors: string[], format: OutputFormat): never {
  outputErrors(errors, format)
  process.exit(1)
}

/**
 * Format and output a single error message
 */
export function exitWithError(message: string, format: OutputFormat): never {
  exitWithErrors([message], format)
}

// ============================================================================
// SUCCESS OUTPUT
// ============================================================================

/**
 * Format success message for output
 */
export function formatSuccess(message: string, format: OutputFormat, id?: string): string {
  if (format === 'json') {
    return JSON.stringify({ success: true, ...(id && { id }) }, null, 2)
  }

  if (format === 'quiet') {
    return id || ''
  }

  return pc.green(`✓ ${message}`)
}

/**
 * Output success message to console
 */
export function outputSuccess(message: string, format: OutputFormat, id?: string): void {
  console.log(formatSuccess(message, format, id))
}

// ============================================================================
// WARNINGS OUTPUT
// ============================================================================

/**
 * Format warnings for text output
 */
export function formatWarnings(warnings: string[]): string {
  if (warnings.length === 0) return ''

  const lines: string[] = ['', pc.yellow('Warnings:')]
  for (const warning of warnings) {
    lines.push(pc.yellow(`  ⚠ ${warning}`))
  }
  return lines.join('\n')
}

/**
 * Output warnings to console (text format only)
 */
export function outputWarnings(warnings: string[], format: OutputFormat): void {
  if (format === 'text' && warnings.length > 0) {
    console.log(formatWarnings(warnings))
  }
}

// ============================================================================
// ERRORS TEXT OUTPUT (for inline formatting)
// ============================================================================

/**
 * Format errors for text output (used inline in result formatters)
 *
 * Unlike formatErrors() which handles all formats, this is specifically
 * for text-mode inline use in format result functions.
 */
export function formatErrorsText(errors: string[]): string {
  if (errors.length === 0) return ''

  const lines: string[] = [pc.red('Errors:')]
  for (const error of errors) {
    lines.push(pc.red(`  ✗ ${error}`))
  }
  return lines.join('\n')
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate content type
 */
export function validateContentType(value: string | undefined): value is ContentType {
  return value !== undefined && VALID_CONTENT_TYPES.includes(value as ContentType)
}

/**
 * Validate status
 */
export function validateStatus(value: string | undefined): value is Status {
  return value !== undefined && VALID_STATUSES.includes(value as Status)
}

/**
 * Validate automation level
 */
export function validateAutomationLevel(value: string | undefined): value is AutomationLevel {
  return value !== undefined && VALID_AUTOMATION_LEVELS.includes(value as AutomationLevel)
}

// ============================================================================
// TRY-CATCH WRAPPER
// ============================================================================

/**
 * Execute an async function with consistent error handling
 *
 * Usage:
 * ```
 * await withErrorHandling(format, async () => {
 *   // your code here
 * })
 * ```
 */
export async function withErrorHandling(
  format: OutputFormat,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    exitWithError(message, format)
  }
}
