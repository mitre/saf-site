/**
 * Fetch README content from GitHub and populate Pocketbase records
 *
 * Usage: npx tsx scripts/fetch-readmes.ts [--dry-run] [--limit N] [--force]
 *
 * This script:
 * 1. Queries all content records with GitHub URLs
 * 2. Constructs raw.githubusercontent.com URLs for README
 * 3. Handles monorepo URLs (e.g., /tree/branch/path/to/profile)
 * 4. Tries multiple README variants (README.md, README, README.rst)
 * 5. Tries multiple branches (main, master)
 * 6. Updates records with readme_url and readme_markdown
 */

import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com'
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123'

// README filename variants to try
const README_VARIANTS = ['README.md', 'README', 'README.rst', 'README.markdown', 'readme.md']

// Branches to try
const BRANCHES = ['main', 'master']

interface ContentRecord {
  id: string
  name: string
  slug: string
  github: string
  readme_url?: string
  readme_markdown?: string
}

interface ParsedGitHubUrl {
  owner: string
  repo: string
  branch?: string  // If specified in URL (e.g., /tree/master/...)
  path?: string    // Subdirectory path for monorepos
}

/**
 * Parse GitHub URL into components
 * Handles:
 * - Simple repo: https://github.com/mitre/redhat-enterprise-linux-8-stig-baseline
 * - Monorepo with path: https://github.com/vmware/dod-compliance-and-automation/tree/master/vsphere/6.7/...
 */
function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  // Match monorepo URL with /tree/branch/path
  const monorepoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/)
  if (monorepoMatch) {
    const [, owner, repo, branch, path] = monorepoMatch
    return { owner, repo, branch, path }
  }

  // Match simple repo URL
  const simpleMatch = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/)
  if (simpleMatch) {
    const [, owner, repo] = simpleMatch
    return { owner, repo: repo.replace(/\.git$/, '') }
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
        'User-Agent': 'saf-site-readme-fetcher'
      }
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Fetch README content, trying multiple branches and filenames
 */
async function fetchReadme(githubUrl: string): Promise<{ url: string; content: string; error?: string } | null> {
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
      } catch {
        // Continue to next variant
      }
    }
  }

  return { url: '', content: '', error: 'No README found in repo' }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')  // Re-fetch even if already populated
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined

  console.log(`🚀 README Fetch Script`)
  console.log(`   Pocketbase: ${POCKETBASE_URL}`)
  console.log(`   Dry run: ${dryRun}`)
  console.log(`   Force refresh: ${force}`)
  console.log(`   Limit: ${limit || 'none'}`)
  console.log('')

  // Connect to Pocketbase
  const pb = new PocketBase(POCKETBASE_URL)

  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Authenticated with Pocketbase\n')
  } catch (error) {
    console.error('❌ Failed to authenticate:', error)
    process.exit(1)
  }

  // Fetch content records with GitHub URLs
  const filter = force ? 'github != ""' : 'github != "" && readme_markdown = ""'
  let records: ContentRecord[]

  try {
    records = await pb.collection('content').getFullList<ContentRecord>({
      filter,
      fields: 'id,name,slug,github,readme_url,readme_markdown',
      sort: 'name'
    })
    console.log(`📋 Found ${records.length} records ${force ? 'total' : 'needing README fetch'}\n`)
  } catch (error) {
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
  let repoNotFound = 0
  let noReadme = 0
  let updateFailed = 0
  let skipped = 0
  const failures: { name: string; github: string; error: string }[] = []

  for (const record of records) {
    process.stdout.write(`📄 ${record.name.substring(0, 50).padEnd(50)} `)

    // Skip if no GitHub URL
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
      } else {
        console.log(`❌ ${error}`)
        noReadme++
      }
      failures.push({ name: record.name, github: record.github, error })
      continue
    }

    if (dryRun) {
      console.log(`✅ Would update (${result.content.length} chars)`)
      updated++
      continue
    }

    // Update record
    try {
      await pb.collection('content').update(record.id, {
        readme_url: result.url,
        readme_markdown: result.content
      })
      console.log(`✅ Updated (${result.content.length} chars)`)
      updated++
    } catch (error) {
      console.log(`❌ Update failed: ${error}`)
      updateFailed++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log('')
  console.log('━'.repeat(60))
  console.log(`📊 Summary:`)
  console.log(`   ✅ Updated:        ${updated}`)
  console.log(`   🚫 Repo not found: ${repoNotFound}`)
  console.log(`   ❌ No README:      ${noReadme}`)
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
  } else if (updated > 0) {
    console.log('💡 Run "pnpm db:export" to export changes to git')
  }
}

main().catch(console.error)
