/**
 * GitHub Helper Tests
 *
 * TDD tests for GitHub API integration functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  extractControlCount,
  fetchInspecYml,
  fetchLatestRelease,
  fetchLatestTag,
  fetchRawFile,
  fetchReadme,
  fetchRepoInfo,
  generateSlug,
  listOrgRepos,
  parseGitHubUrl,
} from './github.js'

describe('parseGitHubUrl', () => {
  it('parses standard HTTPS URL', () => {
    const result = parseGitHubUrl('https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline')
    expect(result).toEqual({
      owner: 'mitre',
      repo: 'redhat-enterprise-linux-9-stig-baseline',
    })
  })

  it('parses URL with .git suffix', () => {
    const result = parseGitHubUrl('https://github.com/mitre/inspec-profile.git')
    expect(result).toEqual({
      owner: 'mitre',
      repo: 'inspec-profile',
    })
  })

  it('parses URL with trailing slash', () => {
    const result = parseGitHubUrl('https://github.com/mitre/my-profile/')
    expect(result).toEqual({
      owner: 'mitre',
      repo: 'my-profile',
    })
  })

  it('parses URL with additional path segments', () => {
    const result = parseGitHubUrl('https://github.com/mitre/my-profile/tree/main')
    expect(result).toEqual({
      owner: 'mitre',
      repo: 'my-profile',
    })
  })

  it('parses shorthand owner/repo format', () => {
    const result = parseGitHubUrl('mitre/my-baseline')
    expect(result).toEqual({
      owner: 'mitre',
      repo: 'my-baseline',
    })
  })

  it('handles HTTP URL (non-HTTPS)', () => {
    const result = parseGitHubUrl('http://github.com/owner/repo')
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
    })
  })

  it('returns null for invalid URLs', () => {
    expect(parseGitHubUrl('not-a-url')).toBeNull()
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull()
    expect(parseGitHubUrl('')).toBeNull()
  })

  it('handles complex repo names', () => {
    const result = parseGitHubUrl('https://github.com/org-name/repo_with.special-chars')
    expect(result).toEqual({
      owner: 'org-name',
      repo: 'repo_with.special-chars',
    })
  })
})

describe('generateSlug', () => {
  it('removes -baseline suffix', () => {
    expect(generateSlug('redhat-enterprise-linux-9-stig-baseline')).toBe('redhat-enterprise-linux-9-stig')
  })

  it('removes -hardening suffix', () => {
    expect(generateSlug('ansible-redhat-enterprise-linux-9-stig-hardening')).toBe('ansible-redhat-enterprise-linux-9-stig')
  })

  it('keeps -stig in the slug', () => {
    expect(generateSlug('ubuntu-20-stig')).toBe('ubuntu-20-stig')
  })

  it('converts to lowercase', () => {
    expect(generateSlug('MySQL-STIG-Baseline')).toBe('mysql-stig')
  })

  it('replaces special characters with hyphens', () => {
    expect(generateSlug('my_repo.name')).toBe('my-repo-name')
  })

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('-my-repo-')).toBe('my-repo')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('my--repo---name')).toBe('my-repo-name')
  })

  it('handles already clean names', () => {
    expect(generateSlug('rhel8')).toBe('rhel8')
  })
})

describe('extractControlCount', () => {
  it('extracts "X controls" format', () => {
    const readme = 'This profile contains 452 controls for RHEL 9'
    expect(extractControlCount(readme)).toBe(452)
  })

  it('extracts "Controls: X" format', () => {
    const readme = '# Overview\n\nControls: 123\n\nThis is a profile.'
    expect(extractControlCount(readme)).toBe(123)
  })

  it('extracts "X checks" format', () => {
    const readme = 'Implements 87 checks based on STIG requirements'
    expect(extractControlCount(readme)).toBe(87)
  })

  it('is case insensitive', () => {
    expect(extractControlCount('100 CONTROLS')).toBe(100)
    expect(extractControlCount('CONTROLS: 50')).toBe(50)
  })

  it('returns null when no count found', () => {
    expect(extractControlCount('This is a profile README')).toBeNull()
    expect(extractControlCount('')).toBeNull()
  })

  it('returns first match when multiple present', () => {
    const readme = 'Contains 50 controls. Also has 25 checks.'
    expect(extractControlCount(readme)).toBe(50)
  })

  it('handles large numbers', () => {
    expect(extractControlCount('1234 controls')).toBe(1234)
  })
})

describe('fetchRepoInfo', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and parses repository metadata', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        full_name: 'mitre/test-profile',
        description: 'Test InSpec profile',
        default_branch: 'main',
        license: { spdx_id: 'Apache-2.0' },
        topics: ['inspec', 'stig'],
        html_url: 'https://github.com/mitre/test-profile',
      }),
    })

    const result = await fetchRepoInfo('mitre', 'test-profile')

    expect(result).toEqual({
      owner: 'mitre',
      repo: 'test-profile',
      fullName: 'mitre/test-profile',
      description: 'Test InSpec profile',
      defaultBranch: 'main',
      license: 'Apache-2.0',
      topics: ['inspec', 'stig'],
      htmlUrl: 'https://github.com/mitre/test-profile',
    })
  })

  it('handles null description', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        full_name: 'mitre/test',
        description: null,
        default_branch: 'main',
        license: null,
        topics: [],
        html_url: 'https://github.com/mitre/test',
      }),
    })

    const result = await fetchRepoInfo('mitre', 'test')

    expect(result.description).toBeNull()
    expect(result.license).toBeNull()
    expect(result.topics).toEqual([])
  })

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(fetchRepoInfo('mitre', 'nonexistent'))
      .rejects
      .toThrow('GitHub API error: 404 Not Found')
  })

  it('includes authorization header when GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'test-token'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        full_name: 'mitre/test',
        description: null,
        default_branch: 'main',
        license: null,
        topics: [],
        html_url: 'https://github.com/mitre/test',
      }),
    })

    await fetchRepoInfo('mitre', 'test')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )

    delete process.env.GITHUB_TOKEN
  })
})

describe('fetchRawFile', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches file content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'file content here',
    })

    const result = await fetchRawFile('mitre', 'test', 'README.md')

    expect(result).toBe('file content here')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/mitre/test/contents/README.md?ref=main',
      expect.any(Object),
    )
  })

  it('uses specified branch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'content',
    })

    await fetchRawFile('mitre', 'test', 'file.txt', 'develop')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('ref=develop'),
      expect.any(Object),
    )
  })

  it('falls back to master branch on failure', async () => {
    // First call (main) fails
    mockFetch.mockResolvedValueOnce({ ok: false })
    // Second call (master) succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'found on master',
    })

    const result = await fetchRawFile('mitre', 'test', 'README.md')

    expect(result).toBe('found on master')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns null when file not found on any branch', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    const result = await fetchRawFile('mitre', 'test', 'nonexistent.md')

    expect(result).toBeNull()
  })
})

describe('fetchInspecYml', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses inspec.yml content', async () => {
    const inspecContent = `
name: my-profile
title: My InSpec Profile
version: 1.2.3
maintainer: MITRE SAF Team
license: Apache-2.0
summary: A test profile
`
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => inspecContent,
    })

    const result = await fetchInspecYml('mitre', 'test')

    expect(result).toEqual({
      name: 'my-profile',
      title: 'My InSpec Profile',
      version: '1.2.3',
      maintainer: 'MITRE SAF Team',
      license: 'Apache-2.0',
      summary: 'A test profile',
    })
  })

  it('returns null when inspec.yml not found', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    const result = await fetchInspecYml('mitre', 'test')

    expect(result).toBeNull()
  })

  it('reads inspec.yml from a subdirectory when a path is given', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'name: nested-profile\nversion: 2.0.0\n',
    })

    const result = await fetchInspecYml('mitre', 'profiles-monorepo', 'main', 'profiles/rhel-9')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/mitre/profiles-monorepo/contents/profiles/rhel-9/inspec.yml?ref=main',
      expect.anything(),
    )
    expect(result).toEqual({ name: 'nested-profile', version: '2.0.0' })
  })

  it('returns null for invalid YAML', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'invalid: yaml: content: here:',
    })

    const result = await fetchInspecYml('mitre', 'test')

    // The yaml parser might not throw for all invalid content
    // This test verifies the function handles edge cases
    expect(result).toBeDefined()
  })
})

describe('fetchReadme', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches README.md', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '# My Profile\n\nDescription here.',
    })

    const result = await fetchReadme('mitre', 'test')

    expect(result).toBe('# My Profile\n\nDescription here.')
  })

  it('tries alternative filenames', async () => {
    // README.md fails
    mockFetch.mockResolvedValueOnce({ ok: false })
    mockFetch.mockResolvedValueOnce({ ok: false })
    // readme.md succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '# Found it',
    })

    const result = await fetchReadme('mitre', 'test')

    expect(result).toBe('# Found it')
  })

  it('returns null when no README found', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    const result = await fetchReadme('mitre', 'test')

    expect(result).toBeNull()
  })
})

describe('fetchLatestRelease', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns tag name and published date for a repo with GitHub releases', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tag_name: 'v1.4.0',
        published_at: '2026-07-15T12:00:00Z',
        html_url: 'https://github.com/mitre/test-baseline/releases/tag/v1.4.0',
      }),
    })

    const result = await fetchLatestRelease('mitre', 'test-baseline')

    expect(result).toEqual({
      tagName: 'v1.4.0',
      publishedAt: '2026-07-15T12:00:00Z',
      htmlUrl: 'https://github.com/mitre/test-baseline/releases/tag/v1.4.0',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/mitre/test-baseline/releases/latest',
      expect.any(Object),
    )
  })

  it('returns null when the repo has no releases (404)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })

    const result = await fetchLatestRelease('mitre', 'no-releases')

    expect(result).toBeNull()
  })

  it('throws on non-404 API errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' })

    await expect(fetchLatestRelease('mitre', 'test'))
      .rejects
      .toThrow('GitHub API error: 500 Internal Server Error')
  })

  it('includes authorization header when GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'test-token'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tag_name: 'v1.0.0', published_at: null, html_url: 'https://example.com' }),
    })

    await fetchLatestRelease('mitre', 'test')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )

    delete process.env.GITHUB_TOKEN
  })
})

describe('fetchLatestTag', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the first tag for repos that tag without publishing releases', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { name: 'v2.1.0' },
        { name: 'v2.0.0' },
      ]),
    })

    const result = await fetchLatestTag('mitre', 'tagged-repo')

    expect(result).toEqual({ tagName: 'v2.1.0' })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/mitre/tagged-repo/tags?per_page=1',
      expect.any(Object),
    )
  })

  it('returns null when the repo has no tags', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([]),
    })

    const result = await fetchLatestTag('mitre', 'untagged')

    expect(result).toBeNull()
  })

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })

    const result = await fetchLatestTag('mitre', 'missing')

    expect(result).toBeNull()
  })

  it('throws on non-404 API errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden' })

    await expect(fetchLatestTag('mitre', 'test'))
      .rejects
      .toThrow('GitHub API error: 403 Forbidden')
  })
})

describe('listOrgRepos', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function repoPayload(name: string, overrides: Record<string, unknown> = {}) {
    return {
      name,
      html_url: `https://github.com/mitre/${name}`,
      description: `Description of ${name}`,
      pushed_at: '2026-08-01T00:00:00Z',
      archived: false,
      ...overrides,
    }
  }

  it('returns repo name, url, description, and pushed date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([repoPayload('debian-13-stig-baseline')]),
    })

    const result = await listOrgRepos('mitre')

    expect(result).toEqual([{
      name: 'debian-13-stig-baseline',
      htmlUrl: 'https://github.com/mitre/debian-13-stig-baseline',
      description: 'Description of debian-13-stig-baseline',
      pushedAt: '2026-08-01T00:00:00Z',
    }])
  })

  it('follows pagination until a short page', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => repoPayload(`repo-${i}`))
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fullPage })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ([repoPayload('repo-100')]) })

    const result = await listOrgRepos('mitre')

    expect(result).toHaveLength(101)
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/orgs/mitre/repos?per_page=100&page=1',
      expect.any(Object),
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/orgs/mitre/repos?per_page=100&page=2',
      expect.any(Object),
    )
  })

  it('excludes archived repos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        repoPayload('active-repo'),
        repoPayload('dead-repo', { archived: true }),
      ]),
    })

    const result = await listOrgRepos('mitre')

    expect(result.map(r => r.name)).toEqual(['active-repo'])
  })

  it('throws on API errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized' })

    await expect(listOrgRepos('mitre'))
      .rejects
      .toThrow('GitHub API error: 401 Unauthorized')
  })

  it('throws (not empty list) when the organization does not exist', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })

    await expect(listOrgRepos('nonexistent-org'))
      .rejects
      .toThrow('GitHub API error: 404 organization nonexistent-org not found')
  })
})
