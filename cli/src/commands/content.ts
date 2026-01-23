/**
 * Content Management Commands
 *
 * Commands for adding, updating, and listing content records
 */

import { Command } from 'commander'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import Table from 'cli-table3'
import { getPocketBase, loadFkMaps, resolveFK, type FkMaps } from '../lib/pocketbase.js'
import {
  parseGitHubUrl,
  fetchRepoInfo,
  fetchInspecYml,
  fetchReadme,
  generateSlug,
  extractControlCount
} from '../lib/github.js'

export const contentCommand = new Command('content')
  .description('Manage content records (profiles, hardening guides)')

/**
 * List content records
 */
contentCommand
  .command('list')
  .description('List content records')
  .option('-t, --type <type>', 'Filter by content type (validation|hardening)')
  .option('-l, --limit <number>', 'Limit results', '20')
  .action(async (options) => {
    const pb = await getPocketBase()

    let filter = ''
    if (options.type) {
      filter = `content_type = "${options.type}"`
    }

    const records = await pb.collection('content').getList(1, parseInt(options.limit), {
      filter,
      expand: 'target,standard,technology,vendor',
      sort: '-created'
    })

    const table = new Table({
      head: [
        pc.bold('ID'),
        pc.bold('Name'),
        pc.bold('Type'),
        pc.bold('Target'),
        pc.bold('Standard'),
        pc.bold('Version')
      ],
      colWidths: [18, 40, 12, 25, 15, 10]
    })

    for (const record of records.items) {
      table.push([
        record.id,
        record.name.substring(0, 38),
        record.content_type,
        record.expand?.target?.name?.substring(0, 23) || '-',
        record.expand?.standard?.short_name || '-',
        record.version || '-'
      ])
    }

    console.log(table.toString())
    console.log(pc.dim(`\nShowing ${records.items.length} of ${records.totalItems} records`))
  })

/**
 * Show content record details
 */
contentCommand
  .command('show <id>')
  .description('Show content record details')
  .action(async (id) => {
    const pb = await getPocketBase()

    const record = await pb.collection('content').getOne(id, {
      expand: 'target,standard,technology,vendor,maintainer'
    })

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
  })

/**
 * Add content from GitHub repository
 */
contentCommand
  .command('add')
  .description('Add content from a GitHub repository')
  .argument('[url]', 'GitHub repository URL')
  .action(async (urlArg) => {
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
    const contentType = await p.select({
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
    if (!target) process.exit(0)

    // Standard selection
    const standard = await selectOrCreate(fkMaps, 'standards', 'Compliance standard')
    if (!standard) process.exit(0)

    // Technology selection
    const technology = await selectOrCreate(fkMaps, 'technologies', 'Technology')
    if (!technology) process.exit(0)

    // Vendor selection
    const vendor = await selectOrCreate(fkMaps, 'organizations', 'Vendor/Organization')
    if (!vendor) process.exit(0)

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
        target,
        standard,
        technology,
        vendor,
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
  })

/**
 * Update content record
 */
contentCommand
  .command('update <id>')
  .description('Update a content record')
  .option('--name <name>', 'Update name')
  .option('--description <desc>', 'Update description')
  .option('--version <version>', 'Update version')
  .option('--status <status>', 'Update status (active|beta|deprecated|draft)')
  .option('--sync-readme', 'Sync README from GitHub')
  .action(async (id, options) => {
    const pb = await getPocketBase()

    // Build update data from options
    const updateData: Record<string, unknown> = {}

    if (options.name) updateData.name = options.name
    if (options.description) updateData.description = options.description
    if (options.version) updateData.version = options.version
    if (options.status) updateData.status = options.status

    // Sync README if requested
    if (options.syncReadme) {
      const record = await pb.collection('content').getOne(id)
      if (record.github) {
        const parsed = parseGitHubUrl(record.github)
        if (parsed) {
          const readme = await fetchReadme(parsed.owner, parsed.repo)
          if (readme) {
            updateData.readme_markdown = readme
            console.log(pc.dim('README synced from GitHub'))
          }
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      console.log(pc.yellow('No updates specified'))
      return
    }

    await pb.collection('content').update(id, updateData)
    console.log(pc.green(`Updated: ${id}`))
  })

/**
 * Helper: Select from existing FK options or create new
 */
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
    // For now, just prompt for the value - full creation would need more fields
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
