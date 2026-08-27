/**
 * Fetch README content from GitHub and populate Pocketbase records
 *
 * Usage: npx tsx scripts/fetch-readmes.ts [--dry-run] [--limit N] [--force] [--refs-only]
 *
 * This script:
 * 1. Queries all content records with GitHub URLs
 * 2. Constructs raw.githubusercontent.com URLs for README
 * 3. Handles monorepo URLs (e.g., /tree/branch/path/to/profile)
 * 4. Tries multiple README variants (README.md, README, README.rst)
 * 5. Tries multiple branches (main, master)
 * 6. Updates records with readme_url and readme_markdown
 * 7. Populates reference_url based on standard type (STIG, CIS, SRG, etc.)
 */

import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com'
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123'

// README filename variants to try
const README_VARIANTS = ['README.md', 'README', 'README.rst', 'README.markdown', 'readme.md']

// Branches to try
const BRANCHES = ['main', 'master']

// Reference URL patterns by standard type
const REFERENCE_URLS: Record<string, string> = {
  'STIG': 'https://public.cyber.mil/stigs/downloads/',
  'SRG': 'https://public.cyber.mil/stigs/downloads/?_dl_facet_stigs=all-srgs',
  'CIS': 'https://www.cisecurity.org/benchmark/{target}',
  'PCI-DSS': 'https://www.pcisecuritystandards.org/document_library',
}

// Monorepo URL with /tree/branch/path
const MONOREPO_URL_REGEX = /github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/
// Simple repo URL (optionally ending in .git or a trailing slash)
const SIMPLE_REPO_URL_REGEX = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/
const GIT_SUFFIX_REGEX = /\.git$/
// Target slug suffixes normalized away for CIS benchmark URLs
const CE_SUFFIX_REGEX = /-ce$/
const EE_SUFFIX_REGEX = /-ee$/
const ENTERPRISE_SUFFIX_REGEX = /-enterprise$/
const COMMUNITY_SUFFIX_REGEX = /-community$/

interface ContentRecord {
  id: string
  name: string
  slug: string
  github: string
  standard?: string
  reference_url?: string
  readme_url?: string
  readme_markdown?: string
  expand?: {
    standard?: { id: string, short_name: string }
    target?: { id: string, slug: string }
  }
}

interface ParsedGitHubUrl {
  owner: string
  repo: string
  branch?: string // If specified in URL (e.g., /tree/master/...)
  path?: string // Subdirectory path for monorepos
}

/**
 * Parse GitHub URL into components
 * Handles:
 * - Simple repo: https://github.com/mitre/redhat-enterprise-linux-8-stig-baseline
 * - Monorepo with path: https://github.com/vmware/dod-compliance-and-automation/tree/master/vsphere/6.7/...
 */
function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  // Match monorepo URL with /tree/branch/path
  const monorepoMatch = url.match(MONOREPO_URL_REGEX)
  if (monorepoMatch) {
    const [, owner, repo, branch, path] = monorepoMatch
    return { owner, repo, branch, path }
  }

  // Match simple repo URL
  const simpleMatch = url.match(SIMPLE_REPO_URL_REGEX)
  if (simpleMatch) {
    const [, owner, repo] = simpleMatch
    return { owner, repo: repo.replace(GIT_SUFFIX_REGEX, '') }
  }

  return null
}

/**
 * Build raw.githubusercontent.com URL
 */
function buildRawUrl(parsed: ParsedGitHubUrl, branch: string, filename: string): string {
  const basePath = parsed.path ? `${parsed.path}/` : ''
  return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${basePath}${filename}`
}

/**
 * Check if a GitHub repo exists using the API
 */
async function checkRepoExists(owner: string, repo: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'saf-site-readme-fetcher',
      },
    })
    return response.ok
  }
  catch {
    return false
  }
}

/**
 * Derive reference URL based on standard type and target
 */
function deriveReferenceUrl(record: ContentRecord): string | null {
  const standardShortName = record.expand?.standard?.short_name
  if (!standardShortName)
    return null

  const pattern = REFERENCE_URLS[standardShortName]
  if (!pattern)
    return null

  // For CIS, substitute the target slug
  if (standardShortName === 'CIS' && pattern.includes('{target}')) {
    const targetSlug = record.expand?.target?.slug
    if (targetSlug) {
      // Normalize target slug for CIS URL (e.g., "docker-ce" -> "docker")
      const normalizedTarget = targetSlug
        .replace(CE_SUFFIX_REGEX, '') // docker-ce -> docker
        .replace(EE_SUFFIX_REGEX, '') // docker-ee -> docker
        .replace(ENTERPRISE_SUFFIX_REGEX, '') // remove enterprise suffix
        .replace(COMMUNITY_SUFFIX_REGEX, '') // remove community suffix
        .split('-')[0] // take first part (e.g., "red-hat" -> "red")
      return pattern.replace('{target}', normalizedTarget)
    }
    return null
  }

  return pattern
}

/**
 * Fetch README content, trying multiple branches and filenames
 */
async function fetchReadme(githubUrl: string): Promise<{ url: string, content: string, error?: string } | null> {
  const parsed = parseGitHubUrl(githubUrl)
  if (!parsed) {
    return { url: '', content: '', error: 'Invalid GitHub URL format' }
  }

  // Check if repo exists first
  const exists = await checkRepoExists(parsed.owner, parsed.repo)
  if (!exists) {
    return { url: '', content: '', error: `Repo not found: ${parsed.owner}/${parsed.repo}` }
  }

  // Determine branches to try
  const branchesToTry = parsed.branch ? [parsed.branch, ...BRANCHES.filter(b => b !== parsed.branch)] : BRANCHES

  // Try each branch and filename combination
  for (const branch of branchesToTry) {
    for (const filename of README_VARIANTS) {
      const url = buildRawUrl(parsed, branch, filename)
      try {
        const response = await fetch(url)
        if (response.ok) {
          const content = await response.text()
          // Verify it's not a 404 page (some servers return 200 with error HTML)
          if (content.length > 50 && !content.includes('<!DOCTYPE') && !content.includes('404')) {
            return { url, content }
          }
        }
      }
      catch {
        // Continue to next variant
      }
    }
  }

  return { url: '', content: '', error: 'No README found in repo' }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force') // Re-fetch even if already populated
  const refsOnly = args.includes('--refs-only') // Only populate reference_url
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? Number.parseInt(args[limitIndex + 1], 10) : undefined

  console.log(`🚀 Content Population Script`)
  console.log(`   Pocketbase: ${POCKETBASE_URL}`)
  console.log(`   Dry run: ${dryRun}`)
  console.log(`   Force refresh: ${force}`)
  console.log(`   Refs only: ${refsOnly}`)
  console.log(`   Limit: ${limit || 'none'}`)
  console.log('')

  // Connect to Pocketbase
  const pb = new PocketBase(POCKETBASE_URL)

  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Authenticated with Pocketbase\n')
  }
  catch (error) {
    console.error('❌ Failed to authenticate:', error)
    process.exit(1)
  }

  // Build filter based on mode
  let filter: string
  if (refsOnly) {
    filter = force ? 'standard != ""' : 'standard != "" && reference_url = ""'
  }
  else {
    filter = force ? 'github != ""' : 'github != "" && readme_markdown = ""'
  }

  let records: ContentRecord[]

  try {
    records = await pb.collection('content').getFullList<ContentRecord>({
      filter,
      expand: 'standard,target',
      sort: 'name',
    })
    console.log(`📋 Found ${records.length} records ${force ? 'total' : 'needing updates'}\n`)
  }
  catch (error) {
    console.error('❌ Failed to fetch records:', error)
    process.exit(1)
  }

  // Apply limit if specified
  if (limit && limit < records.length) {
    records = records.slice(0, limit)
    console.log(`   (Limited to first ${limit} records)\n`)
  }

  // Track different failure types
  let updated = 0
  let refsUpdated = 0
  let repoNotFound = 0
  let noReadme = 0
  let updateFailed = 0
  let skipped = 0
  const failures: { name: string, github: string, error: string }[] = []

  for (const record of records) {
    process.stdout.write(`📄 ${record.name.substring(0, 50).padEnd(50)} `)

    // Refs-only mode: just populate reference_url
    if (refsOnly) {
      const refUrl = deriveReferenceUrl(record)
      if (!refUrl) {
        console.log('⏭️  No reference URL pattern')
        skipped++
        continue
      }

      if (dryRun) {
        console.log(`✅ Would set ref: ${refUrl}`)
        refsUpdated++
        continue
      }

      try {
        await pb.collection('content').update(record.id, { reference_url: refUrl })
        console.log(`✅ Set ref: ${refUrl}`)
        refsUpdated++
      }
      catch (error) {
        console.log(`❌ Update failed: ${error}`)
        updateFailed++
      }
      continue
    }

    // Full mode: fetch README and also set reference_url if missing
    if (!record.github) {
      console.log('⏭️  No GitHub URL')
      skipped++
      continue
    }

    // Fetch README
    const result = await fetchReadme(record.github)

    if (!result || result.error) {
      const error = result?.error || 'Unknown error'
      if (error.includes('not found')) {
        console.log(`🚫 ${error}`)
        repoNotFound++
      }
      else {
        console.log(`❌ ${error}`)
        noReadme++
      }
      failures.push({ name: record.name, github: record.github, error })
      continue
    }

    // Build update payload
    const updateData: Record<string, string> = {
      readme_url: result.url,
      readme_markdown: result.content,
    }

    // Also set reference_url if not already set
    if (!record.reference_url) {
      const refUrl = deriveReferenceUrl(record)
      if (refUrl) {
        updateData.reference_url = refUrl
      }
    }

    if (dryRun) {
      const refNote = updateData.reference_url ? ` + ref` : ''
      console.log(`✅ Would update (${result.content.length} chars${refNote})`)
      updated++
      continue
    }

    // Update record
    try {
      await pb.collection('content').update(record.id, updateData)
      const refNote = updateData.reference_url ? ` + ref` : ''
      console.log(`✅ Updated (${result.content.length} chars${refNote})`)
      updated++
    }
    catch (error) {
      console.log(`❌ Update failed: ${error}`)
      updateFailed++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log('')
  console.log('━'.repeat(60))
  console.log(`📊 Summary:`)
  if (refsOnly) {
    console.log(`   ✅ Refs updated:   ${refsUpdated}`)
  }
  else {
    console.log(`   ✅ Updated:        ${updated}`)
    console.log(`   🚫 Repo not found: ${repoNotFound}`)
    console.log(`   ❌ No README:      ${noReadme}`)
  }
  console.log(`   💥 Update failed:  ${updateFailed}`)
  console.log(`   ⏭️  Skipped:        ${skipped}`)
  console.log('')

  // Show failures summary
  if (failures.length > 0) {
    console.log('📋 Failed records:')
    for (const f of failures) {
      console.log(`   - ${f.name}`)
      console.log(`     ${f.github}`)
      console.log(`     Error: ${f.error}`)
    }
    console.log('')
  }

  if (dryRun) {
    console.log('💡 Run without --dry-run to apply changes')
  }
  else if (updated > 0) {
    console.log('💡 Run "pnpm db:export" to export changes to git')
  }
}

main().catch(console.error)
