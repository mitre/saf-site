/**
 * Database Management Commands
 *
 * Commands for exporting, validating, and managing the database.
 * Uses Drizzle ORM for direct SQLite access (no server required).
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as p from '@clack/prompts'
import { auditSlug } from '@schema/validation.js'
import { Command } from 'commander'
import pc from 'picocolors'
import {
  getDefaultDbPath,
  getDrizzle,
  getRecord,
  getTableNames,
  listRecords,
  loadFkMaps,
} from '../lib/drizzle.js'

export const dbCommand = new Command('db')
  .description('Database management commands')

/**
 * Check database connection
 */
dbCommand
  .command('status')
  .description('Check database connection and status')
  .action(async () => {
    const s = p.spinner()
    s.start('Checking database...')

    const dbPath = getDefaultDbPath()
    const dbExists = existsSync(dbPath)

    if (dbExists) {
      s.stop(pc.green('Database found'))
      console.log(pc.dim(`  Path: ${dbPath}`))

      // Get collection stats
      const db = getDrizzle(dbPath)
      const collections = [
        'content',
        'organizations',
        'standards',
        'technologies',
        'targets',
        'teams',
        'tags',
        'tools',
      ]

      console.log(pc.bold('\nTable Statistics:'))
      console.log(pc.dim('─'.repeat(40)))

      for (const collection of collections) {
        try {
          const records = listRecords(db, collection)
          console.log(`${collection.padEnd(20)} ${pc.cyan(records.length.toString())} records`)
        }
        catch {
          console.log(`${collection.padEnd(20)} ${pc.red('error')}`)
        }
      }

      // Show all available tables
      const allTables = getTableNames()
      console.log(pc.dim(`\n${allTables.length} tables in schema`))
    }
    else {
      s.stop(pc.red('Database not found'))
      console.log(pc.dim(`  Expected: ${dbPath}`))
      console.log(pc.dim('\nRun: pnpm dev:setup'))
    }
  })

/**
 * Export database to diffable format
 */
dbCommand
  .command('export')
  .description('Export database to git-trackable format')
  .action(async () => {
    const s = p.spinner()
    s.start('Exporting database...')

    try {
      execSync('pnpm db:export', { stdio: 'pipe' })
      s.stop(pc.green('Database exported to docs/.vitepress/database/diffable/'))
    }
    catch (error) {
      s.stop(pc.red('Export failed'))
      if (error instanceof Error) {
        console.error(pc.dim(error.message))
      }
    }
  })

/**
 * Validate database integrity
 */
dbCommand
  .command('validate')
  .description('Validate database integrity and FK references')
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(' Database Validation ')))

    const s = p.spinner()
    s.start('Loading database...')

    const db = getDrizzle(getDefaultDbPath())
    const issues: string[] = []

    // Load FK maps (available for future validation logic)
    const _fkMaps = loadFkMaps(db)
    s.stop('Database loaded')

    // Validate content records
    s.start('Validating content records...')
    const content = listRecords(db, 'content')

    for (const record of content) {
      // Check required fields
      if (!record.name) {
        issues.push(`Content ${record.id}: missing name`)
      }
      if (!record.slug) {
        issues.push(`Content ${record.id}: missing slug`)
      }
      if (!record.contentType) {
        issues.push(`Content ${record.id}: missing contentType`)
      }

      // Check FK references exist
      const fkValidations = [
        validateFK(db, record.id as string, record.target as string | undefined, 'targets', 'target'),
        validateFK(db, record.id as string, record.standard as string | undefined, 'standards', 'standard'),
        validateFK(db, record.id as string, record.technology as string | undefined, 'technologies', 'technology'),
        validateFK(db, record.id as string, record.vendor as string | undefined, 'organizations', 'vendor'),
      ]

      // Collect any validation errors
      for (const error of fkValidations) {
        if (error)
          issues.push(error)
      }
    }
    s.stop(`Validated ${content.length} content records`)

    // Validate tools
    s.start('Validating tools...')
    const tools = listRecords(db, 'tools')
    for (const record of tools) {
      if (!record.name) {
        issues.push(`Tool ${record.id}: missing name`)
      }
      if (record.organization && !recordExists(db, 'organizations', record.organization as string)) {
        issues.push(`Tool ${record.id}: invalid organization reference`)
      }
    }
    s.stop(`Validated ${tools.length} tools`)

    // Report results
    if (issues.length === 0) {
      p.outro(pc.green('All validations passed'))
    }
    else {
      console.log(pc.bold(pc.red(`\nFound ${issues.length} issues:\n`)))
      for (const issue of issues) {
        console.log(pc.yellow(`  • ${issue}`))
      }
      p.outro(pc.red('Validation failed'))
      process.exit(1)
    }
  })

/**
 * Show FK lookup values
 */
dbCommand
  .command('lookups')
  .description('Show available FK lookup values')
  .argument('[collection]', 'Collection to show (organizations, standards, etc.)')
  .action(async (collection) => {
    const db = getDrizzle(getDefaultDbPath())
    const fkMaps = loadFkMaps(db)

    const collections = collection
      ? [collection as keyof typeof fkMaps]
      : Object.keys(fkMaps) as Array<keyof typeof fkMaps>

    for (const col of collections) {
      const map = fkMaps[col]
      if (!map) {
        console.log(pc.red(`Unknown collection: ${col}`))
        continue
      }

      console.log(pc.bold(`\n${col}:`))
      console.log(pc.dim('─'.repeat(40)))

      const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      for (const [name, id] of entries) {
        console.log(`  ${name.padEnd(35)} ${pc.dim(id)}`)
      }
    }
  })

/**
 * Audit content slugs for convention compliance
 */
dbCommand
  .command('audit')
  .description('Audit content slugs for naming convention compliance')
  .option('--fix', 'Show suggested fixes for non-compliant slugs')
  .action(async (options) => {
    p.intro(pc.bgCyan(pc.black(' Slug Convention Audit ')))

    const s = p.spinner()
    s.start('Loading content records...')

    const db = getDrizzle(getDefaultDbPath())
    const content = listRecords(db, 'content')

    s.stop(`Loaded ${content.length} content records`)

    let compliant = 0
    let warnings = 0
    let errors = 0

    console.log('')

    for (const record of content) {
      const audit = auditSlug(record.slug, record.name)

      if (audit.compliant) {
        compliant++
      }
      else {
        const hasErrors = audit.issues.some(i =>
          !i.startsWith('Use ') && !i.startsWith('Consider ') && !i.startsWith('Expected '),
        )

        if (hasErrors) {
          errors++
          console.log(pc.red(`✗ ${record.slug}`))
        }
        else {
          warnings++
          console.log(pc.yellow(`⚠ ${record.slug}`))
        }

        console.log(pc.dim(`  Name: ${record.name}`))
        for (const issue of audit.issues) {
          console.log(pc.dim(`  → ${issue}`))
        }

        if (options.fix && audit.suggestedSlug) {
          console.log(pc.green(`  Suggested: ${audit.suggestedSlug}`))
        }

        console.log('')
      }
    }

    // Summary
    console.log(pc.bold('\nSummary:'))
    console.log(pc.dim('─'.repeat(40)))
    console.log(`${pc.green('Compliant:')} ${compliant}`)
    console.log(`${pc.yellow('Warnings:')} ${warnings}`)
    console.log(`${pc.red('Errors:')} ${errors}`)

    if (errors > 0) {
      p.outro(pc.red('Audit found errors'))
      process.exit(1)
    }
    else if (warnings > 0) {
      p.outro(pc.yellow('Audit passed with warnings'))
    }
    else {
      p.outro(pc.green('All slugs compliant'))
    }
  })

/**
 * Helper: Check if a record exists
 */
function recordExists(
  db: ReturnType<typeof getDrizzle>,
  collection: string,
  id: string,
): boolean {
  const record = getRecord(db, collection, id)
  return record !== null
}

/**
 * Helper: Validate a FK reference and return an error message if invalid
 */
function validateFK(
  db: ReturnType<typeof getDrizzle>,
  recordId: string,
  fkValue: string | undefined | null,
  collection: string,
  fieldName: string,
): string | null {
  if (!fkValue)
    return null
  if (!recordExists(db, collection, fkValue)) {
    return `Content ${recordId}: invalid ${fieldName} reference "${fkValue}"`
  }
  return null
}
