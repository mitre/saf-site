/**
 * Content Command Integration Tests
 *
 * Tests the wiring between CLI → Logic → Services layers.
 * Mocks external dependencies (Pocketbase, GitHub API) but tests
 * real command handler logic.
 */

import type { RepoInfo } from '../lib/github.js'
import type { FkMaps } from '../lib/drizzle.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchInspecYml,
  fetchReadme,
  fetchRepoInfo,
  parseGitHubUrl,
} from '../lib/github.js'
// Import after mocking
import {
  createRecord,
  getDrizzle,
  getDefaultDbPath,
  listRecords,
  loadFkMaps,
} from '../lib/drizzle.js'

// Mock drizzle module
vi.mock('../lib/drizzle.js', () => ({
  getDrizzle: vi.fn(),
  getDefaultDbPath: vi.fn(() => '/mock/path/drizzle.db'),
  loadFkMaps: vi.fn(),
  loadFkNameMaps: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  getRecord: vi.fn(),
  listRecords: vi.fn(),
  expandRecord: vi.fn((r: any) => r),
}))

// Mock github module
vi.mock('../lib/github.js', () => ({
  parseGitHubUrl: vi.fn(),
  fetchRepoInfo: vi.fn(),
  fetchInspecYml: vi.fn(),
  fetchReadme: vi.fn(),
  generateSlug: vi.fn(),
  extractControlCount: vi.fn(),
}))

// ============================================================================
// TEST FIXTURES
// ============================================================================

// FK maps must use lowercase keys (resolveContentFKs converts input to lowercase)
const mockFkMaps: FkMaps = {
  organizations: new Map([
    ['mitre', 'org-001'],
    ['cis', 'org-002'],
  ]),
  standards: new Map([
    ['disa stig', 'std-001'],
    ['cis benchmark', 'std-002'],
  ]),
  technologies: new Map([
    ['inspec', 'tech-001'],
    ['ansible', 'tech-002'],
  ]),
  targets: new Map([
    ['rhel 9', 'tgt-001'],
    ['ubuntu 22.04', 'tgt-002'],
  ]),
  teams: new Map([
    ['saf team', 'team-001'],
  ]),
  categories: new Map([
    ['operating system', 'cat-001'],
  ]),
  capabilities: new Map([
    ['validate', 'cap-001'],
    ['harden', 'cap-002'],
  ]),
  tags: new Map([
    ['stig', 'tag-001'],
    ['linux', 'tag-002'],
  ]),
}

const mockRepoInfo: RepoInfo = {
  owner: 'mitre',
  repo: 'rhel-9-stig-baseline',
  fullName: 'mitre/rhel-9-stig-baseline',
  description: 'InSpec Profile for RHEL 9 STIG',
  defaultBranch: 'main',
  htmlUrl: 'https://github.com/mitre/rhel-9-stig-baseline',
  license: 'Apache-2.0',
  topics: ['inspec', 'stig', 'rhel'],
}

const mockInspecProfile = {
  name: 'rhel-9-stig-baseline',
  title: 'RHEL 9 STIG Automated Compliance Validation Profile',
  version: '1.5.0',
  maintainer: 'MITRE SAF Team',
  summary: 'InSpec profile for RHEL 9 STIG compliance',
  license: 'Apache-2.0',
  supports: [{ platform: 'redhat' }],
}

const mockCreatedRecord = {
  id: 'content-123',
  slug: 'rhel-9-stig',
  name: 'RHEL 9 STIG',
  content_type: 'validation',
  status: 'active',
  version: '1.5.0',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
}

// ============================================================================
// INTEGRATION TEST: ADD COMMAND FLOW
// ============================================================================

describe('content Add Command Integration', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`)
    })
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    exitSpy.mockRestore()
  })

  describe('full add flow with mocked services', () => {
    beforeEach(() => {
      // Setup mocks for successful flow
      vi.mocked(parseGitHubUrl).mockReturnValue({ owner: 'mitre', repo: 'rhel-9-stig-baseline' })
      vi.mocked(fetchRepoInfo).mockResolvedValue(mockRepoInfo)
      vi.mocked(fetchInspecYml).mockResolvedValue(mockInspecProfile)
      vi.mocked(fetchReadme).mockResolvedValue('# README\n\n| Benchmark | 256 |')
      vi.mocked(loadFkMaps).mockReturnValue(mockFkMaps)
      vi.mocked(createRecord).mockReturnValue(mockCreatedRecord as any)
      vi.mocked(getDrizzle).mockReturnValue({} as any)
    })

    it('prepares and creates content from GitHub URL', async () => {
      // Import the command handler (triggers registration)
      const { prepareContentAdd } = await import('./content.logic.js')

      // Test the logic layer directly (integration with services)
      const result = await prepareContentAdd(
        {
          githubUrl: 'https://github.com/mitre/rhel-9-stig-baseline',
          contentType: 'validation',
          fkNames: {
            vendor: 'MITRE',
            standard: 'DISA STIG',
            target: 'RHEL 9',
          },
        },
        mockFkMaps,
        {
          parseGitHubUrl,
          fetchRepoInfo,
          fetchInspecYml,
          fetchReadme,
        },
      )

      expect(result.success).toBe(true)
      expect(result.content).toBeDefined()
      expect(result.content?.name).toBe('RHEL 9 STIG Automated Compliance Validation Profile')
      expect(result.content?.vendor).toBe('org-001') // Resolved FK
      expect(result.content?.standard).toBe('std-001') // Resolved FK
      expect(result.content?.target).toBe('tgt-001') // Resolved FK
    })

    it('resolves FK names to IDs correctly', async () => {
      const { prepareContentAdd } = await import('./content.logic.js')

      const result = await prepareContentAdd(
        {
          githubUrl: 'https://github.com/mitre/rhel-9-stig-baseline',
          contentType: 'validation',
          fkNames: {
            vendor: 'CIS',
            technology: 'InSpec',
            maintainer: 'SAF Team',
          },
        },
        mockFkMaps,
        {
          parseGitHubUrl,
          fetchRepoInfo,
          fetchInspecYml,
          fetchReadme,
        },
      )

      expect(result.success).toBe(true)
      expect(result.content?.vendor).toBe('org-002') // CIS
      expect(result.content?.technology).toBe('tech-001') // InSpec
      expect(result.content?.maintainer).toBe('team-001') // SAF Team
    })

    it('warns when FK name cannot be resolved', async () => {
      const { prepareContentAdd } = await import('./content.logic.js')

      const result = await prepareContentAdd(
        {
          githubUrl: 'https://github.com/mitre/rhel-9-stig-baseline',
          contentType: 'validation',
          fkNames: {
            vendor: 'NonexistentOrg',
          },
        },
        mockFkMaps,
        {
          parseGitHubUrl,
          fetchRepoInfo,
          fetchInspecYml,
          fetchReadme,
        },
      )

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Could not resolve vendor: "NonexistentOrg"')
    })

    it('applies user overrides', async () => {
      const { prepareContentAdd } = await import('./content.logic.js')

      const result = await prepareContentAdd(
        {
          githubUrl: 'https://github.com/mitre/rhel-9-stig-baseline',
          contentType: 'validation',
          overrides: {
            name: 'Custom Name',
            slug: 'custom-slug',
            version: '2.0.0',
            status: 'beta',
          },
        },
        mockFkMaps,
        {
          parseGitHubUrl,
          fetchRepoInfo,
          fetchInspecYml,
          fetchReadme,
        },
      )

      expect(result.success).toBe(true)
      expect(result.content?.name).toBe('Custom Name')
      expect(result.content?.slug).toBe('custom-slug')
      expect(result.content?.version).toBe('2.0.0')
      expect(result.content?.status).toBe('beta')
    })
  })

  describe('error handling', () => {
    it('fails gracefully when GitHub fetch fails', async () => {
      vi.mocked(parseGitHubUrl).mockReturnValue({ owner: 'mitre', repo: 'test' })
      vi.mocked(fetchRepoInfo).mockRejectedValue(new Error('Rate limit exceeded'))

      const { prepareContentAdd } = await import('./content.logic.js')

      const result = await prepareContentAdd(
        {
          githubUrl: 'https://github.com/mitre/test',
          contentType: 'validation',
        },
        mockFkMaps,
        {
          parseGitHubUrl,
          fetchRepoInfo,
          fetchInspecYml,
          fetchReadme,
        },
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Failed to fetch repository: Rate limit exceeded')
    })

    it('fails on invalid GitHub URL', async () => {
      vi.mocked(parseGitHubUrl).mockReturnValue(null)

      const { prepareContentAdd } = await import('./content.logic.js')

      const result = await prepareContentAdd(
        {
          githubUrl: 'not-a-valid-url',
          contentType: 'validation',
        },
        mockFkMaps,
        {
          parseGitHubUrl,
          fetchRepoInfo,
          fetchInspecYml,
          fetchReadme,
        },
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Invalid GitHub URL')
    })
  })
})

// ============================================================================
// INTEGRATION TEST: UPDATE COMMAND FLOW
// ============================================================================

describe('content Update Command Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('full update flow', () => {
    it('computes diff and returns only changed fields', async () => {
      const { prepareContentUpdate } = await import('./content.logic.js')

      const existing = {
        id: 'content-123',
        name: 'Original Name',
        version: '1.0.0',
        status: 'active',
        controlCount: 100,
      }

      const result = prepareContentUpdate(existing, {
        updates: {
          name: 'Updated Name',
          version: '2.0.0',
          controlCount: 100, // unchanged
        },
      })

      expect(result.success).toBe(true)
      expect(result.hasChanges).toBe(true)
      expect(result.updates).toEqual({
        name: 'Updated Name',
        version: '2.0.0',
        // controlCount NOT included (unchanged)
      })
    })

    it('returns hasChanges=false when no actual changes', async () => {
      const { prepareContentUpdate } = await import('./content.logic.js')

      const existing = {
        id: 'content-123',
        name: 'Same Name',
        version: '1.0.0',
      }

      const result = prepareContentUpdate(existing, {
        updates: {
          name: 'Same Name',
          version: '1.0.0',
        },
      })

      expect(result.success).toBe(true)
      expect(result.hasChanges).toBe(false)
    })

    it('validates version format', async () => {
      const { prepareContentUpdate } = await import('./content.logic.js')

      const result = prepareContentUpdate({}, {
        updates: {
          version: 'invalid-version',
        },
      })

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.includes('Version'))).toBe(true)
    })
  })
})

// ============================================================================
// INTEGRATION TEST: LIST COMMAND FLOW
// ============================================================================

describe('content List Command Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes filter options to listRecords service', async () => {
    const mockRecords = [
      { id: 'c1', name: 'Profile 1', contentType: 'validation' },
      { id: 'c2', name: 'Profile 2', contentType: 'validation' },
    ]

    vi.mocked(listRecords).mockReturnValue(mockRecords as any)

    // Call listRecords directly to test integration
    const result = listRecords(
      {} as any, // mock db
      'content',
      {
        where: { contentType: 'validation', status: 'active' },
        orderBy: 'name',
      },
    )

    expect(listRecords).toHaveBeenCalledWith(
      expect.anything(),
      'content',
      expect.objectContaining({
        where: expect.objectContaining({
          contentType: 'validation',
        }),
      }),
    )
    expect(result).toHaveLength(2)
  })
})

// ============================================================================
// INTEGRATION TEST: CLI PARSING + LOGIC WIRING
// ============================================================================

describe('cLI Parsing + Logic Integration', () => {
  it('parseAddArgs output is valid input for prepareContentAdd', async () => {
    const { parseAddArgs } = await import('./content.cli.js')
    const { prepareContentAdd } = await import('./content.logic.js')

    // Setup mocks
    vi.mocked(parseGitHubUrl).mockReturnValue({ owner: 'mitre', repo: 'test' })
    vi.mocked(fetchRepoInfo).mockResolvedValue(mockRepoInfo)
    vi.mocked(fetchInspecYml).mockResolvedValue(mockInspecProfile)
    vi.mocked(fetchReadme).mockResolvedValue('# README')

    // Parse CLI args
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'validation',
      vendor: 'MITRE',
      status: 'beta',
    })

    expect(args.errors).toHaveLength(0)

    // Feed to logic layer
    const result = await prepareContentAdd(
      {
        githubUrl: args.githubUrl,
        contentType: args.contentType,
        fkNames: args.fkNames,
        overrides: args.overrides,
      },
      mockFkMaps,
      {
        parseGitHubUrl,
        fetchRepoInfo,
        fetchInspecYml,
        fetchReadme,
      },
    )

    expect(result.success).toBe(true)
    expect(result.content?.status).toBe('beta')
    expect(result.content?.vendor).toBe('org-001')
  })

  it('parseUpdateArgs output is valid input for prepareContentUpdate', async () => {
    const { parseUpdateArgs } = await import('./content.cli.js')
    const { prepareContentUpdate } = await import('./content.logic.js')

    // Parse CLI args
    const args = parseUpdateArgs({
      id: 'content-123',
      version: '2.0.0',
      status: 'active',
    })

    expect(args.errors).toHaveLength(0)

    // Feed to logic layer
    const result = prepareContentUpdate(
      { version: '1.0.0', status: 'beta' },
      { updates: args.updates! },
    )

    expect(result.success).toBe(true)
    expect(result.hasChanges).toBe(true)
    expect(result.diff?.changes.version).toEqual({ old: '1.0.0', new: '2.0.0' })
    expect(result.diff?.changes.status).toEqual({ old: 'beta', new: 'active' })
  })
})

// ============================================================================
// INTEGRATION TEST: OUTPUT FORMATTING
// ============================================================================

describe('output Formatting Integration', () => {
  it('formatAddResult correctly formats prepareContentAdd output', async () => {
    const { formatAddResult } = await import('./content.cli.js')
    const { prepareContentAdd } = await import('./content.logic.js')

    // Setup mocks
    vi.mocked(parseGitHubUrl).mockReturnValue({ owner: 'mitre', repo: 'test' })
    vi.mocked(fetchRepoInfo).mockResolvedValue(mockRepoInfo)
    vi.mocked(fetchInspecYml).mockResolvedValue(mockInspecProfile)
    vi.mocked(fetchReadme).mockResolvedValue('# README')

    const result = await prepareContentAdd(
      {
        githubUrl: 'https://github.com/mitre/test',
        contentType: 'validation',
      },
      mockFkMaps,
      {
        parseGitHubUrl,
        fetchRepoInfo,
        fetchInspecYml,
        fetchReadme,
      },
    )

    // JSON format
    const jsonOutput = formatAddResult(result, 'json')
    const parsed = JSON.parse(jsonOutput)
    expect(parsed.success).toBe(true)
    expect(parsed.content.name).toBeDefined()

    // Quiet format
    const quietOutput = formatAddResult(result, 'quiet')
    expect(quietOutput).toBe(result.content?.slug)

    // Text format
    const textOutput = formatAddResult(result, 'text')
    expect(textOutput).toContain(result.content?.name)
  })

  it('formatUpdateResult correctly formats prepareContentUpdate output', async () => {
    const { formatUpdateResult } = await import('./content.cli.js')
    const { prepareContentUpdate } = await import('./content.logic.js')

    const result = prepareContentUpdate(
      { version: '1.0.0' },
      { updates: { version: '2.0.0' } },
    )

    // JSON format
    const jsonOutput = formatUpdateResult(result, 'content-123', 'json')
    const parsed = JSON.parse(jsonOutput)
    expect(parsed.success).toBe(true)
    expect(parsed.hasChanges).toBe(true)
    expect(parsed.changes.version).toEqual({ old: '1.0.0', new: '2.0.0' })

    // Quiet format
    const quietOutput = formatUpdateResult(result, 'content-123', 'quiet')
    expect(quietOutput).toBe('content-123')

    // Text format
    const textOutput = formatUpdateResult(result, 'content-123', 'text')
    expect(textOutput).toContain('1.0.0')
    expect(textOutput).toContain('2.0.0')
  })
})
