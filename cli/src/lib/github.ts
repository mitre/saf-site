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

export interface InspecProfile {
  name: string
  title?: string
  maintainer?: string
  copyright?: string
  license?: string
  summary?: string
  version?: string
  supports?: Array<{ platform?: string; 'platform-name'?: string; release?: string }>
  depends?: Array<{ name: string; url?: string; branch?: string }>
}

/**
 * Parse GitHub URL to extract owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/,
    /^([^/]+)\/([^/]+)$/  // shorthand: owner/repo
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
  const token = process.env.GITHUB_TOKEN
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'saf-site-cli'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

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
    htmlUrl: data.html_url
  }
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchRawFile(
  owner: string,
  repo: string,
  path: string,
  branch = 'main'
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3.raw',
    'User-Agent': 'saf-site-cli'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Try specified branch first, then master as fallback
  const branches = [branch, 'master']

  for (const b of branches) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${b}`,
        { headers }
      )

      if (response.ok) {
        return await response.text()
      }
    } catch {
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
  branch = 'main'
): Promise<InspecProfile | null> {
  const content = await fetchRawFile(owner, repo, 'inspec.yml', branch)

  if (!content) {
    return null
  }

  try {
    return parseYaml(content) as InspecProfile
  } catch {
    return null
  }
}

/**
 * Fetch README.md from repository
 */
export async function fetchReadme(
  owner: string,
  repo: string,
  branch = 'main'
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
    .replace(/-baseline$/, '')    // Remove validation suffix
    .replace(/-hardening$/, '')   // Remove hardening suffix
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
    /(\d+)\s+checks/i
  ]

  for (const pattern of patterns) {
    const match = readme.match(pattern)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  return null
}
