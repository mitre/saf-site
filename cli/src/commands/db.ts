/**
 * Database Management Commands
 *
 * Commands for exporting, validating, and managing the database
 */

import { Command } from 'commander'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { execSync } from 'child_process'
import { getPocketBase, checkConnection, loadFkMaps } from '../lib/pocketbase.js'
import { auditSlug, validateSlug } from '@schema/validation.js'

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
    s.start('Checking Pocketbase connection...')

    const isConnected = await checkConnection()

    if (isConnected) {
      s.stop(pc.green('Pocketbase is running'))

      // Get collection stats
      const pb = await getPocketBase()
      const collections = [
        'content',
        'organizations',
        'standards',
        'technologies',
        'targets',
        'teams',
        'tags',
        'tools'
      ]

      console.log(pc.bold('\nCollection Statistics:'))
      console.log(pc.dim('─'.repeat(40)))

      for (const collection of collections) {
        try {
          const result = await pb.collection(collection).getList(1, 1)
          console.log(`${collection.padEnd(20)} ${pc.cyan(result.totalItems.toString())} records`)
        } catch {
          console.log(`${collection.padEnd(20)} ${pc.red('error')}`)
        }
      }
    } else {
      s.stop(pc.red('Pocketbase is not running'))
      console.log(pc.dim('\nStart with: cd .pocketbase && ./pocketbase serve'))
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
      s.stop(pc.green('Database exported to .pocketbase/pb_data/diffable/'))
    } catch (error) {
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

    const pb = await getPocketBase()
    const issues: string[] = []

    // Load FK maps
    const fkMaps = await loadFkMaps()
    s.stop('Database loaded')

    // Validate content records
    s.start('Validating content records...')
    const content = await pb.collection('content').getFullList()

    for (const record of content) {
      // Check required fields
      if (!record.name) {
        issues.push(`Content ${record.id}: missing name`)
      }
      if (!record.slug) {
        issues.push(`Content ${record.id}: missing slug`)
      }
      if (!record.content_type) {
        issues.push(`Content ${record.id}: missing content_type`)
      }

      // Check FK references exist
      if (record.target && !await recordExists(pb, 'targets', record.target)) {
        issues.push(`Content ${record.id}: invalid target reference "${record.target}"`)
      }
      if (record.standard && !await recordExists(pb, 'standards', record.standard)) {
        issues.push(`Content ${record.id}: invalid standard reference "${record.standard}"`)
      }
      if (record.technology && !await recordExists(pb, 'technologies', record.technology)) {
        issues.push(`Content ${record.id}: invalid technology reference "${record.technology}"`)
      }
      if (record.vendor && !await recordExists(pb, 'organizations', record.vendor)) {
        issues.push(`Content ${record.id}: invalid vendor reference "${record.vendor}"`)
      }
    }
    s.stop(`Validated ${content.length} content records`)

    // Validate tools
    s.start('Validating tools...')
    const tools = await pb.collection('tools').getFullList()
    for (const record of tools) {
      if (!record.name) {
        issues.push(`Tool ${record.id}: missing name`)
      }
      if (record.organization && !await recordExists(pb, 'organizations', record.organization)) {
        issues.push(`Tool ${record.id}: invalid organization reference`)
      }
    }
    s.stop(`Validated ${tools.length} tools`)

    // Report results
    if (issues.length === 0) {
      p.outro(pc.green('All validations passed'))
    } else {
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
    const fkMaps = await loadFkMaps()

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

    const pb = await getPocketBase()
    const content = await pb.collection('content').getFullList()

    s.stop(`Loaded ${content.length} content records`)

    let compliant = 0
    let warnings = 0
    let errors = 0

    console.log('')

    for (const record of content) {
      const audit = auditSlug(record.slug, record.name)

      if (audit.compliant) {
        compliant++
      } else {
        const hasErrors = audit.issues.some(i =>
          !i.startsWith('Use ') && !i.startsWith('Consider ') && !i.startsWith('Expected ')
        )

        if (hasErrors) {
          errors++
          console.log(pc.red(`✗ ${record.slug}`))
        } else {
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
    } else if (warnings > 0) {
      p.outro(pc.yellow('Audit passed with warnings'))
    } else {
      p.outro(pc.green('All slugs compliant'))
    }
  })

/**
 * Helper: Check if a record exists
 */
async function recordExists(
  pb: Awaited<ReturnType<typeof getPocketBase>>,
  collection: string,
  id: string
): Promise<boolean> {
  try {
    await pb.collection(collection).getOne(id)
    return true
  } catch {
    return false
  }
}
