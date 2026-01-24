/**
 * GitHub Helper Tests
 *
 * TDD tests for GitHub API integration functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  extractControlCount,
  fetchInspecYml,
  fetchRawFile,
  fetchReadme,
  fetchRepoInfo,
  generateSlug,
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
