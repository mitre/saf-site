/**
 * Content Management Commands
 *
 * Commands for adding, updating, and listing content records.
 * Supports both non-interactive (CI/scripting) and interactive (TUI) modes.
 */

import { Command } from 'commander'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import {
  getPocketBase,
  loadFkMaps,
  createContent,
  updateContent,
  listContent,
  getContentBySlug,
  type FkMaps
} from '../lib/pocketbase.js'
import {
  parseGitHubUrl,
  fetchRepoInfo,
  fetchInspecYml,
  fetchReadme,
  generateSlug,
  extractControlCount
} from '../lib/github.js'
import {
  prepareContentAdd,
  prepareContentUpdate,
  type ServiceDeps
} from './content.logic.js'
import {
  parseAddArgs,
  parseUpdateArgs,
  formatAddResult,
  formatUpdateResult,
  formatListResult,
  type OutputFormat
} from './content.cli.js'

export const contentCommand = new Command('content')
  .description('Manage content records (profiles, hardening guides)')

// ============================================================================
// SERVICE DEPENDENCIES (for logic layer)
// ============================================================================

const serviceDeps: ServiceDeps = {
  parseGitHubUrl,
  fetchRepoInfo,
  fetchInspecYml,
  fetchReadme
}

// ============================================================================
// LIST COMMAND
// ============================================================================

contentCommand
  .command('list')
  .description('List content records')
  .option('-t, --type <type>', 'Filter by content type (validation|hardening)')
  .option('-s, --status <status>', 'Filter by status (active|beta|deprecated|draft)')
  .option('-l, --limit <number>', 'Limit results', '50')
  .option('--json', 'Output as JSON')
  .option('--quiet', 'Output only IDs')
  .action(async (options) => {
    try {
      const pb = await getPocketBase()

      const records = await listContent({
        contentType: options.type,
        status: options.status,
        expand: ['target', 'standard', 'technology', 'vendor'],
        sort: '-created'
      }, pb)

      // Limit results
      const limited = records.slice(0, parseInt(options.limit))

      // Determine output format
      const format: OutputFormat = options.json ? 'json' : options.quiet ? 'quiet' : 'text'

      console.log(formatListResult(limited, format))

      if (format === 'text') {
        console.log(pc.dim(`\nShowing ${limited.length} of ${records.length} records`))
      }
    } catch (error) {
      console.error(pc.red(error instanceof Error ? error.message : 'Failed to list content'))
      process.exit(1)
    }
  })

// ============================================================================
// SHOW COMMAND
// ============================================================================

contentCommand
  .command('show <id>')
  .description('Show content record details')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    try {
      const pb = await getPocketBase()

      const record = await pb.collection('content').getOne(id, {
        expand: 'target,standard,technology,vendor,maintainer'
      })

      if (options.json) {
        console.log(JSON.stringify(record, null, 2))
        return
      }

      console.log(pc.bold('\n' + record.name))
      console.log(pc.dim('─'.repeat(60)))

      const details = [
        ['ID', record.id],
        ['Slug', record.slug],
        ['Type', record.content_type],
        ['Status', record.status],
        ['Version', record.version || '-'],
        ['Target', record.expand?.target?.name || '-'],
        ['Standard', record.expand?.standard?.name || '-'],
        ['Technology', record.expand?.technology?.name || '-'],
        ['Vendor', record.expand?.vendor?.name || '-'],
        ['Maintainer', record.expand?.maintainer?.name || '-'],
        ['Controls', record.control_count || '-'],
        ['GitHub', record.github || '-'],
        ['License', record.license || '-']
      ]

      for (const [key, value] of details) {
        console.log(`${pc.cyan(key.padEnd(12))} ${value}`)
      }

      if (record.description) {
        console.log(pc.dim('\n' + record.description))
      }
    } catch (error) {
      console.error(pc.red(error instanceof Error ? error.message : 'Failed to show content'))
      process.exit(1)
    }
  })

// ============================================================================
// ADD COMMAND (Non-interactive + TUI)
// ============================================================================

contentCommand
  .command('add')
  .description('Add content from a GitHub repository')
  .argument('[url]', 'GitHub repository URL')
  .option('-t, --type <type>', 'Content type (validation|hardening)')
  .option('--vendor <name>', 'Vendor/organization name')
  .option('--standard <name>', 'Compliance standard name')
  .option('--technology <name>', 'Technology name')
  .option('--target <name>', 'Target platform name')
  .option('--maintainer <name>', 'Maintainer team name')
  .option('--name <name>', 'Override content name')
  .option('--slug <slug>', 'Override slug')
  .option('--version <version>', 'Override version')
  .option('--status <status>', 'Status (active|beta|deprecated|draft)')
  .option('--control-count <count>', 'Override control count')
  .option('--automation-level <level>', 'Automation level (full|partial|manual)')
  .option('-y, --yes', 'Skip confirmation (non-interactive)')
  .option('--json', 'Output as JSON')
  .option('--quiet', 'Output only slug on success')
  .option('--dry-run', 'Validate without creating')
  .action(async (urlArg, options) => {
    // Determine if we can run non-interactively
    const hasRequiredArgs = urlArg && options.type
    const isNonInteractive = options.yes || options.json || options.quiet

    if (hasRequiredArgs && isNonInteractive) {
      await addNonInteractive(urlArg, options)
    } else {
      await addInteractive(urlArg, options)
    }
  })

/**
 * Non-interactive add command
 */
async function addNonInteractive(url: string, options: Record<string, any>) {
  const format: OutputFormat = options.json ? 'json' : options.quiet ? 'quiet' : 'text'

  // Parse arguments
  const args = parseAddArgs({
    url,
    type: options.type,
    vendor: options.vendor,
    standard: options.standard,
    technology: options.technology,
    target: options.target,
    maintainer: options.maintainer,
    name: options.name,
    slug: options.slug,
    version: options.version,
    status: options.status,
    controlCount: options.controlCount,
    automationLevel: options.automationLevel
  })

  if (args.errors.length > 0) {
    if (format === 'json') {
      console.log(JSON.stringify({ success: false, errors: args.errors }, null, 2))
    } else if (format !== 'quiet') {
      console.error(pc.red('Errors:'))
      for (const error of args.errors) {
        console.error(pc.red(`  ✗ ${error}`))
      }
    }
    process.exit(1)
  }

  // Load FK maps for resolution
  const fkMaps = await loadFkMaps()

  // Prepare content
  const result = await prepareContentAdd(args, fkMaps, serviceDeps)

  // Handle dry-run
  if (options.dryRun) {
    console.log(formatAddResult(result, format))
    process.exit(result.success ? 0 : 1)
  }

  // Output result
  console.log(formatAddResult(result, format))

  if (!result.success) {
    process.exit(1)
  }

  // Create the record
  try {
    const pb = await getPocketBase()
    const record = await createContent(result.content!, pb)

    if (format === 'json') {
      console.log(JSON.stringify({ success: true, id: record.id, slug: record.slug }, null, 2))
    } else if (format === 'quiet') {
      console.log(record.slug)
    } else {
      console.log(pc.green(`\n✓ Created: ${record.id}`))
    }
  } catch (error) {
    if (format === 'json') {
      console.log(JSON.stringify({ success: false, errors: [String(error)] }, null, 2))
    } else {
      console.error(pc.red(`Failed to create: ${error}`))
    }
    process.exit(1)
  }
}

/**
 * Interactive add command (TUI)
 */
async function addInteractive(urlArg: string | undefined, options: Record<string, any>) {
  p.intro(pc.bgCyan(pc.black(' Add Content ')))

  // Get GitHub URL
  let githubUrl = urlArg
  if (!githubUrl) {
    const result = await p.text({
      message: 'Enter GitHub repository URL:',
      placeholder: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
      validate: (value) => {
        if (!value) return 'URL is required'
        if (!parseGitHubUrl(value)) return 'Invalid GitHub URL'
      }
    })

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled')
      process.exit(0)
    }
    githubUrl = result
  }

  const parsed = parseGitHubUrl(githubUrl)
  if (!parsed) {
    p.cancel('Invalid GitHub URL')
    process.exit(1)
  }

  // Fetch repository info
  const s = p.spinner()
  s.start('Fetching repository metadata...')

  let repoInfo
  let inspecProfile
  let readme

  try {
    repoInfo = await fetchRepoInfo(parsed.owner, parsed.repo)
    inspecProfile = await fetchInspecYml(parsed.owner, parsed.repo, repoInfo.defaultBranch)
    readme = await fetchReadme(parsed.owner, parsed.repo, repoInfo.defaultBranch)
    s.stop('Repository metadata fetched')
  } catch (error) {
    s.stop('Failed to fetch repository')
    p.cancel(error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }

  // Load FK maps for lookups
  s.start('Loading database lookups...')
  const fkMaps = await loadFkMaps()
  s.stop('Database lookups loaded')

  // Display fetched info
  p.note(
    [
      `${pc.bold('Repository:')} ${repoInfo.fullName}`,
      `${pc.bold('Description:')} ${repoInfo.description || 'N/A'}`,
      `${pc.bold('License:')} ${repoInfo.license || 'N/A'}`,
      inspecProfile ? `${pc.bold('InSpec Version:')} ${inspecProfile.version || 'N/A'}` : '',
      inspecProfile ? `${pc.bold('Profile Name:')} ${inspecProfile.name}` : ''
    ].filter(Boolean).join('\n'),
    'Fetched Info'
  )

  // Determine content type
  const contentType = options.type || await p.select({
    message: 'Content type:',
    options: [
      { value: 'validation', label: 'Validation (InSpec profile)' },
      { value: 'hardening', label: 'Hardening (Ansible, Chef, etc.)' }
    ],
    initialValue: 'validation'
  })

  if (p.isCancel(contentType)) {
    p.cancel('Operation cancelled')
    process.exit(0)
  }

  // Generate defaults from repo info
  const defaultName = inspecProfile?.title || repoInfo.description || parsed.repo
  const defaultSlug = generateSlug(parsed.repo)
  const defaultVersion = inspecProfile?.version || null

  // Collect record details
  const name = await p.text({
    message: 'Name:',
    initialValue: defaultName,
    validate: (v) => !v ? 'Name is required' : undefined
  })
  if (p.isCancel(name)) process.exit(0)

  const slug = await p.text({
    message: 'Slug (URL-friendly):',
    initialValue: defaultSlug,
    validate: (v) => !v ? 'Slug is required' : undefined
  })
  if (p.isCancel(slug)) process.exit(0)

  const description = await p.text({
    message: 'Description:',
    initialValue: repoInfo.description || inspecProfile?.summary || ''
  })
  if (p.isCancel(description)) process.exit(0)

  const version = await p.text({
    message: 'Version:',
    initialValue: defaultVersion || '',
    placeholder: 'e.g., 2.4.0'
  })
  if (p.isCancel(version)) process.exit(0)

  // Target selection
  const target = await selectOrCreate(fkMaps, 'targets', 'Target platform')
  if (target === null) process.exit(0)

  // Standard selection
  const standard = await selectOrCreate(fkMaps, 'standards', 'Compliance standard')
  if (standard === null) process.exit(0)

  // Technology selection
  const technology = await selectOrCreate(fkMaps, 'technologies', 'Technology')
  if (technology === null) process.exit(0)

  // Vendor selection
  const vendor = await selectOrCreate(fkMaps, 'organizations', 'Vendor/Organization')
  if (vendor === null) process.exit(0)

  // Control count
  let controlCount = readme ? extractControlCount(readme) : null
  const controlCountInput = await p.text({
    message: 'Control count:',
    initialValue: controlCount?.toString() || '',
    placeholder: 'Number of controls/checks'
  })
  if (p.isCancel(controlCountInput)) process.exit(0)
  controlCount = controlCountInput ? parseInt(controlCountInput, 10) : null

  // Confirm and create
  const shouldCreate = await p.confirm({
    message: 'Create this content record?'
  })

  if (p.isCancel(shouldCreate) || !shouldCreate) {
    p.cancel('Operation cancelled')
    process.exit(0)
  }

  // Create the record
  s.start('Creating content record...')

  try {
    const pb = await getPocketBase()
    const record = await pb.collection('content').create({
      name,
      slug,
      description,
      content_type: contentType,
      status: 'active',
      version: version || null,
      target: target || undefined,
      standard: standard || undefined,
      technology: technology || undefined,
      vendor: vendor || undefined,
      control_count: controlCount,
      github: repoInfo.htmlUrl,
      readme_url: `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${repoInfo.defaultBranch}/README.md`,
      readme_markdown: readme,
      license: repoInfo.license || inspecProfile?.license
    })

    s.stop('Content record created')
    p.outro(pc.green(`Created: ${record.id}`))
  } catch (error) {
    s.stop('Failed to create record')
    console.error(pc.red(error instanceof Error ? error.message : 'Unknown error'))
    process.exit(1)
  }
}

// ============================================================================
// UPDATE COMMAND
// ============================================================================

contentCommand
  .command('update <id>')
  .description('Update a content record')
  .option('--name <name>', 'Update name')
  .option('--description <desc>', 'Update description')
  .option('--version <version>', 'Update version')
  .option('--status <status>', 'Update status (active|beta|deprecated|draft)')
  .option('--control-count <count>', 'Update control count')
  .option('--sync-readme', 'Sync README from GitHub')
  .option('-y, --yes', 'Skip confirmation')
  .option('--json', 'Output as JSON')
  .option('--quiet', 'Output only ID on success')
  .option('--dry-run', 'Show changes without applying')
  .action(async (id, options) => {
    const format: OutputFormat = options.json ? 'json' : options.quiet ? 'quiet' : 'text'

    try {
      const pb = await getPocketBase()

      // Get existing record
      const existing = await pb.collection('content').getOne(id)

      // Parse update args
      const args = parseUpdateArgs({
        id,
        name: options.name,
        description: options.description,
        version: options.version,
        status: options.status,
        controlCount: options.controlCount,
        syncReadme: options.syncReadme
      })

      // Handle sync-readme
      if (options.syncReadme && existing.github) {
        const parsed = parseGitHubUrl(existing.github)
        if (parsed) {
          const readme = await fetchReadme(parsed.owner, parsed.repo)
          if (readme) {
            if (!args.updates) args.updates = {}
            args.updates.readmeMarkdown = readme
            if (format === 'text') {
              console.log(pc.dim('README synced from GitHub'))
            }
          }
        }
      }

      // Check for errors (but not "no updates" if we have sync-readme)
      const realErrors = args.errors.filter(e => e !== 'No updates specified')
      if (realErrors.length > 0) {
        if (format === 'json') {
          console.log(JSON.stringify({ success: false, errors: realErrors }, null, 2))
        } else if (format !== 'quiet') {
          console.error(pc.red('Errors:'))
          for (const error of realErrors) {
            console.error(pc.red(`  ✗ ${error}`))
          }
        }
        process.exit(1)
      }

      // Prepare update
      const result = prepareContentUpdate(existing, { updates: args.updates || {} })

      // Handle dry-run
      if (options.dryRun) {
        console.log(formatUpdateResult(result, id, format))
        process.exit(result.success ? 0 : 1)
      }

      // Check if any changes
      if (!result.hasChanges && !options.syncReadme) {
        if (format === 'json') {
          console.log(JSON.stringify({ success: true, id, hasChanges: false }, null, 2))
        } else if (format !== 'quiet') {
          console.log(pc.yellow('No changes to apply'))
        }
        process.exit(0)
      }

      // Show changes and confirm (unless --yes)
      if (!options.yes && format === 'text' && result.hasChanges) {
        console.log(formatUpdateResult(result, id, format))
        const confirm = await p.confirm({
          message: 'Apply these changes?'
        })
        if (p.isCancel(confirm) || !confirm) {
          p.cancel('Operation cancelled')
          process.exit(0)
        }
      }

      // Apply update
      const updated = await updateContent(id, result.updates || {}, pb)

      if (format === 'json') {
        console.log(JSON.stringify({ success: true, id: updated.id, hasChanges: true }, null, 2))
      } else if (format === 'quiet') {
        console.log(id)
      } else {
        console.log(pc.green(`✓ Updated: ${id}`))
      }
    } catch (error) {
      if (format === 'json') {
        console.log(JSON.stringify({ success: false, errors: [String(error)] }, null, 2))
      } else {
        console.error(pc.red(`Failed to update: ${error}`))
      }
      process.exit(1)
    }
  })

// ============================================================================
// HELPER: Select from FK options or create new
// ============================================================================

async function selectOrCreate(
  fkMaps: FkMaps,
  collection: keyof FkMaps,
  label: string
): Promise<string | null> {
  const map = fkMaps[collection]
  const options = Array.from(map.entries()).map(([name, id]) => ({
    value: id,
    label: name
  }))

  options.sort((a, b) => a.label.localeCompare(b.label))
  options.unshift({ value: '__skip__', label: '(Skip - leave empty)' })
  options.push({ value: '__new__', label: '+ Create new...' })

  const selected = await p.select({
    message: `${label}:`,
    options
  })

  if (p.isCancel(selected)) return null
  if (selected === '__skip__') return ''
  if (selected === '__new__') {
    const newName = await p.text({
      message: `Enter new ${label.toLowerCase()} name:`,
      validate: (v) => !v ? 'Name is required' : undefined
    })

    if (p.isCancel(newName)) return null

    console.log(pc.yellow(`Note: Create "${newName}" in Pocketbase Admin UI, then re-run this command`))
    return null
  }

  return selected as string
}
