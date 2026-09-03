/**
 * GitHub API Helpers
 *
 * Fetches repository metadata, README, and inspec.yml for profiles
 */

import { parse as parseYaml } from 'yaml'

export interface RepoInfo {
  owner: string
  repo: string
  fullName: string
  description: string | null
  defaultBranch: string
  license: string | null
  topics: string[]
  htmlUrl: string
}

export interface ReleaseInfo {
  tagName: string
  publishedAt: string | null
  htmlUrl: string
}

export interface OrgRepo {
  name: string
  htmlUrl: string
  description: string | null
  pushedAt: string | null
}

export interface InspecProfile {
  name: string
  title?: string
  maintainer?: string
  copyright?: string
  license?: string
  summary?: string
  version?: string
  supports?: Array<{ 'platform'?: string, 'platform-name'?: string, 'release'?: string }>
  depends?: Array<{ name: string, url?: string, branch?: string }>
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Build headers for GitHub API requests
 *
 * Handles authentication via GITHUB_TOKEN env var and sets required headers.
 */
function getGitHubHeaders(acceptType = 'application/vnd.github.v3+json'): HeadersInit {
  const token = process.env.GITHUB_TOKEN
  const headers: HeadersInit = {
    'Accept': acceptType,
    'User-Agent': 'saf-site-cli',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

// ============================================================================
// URL PARSING
// ============================================================================

/**
 * Parse GitHub URL to extract owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string, repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/,
    /^([^/]+)\/([^/]+)$/, // shorthand: owner/repo
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
    }
  }

  return null
}

/**
 * Fetch repository metadata from GitHub API
 */
export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const headers = getGitHubHeaders()
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  return {
    owner,
    repo,
    fullName: data.full_name,
    description: data.description,
    defaultBranch: data.default_branch,
    license: data.license?.spdx_id || null,
    topics: data.topics || [],
    htmlUrl: data.html_url,
  }
}

/**
 * Fetch a GitHub API endpoint and parse the JSON body.
 *
 * A 404 returns null (caller decides what "missing" means); any other
 * failure throws in the same format as fetchRepoInfo.
 */
async function fetchGitHubJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers: getGitHubHeaders() })

  if (response.ok) {
    return await response.json() as T
  }

  if (response.status === 404) {
    return null
  }

  throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
}

/**
 * Fetch the latest published release of a repository
 *
 * Returns null when the repo has no releases (repos that tag without
 * publishing releases should fall back to fetchLatestTag).
 */
export async function fetchLatestRelease(owner: string, repo: string): Promise<ReleaseInfo | null> {
  const data = await fetchGitHubJson<{ tag_name: string, published_at: string | null, html_url: string }>(
    `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
  )

  if (!data) {
    return null
  }

  return {
    tagName: data.tag_name,
    publishedAt: data.published_at,
    htmlUrl: data.html_url,
  }
}

/**
 * Fetch the most recent tag of a repository
 *
 * Fallback for repos that tag versions but never publish GitHub releases.
 * Returns null when the repo has no tags.
 */
export async function fetchLatestTag(owner: string, repo: string): Promise<{ tagName: string } | null> {
  const data = await fetchGitHubJson<Array<{ name: string }>>(
    `https://api.github.com/repos/${owner}/${repo}/tags?per_page=1`,
  )

  if (!data || data.length === 0) {
    return null
  }

  return { tagName: data[0].name }
}

/**
 * List all non-archived repositories of an organization
 *
 * Follows pagination until a short page (GitHub caps per_page at 100).
 */
export async function listOrgRepos(org: string): Promise<OrgRepo[]> {
  const perPage = 100
  const repos: OrgRepo[] = []

  for (let page = 1; ; page++) {
    const data = await fetchGitHubJson<Array<{
      name: string
      html_url: string
      description: string | null
      pushed_at: string | null
      archived: boolean
    }>>(`https://api.github.com/orgs/${org}/repos?per_page=${perPage}&page=${page}`)

    if (!data) {
      throw new Error(`GitHub API error: 404 organization ${org} not found`)
    }

    repos.push(...data
      .filter(r => !r.archived)
      .map(r => ({
        name: r.name,
        htmlUrl: r.html_url,
        description: r.description,
        pushedAt: r.pushed_at,
      })))

    if (data.length < perPage) {
      break
    }
  }

  return repos
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchRawFile(
  owner: string,
  repo: string,
  path: string,
  branch = 'main',
): Promise<string | null> {
  const headers = getGitHubHeaders('application/vnd.github.v3.raw')

  // Try specified branch first, then master as fallback
  const branches = [branch, 'master']

  for (const b of branches) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${b}`,
        { headers },
      )

      if (response.ok) {
        return await response.text()
      }
    }
    catch {
      // Try next branch
    }
  }

  return null
}

/**
 * Fetch and parse inspec.yml from repository
 */
export async function fetchInspecYml(
  owner: string,
  repo: string,
  branch = 'main',
  path?: string,
): Promise<InspecProfile | null> {
  const filePath = path ? `${path.replace(/\/$/, '')}/inspec.yml` : 'inspec.yml'
  const content = await fetchRawFile(owner, repo, filePath, branch)

  if (!content) {
    return null
  }

  try {
    // InSpec's Ruby YAML parser accepts duplicate map keys (last wins), and
    // real profiles in the wild rely on that — match its behavior here
    return parseYaml(content, { uniqueKeys: false }) as InspecProfile
  }
  catch {
    return null
  }
}

/**
 * Fetch README.md from repository
 */
export async function fetchReadme(
  owner: string,
  repo: string,
  branch = 'main',
): Promise<string | null> {
  // Try common README filenames
  const filenames = ['README.md', 'readme.md', 'Readme.md']

  for (const filename of filenames) {
    const content = await fetchRawFile(owner, repo, filename, branch)
    if (content) {
      return content
    }
  }

  return null
}

/**
 * Generate initial slug from repository name
 *
 * This is a simple transformation that strips common suffixes.
 * For canonical slugs with abbreviations, use conventions.ts generateContentSlug()
 *
 * Naming conventions:
 * - Validation: {target}-stig-baseline → {target}-stig
 * - Hardening: {tech}-{target}-stig-hardening → {tech}-{target}-stig
 */
export function generateSlug(repoName: string): string {
  return repoName
    .toLowerCase()
    .replace(/-baseline$/, '') // Remove validation suffix
    .replace(/-hardening$/, '') // Remove hardening suffix
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract control count from README if present
 */
export function extractControlCount(readme: string): number | null {
  // Look for patterns like "452 controls" or "Controls: 452"
  const patterns = [
    /(\d+)\s+controls/i,
    /controls:\s*(\d+)/i,
    /(\d+)\s+checks/i,
  ]

  for (const pattern of patterns) {
    const match = readme.match(pattern)
    if (match) {
      return Number.parseInt(match[1], 10)
    }
  }

  return null
}
