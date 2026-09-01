/**
 * Content Command Logic Tests (Phase 3.1)
 *
 * TDD tests for pure business logic functions that prepare content records.
 * These functions are independent of I/O (no prompts, no console, no network).
 */

import type { InspecProfile, RepoInfo } from '../lib/github.js'
import type { FkMaps } from '../lib/pocketbase.js'
import type { PrepareAddInput, PrepareUpdateInput, ServiceDeps } from './content.logic.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {

  prepareContentAdd,
  prepareContentUpdate,

} from './content.logic.js'

// ============================================================================
// TEST DATA
// ============================================================================

function createMockRepoInfo(overrides: Partial<RepoInfo> = {}): RepoInfo {
  return {
    owner: 'mitre',
    repo: 'redhat-enterprise-linux-9-stig-baseline',
    fullName: 'mitre/redhat-enterprise-linux-9-stig-baseline',
    description: 'InSpec profile for RHEL 9 STIG',
    defaultBranch: 'main',
    license: 'Apache-2.0',
    topics: ['inspec', 'stig', 'rhel'],
    htmlUrl: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
    ...overrides,
  }
}

function createMockInspecProfile(overrides: Partial<InspecProfile> = {}): InspecProfile {
  return {
    name: 'redhat-enterprise-linux-9-stig-baseline',
    title: 'Red Hat Enterprise Linux 9 STIG',
    maintainer: 'MITRE SAF Team',
    license: 'Apache-2.0',
    summary: 'InSpec validation profile for RHEL 9 STIG',
    version: '1.2.0',
    ...overrides,
  }
}

function createMockFkMaps(): FkMaps {
  return {
    organizations: new Map([
      ['mitre', 'org-mitre-123'],
      ['disa', 'org-disa-456'],
    ]),
    teams: new Map([
      ['saf team', 'team-saf-001'],
    ]),
    standards: new Map([
      ['disa stig', 'std-stig-001'],
      ['stig', 'std-stig-001'],
      ['cis benchmark', 'std-cis-002'],
    ]),
    technologies: new Map([
      ['inspec', 'tech-inspec-001'],
      ['ansible', 'tech-ansible-002'],
    ]),
    targets: new Map([
      ['red hat enterprise linux 9', 'tgt-rhel9-001'],
      ['rhel 9', 'tgt-rhel9-001'],
    ]),
    categories: new Map([
      ['operating system', 'cat-os-001'],
    ]),
    capabilities: new Map([
      ['validate', 'cap-validate-001'],
    ]),
    tags: new Map([
      ['linux', 'tag-linux-001'],
    ]),
  }
}

function createMockServiceDeps(overrides: Partial<ServiceDeps> = {}): ServiceDeps {
  return {
    parseGitHubUrl: vi.fn().mockReturnValue({ owner: 'mitre', repo: 'redhat-enterprise-linux-9-stig-baseline' }),
    fetchRepoInfo: vi.fn().mockResolvedValue(createMockRepoInfo()),
    fetchInspecYml: vi.fn().mockResolvedValue(createMockInspecProfile()),
    fetchReadme: vi.fn().mockResolvedValue('# RHEL 9 STIG\n\n452 controls.'),
    ...overrides,
  }
}

// ============================================================================
// PREPARE CONTENT ADD
// ============================================================================

describe('prepareContentAdd', () => {
  let fkMaps: FkMaps
  let deps: ServiceDeps

  beforeEach(() => {
    fkMaps = createMockFkMaps()
    deps = createMockServiceDeps()
  })

  describe('successful preparation', () => {
    it('prepares content from GitHub URL', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
        contentType: 'validation',
        fkNames: {
          vendor: 'MITRE',
          standard: 'DISA STIG',
          technology: 'InSpec',
          target: 'Red Hat Enterprise Linux 9',
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.content).toBeDefined()
      expect(result.content?.name).toBe('Red Hat Enterprise Linux 9 STIG')
      expect(result.content?.slug).toBe('redhat-enterprise-linux-9-stig')
      expect(result.content?.contentType).toBe('validation')
      expect(result.content?.version).toBe('1.2.0')
    })

    it('resolves FK names to IDs', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        fkNames: {
          vendor: 'MITRE',
          standard: 'DISA STIG',
          technology: 'InSpec',
          target: 'RHEL 9',
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.content?.vendor).toBe('org-mitre-123')
      expect(result.content?.standard).toBe('std-stig-001')
      expect(result.content?.technology).toBe('tech-inspec-001')
      expect(result.content?.target).toBe('tgt-rhel9-001')
    })

    it('applies user overrides', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        overrides: {
          name: 'Custom Name Override',
          slug: 'custom-slug',
          version: '2.0.0',
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.content?.name).toBe('Custom Name Override')
      expect(result.content?.slug).toBe('custom-slug')
      expect(result.content?.version).toBe('2.0.0')
    })

    it('extracts control count from README', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.content?.controlCount).toBe(452)
    })

    it('allows override of control count', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        overrides: {
          controlCount: 500,
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.content?.controlCount).toBe(500)
    })

    it('stores README markdown', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.content?.readmeMarkdown).toContain('# RHEL 9 STIG')
    })

    it('sets status to active by default', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.content?.status).toBe('active')
    })

    it('allows status override', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        overrides: {
          status: 'beta',
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.content?.status).toBe('beta')
    })
  })

  describe('warnings', () => {
    it('warns when FK name cannot be resolved', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        fkNames: {
          vendor: 'Unknown Vendor',
          standard: 'Unknown Standard',
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true) // Still succeeds, just with warnings
      expect(result.warnings).toContain('Could not resolve vendor: "Unknown Vendor"')
      expect(result.warnings).toContain('Could not resolve standard: "Unknown Standard"')
    })

    it('warns about slug convention issues', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        overrides: {
          slug: 'red-hat-9-stig', // Should use 'rhel'
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.warnings.some(w => w.includes('rhel'))).toBe(true)
    })

    it('warns when inspec.yml is missing', async () => {
      deps.fetchInspecYml = vi.fn().mockResolvedValue(null)

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('No inspec.yml found - using defaults')
    })

    it('warns when README is missing', async () => {
      deps.fetchReadme = vi.fn().mockResolvedValue(null)

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('No README found')
    })
  })

  describe('errors', () => {
    it('fails on invalid GitHub URL', async () => {
      deps.parseGitHubUrl = vi.fn().mockReturnValue(null)

      const input: PrepareAddInput = {
        githubUrl: 'not-a-valid-url',
        contentType: 'validation',
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Invalid GitHub URL')
    })

    it('fails when repo fetch fails', async () => {
      deps.fetchRepoInfo = vi.fn().mockRejectedValue(new Error('GitHub API error: 404'))

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/nonexistent-repo',
        contentType: 'validation',
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Failed to fetch repository: GitHub API error: 404')
    })

    it('fails on invalid slug in overrides', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        overrides: {
          slug: 'INVALID--SLUG', // uppercase and consecutive hyphens
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.includes('Slug'))).toBe(true)
    })

    it('fails on invalid version format', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        overrides: {
          version: 'not-semver',
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.includes('Version') || e.includes('semver'))).toBe(true)
    })
  })

  describe('hardening content', () => {
    it('prepares hardening content', async () => {
      deps.fetchRepoInfo = vi.fn().mockResolvedValue(createMockRepoInfo({
        repo: 'ansible-rhel-9-stig-hardening',
        description: 'Ansible playbook for RHEL 9 STIG',
      }))
      deps.fetchInspecYml = vi.fn().mockResolvedValue(null) // No inspec.yml for hardening

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/ansible-rhel-9-stig-hardening',
        contentType: 'hardening',
        overrides: {
          automationLevel: 'full',
        },
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.content?.contentType).toBe('hardening')
      expect(result.content?.automationLevel).toBe('full')
    })
  })
})

// ============================================================================
// PREPARE CONTENT UPDATE
// ============================================================================

describe('prepareContentUpdate', () => {
  describe('successful preparation', () => {
    it('prepares update with changes', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
        version: '1.0.0',
        control_count: 400,
      }

      const input: PrepareUpdateInput = {
        updates: {
          version: '1.1.0',
          controlCount: 452,
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.success).toBe(true)
      expect(result.hasChanges).toBe(true)
      expect(result.updates?.version).toBe('1.1.0')
      expect(result.updates?.controlCount).toBe(452)
    })

    it('returns diff of changes', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
        version: '1.0.0',
      }

      const input: PrepareUpdateInput = {
        updates: {
          name: 'Red Hat Enterprise Linux 9 STIG',
          version: '1.1.0',
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.diff?.hasChanges).toBe(true)
      expect(result.diff?.changes.name).toEqual({
        old: 'RHEL 9 STIG',
        new: 'Red Hat Enterprise Linux 9 STIG',
      })
      expect(result.diff?.changes.version).toEqual({
        old: '1.0.0',
        new: '1.1.0',
      })
    })

    it('returns hasChanges=false when no changes', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
        version: '1.0.0',
      }

      const input: PrepareUpdateInput = {
        updates: {
          name: 'RHEL 9 STIG', // Same value
          version: '1.0.0', // Same value
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.success).toBe(true)
      expect(result.hasChanges).toBe(false)
    })

    it('only includes changed fields in updates', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
        version: '1.0.0',
        description: 'Original description',
      }

      const input: PrepareUpdateInput = {
        updates: {
          name: 'RHEL 9 STIG', // No change
          version: '1.1.0', // Changed
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.updates).toEqual({ version: '1.1.0' })
      expect(result.updates?.name).toBeUndefined()
    })
  })

  describe('validation', () => {
    it('validates slug format', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
      }

      const input: PrepareUpdateInput = {
        updates: {
          slug: 'INVALID--SLUG',
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.includes('Slug'))).toBe(true)
    })

    it('validates version format', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
      }

      const input: PrepareUpdateInput = {
        updates: {
          version: 'not-semver',
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.includes('Version') || e.includes('semver'))).toBe(true)
    })

    it('validates status enum', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
      }

      const input: PrepareUpdateInput = {
        updates: {
          status: 'invalid-status' as any,
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.success).toBe(false)
    })
  })

  describe('warnings', () => {
    it('warns about slug convention issues', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
      }

      const input: PrepareUpdateInput = {
        updates: {
          slug: 'red-hat-9-stig', // valid format but poor convention
        },
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.success).toBe(true) // Valid but with warning
      expect(result.warnings.some(w => w.includes('rhel'))).toBe(true)
    })
  })
})

// ============================================================================
// CONTENT SYNC (planContentSync / executeSyncPlans)
// ============================================================================

describe('planContentSync', () => {
  function createSyncDeps(overrides: Partial<import('./content.logic.js').SyncDeps> = {}) {
    return {
      parseGitHubUrl: vi.fn().mockReturnValue({ owner: 'mitre', repo: 'rhel-9-stig-baseline' }),
      fetchInspecYml: vi.fn().mockResolvedValue(createMockInspecProfile({ version: '1.2.0' })),
      fetchLatestRelease: vi.fn().mockResolvedValue({
        tagName: 'v1.2.0',
        publishedAt: '2026-07-01T00:00:00Z',
        htmlUrl: 'https://github.com/mitre/rhel-9-stig-baseline/releases/tag/v1.2.0',
      }),
      fetchLatestTag: vi.fn().mockResolvedValue({ tagName: 'v1.2.0' }),
      ...overrides,
    }
  }

  const record = {
    id: 'content-123',
    slug: 'rhel-9-stig',
    name: 'RHEL 9 STIG',
    github: 'https://github.com/mitre/rhel-9-stig-baseline',
    version: '1.0.0',
  }

  it('reports drift and builds update + release row when inspec.yml version is ahead', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync(record, createSyncDeps())

    expect(plan.status).toBe('drift')
    expect(plan.currentVersion).toBe('1.0.0')
    expect(plan.inspecVersion).toBe('1.2.0')
    expect(plan.update).toEqual({ version: '1.2.0', releaseDate: '2026-07-01T00:00:00Z' })
    expect(plan.release).toEqual({
      slug: 'rhel-9-stig-v1-2-0',
      version: '1.2.0',
      releaseDate: '2026-07-01T00:00:00Z',
    })
  })

  it('reports up-to-date and no update when versions match', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync({ ...record, version: '1.2.0' }, createSyncDeps())

    expect(plan.status).toBe('up-to-date')
    expect(plan.update).toBeUndefined()
    expect(plan.release).toBeUndefined()
  })

  it('normalizes the release tag v-prefix when comparing against inspec.yml', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync({ ...record, version: '1.0.0' }, createSyncDeps({
      fetchLatestRelease: vi.fn().mockResolvedValue({
        tagName: 'V1.2.0',
        publishedAt: '2026-07-01T00:00:00Z',
        htmlUrl: 'https://example.com',
      }),
    }))

    expect(plan.status).toBe('drift')
    expect(plan.releaseTag).toBe('1.2.0')
  })

  it('warns and does NOT update when inspec.yml and release tag disagree', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync(record, createSyncDeps({
      fetchLatestRelease: vi.fn().mockResolvedValue({
        tagName: 'v1.3.0',
        publishedAt: '2026-07-01T00:00:00Z',
        htmlUrl: 'https://example.com',
      }),
    }))

    expect(plan.status).toBe('warning')
    expect(plan.update).toBeUndefined()
    expect(plan.messages.join(' ')).toMatch(/mismatch/i)
  })

  it('warns and does NOT update when inspec.yml has no version', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync(record, createSyncDeps({
      fetchInspecYml: vi.fn().mockResolvedValue(createMockInspecProfile({ version: undefined })),
    }))

    expect(plan.status).toBe('warning')
    expect(plan.update).toBeUndefined()
  })

  it('falls back to the latest tag when the repo has no releases', async () => {
    const fetchLatestTag = vi.fn().mockResolvedValue({ tagName: 'v1.2.0' })
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync(record, createSyncDeps({
      fetchLatestRelease: vi.fn().mockResolvedValue(null),
      fetchLatestTag,
    }))

    expect(fetchLatestTag).toHaveBeenCalledWith('mitre', 'rhel-9-stig-baseline')
    expect(plan.status).toBe('drift')
    expect(plan.releaseTag).toBe('1.2.0')
    expect(plan.update).toEqual({ version: '1.2.0' })
  })

  it('still updates from inspec.yml alone when the repo has neither releases nor tags', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync(record, createSyncDeps({
      fetchLatestRelease: vi.fn().mockResolvedValue(null),
      fetchLatestTag: vi.fn().mockResolvedValue(null),
    }))

    expect(plan.status).toBe('drift')
    expect(plan.update).toEqual({ version: '1.2.0' })
    expect(plan.release).toEqual({ slug: 'rhel-9-stig-v1-2-0', version: '1.2.0', releaseDate: undefined })
  })

  it('fetches inspec.yml from the subdirectory for monorepo tree URLs and skips release lookup', async () => {
    const fetchInspecYml = vi.fn().mockResolvedValue(createMockInspecProfile({ version: '2.0.0' }))
    const fetchLatestRelease = vi.fn()
    const { planContentSync } = await import('./content.logic.js')

    const plan = await planContentSync({
      ...record,
      github: 'https://github.com/mitre/profiles-monorepo/tree/main/profiles/rhel-9',
    }, createSyncDeps({ fetchInspecYml, fetchLatestRelease }))

    expect(fetchInspecYml).toHaveBeenCalledWith('mitre', 'profiles-monorepo', 'main', 'profiles/rhel-9')
    expect(fetchLatestRelease).not.toHaveBeenCalled()
    expect(plan.status).toBe('drift')
    expect(plan.update).toEqual({ version: '2.0.0' })
  })

  it('warns and does NOT update when the inspec.yml version is not semver', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync(record, createSyncDeps({
      fetchInspecYml: vi.fn().mockResolvedValue(createMockInspecProfile({ version: 'V1R3' })),
      fetchLatestRelease: vi.fn().mockResolvedValue(null),
      fetchLatestTag: vi.fn().mockResolvedValue(null),
    }))

    expect(plan.status).toBe('warning')
    expect(plan.update).toBeUndefined()
  })

  it('reports an error for records with an unparseable GitHub URL', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync({ ...record, github: 'not-a-url' }, createSyncDeps({
      parseGitHubUrl: vi.fn().mockReturnValue(null),
    }))

    expect(plan.status).toBe('error')
    expect(plan.update).toBeUndefined()
  })

  it('reports an error when the GitHub fetch throws', async () => {
    const { planContentSync } = await import('./content.logic.js')
    const plan = await planContentSync(record, createSyncDeps({
      fetchInspecYml: vi.fn().mockRejectedValue(new Error('GitHub API error: 500')),
    }))

    expect(plan.status).toBe('error')
    expect(plan.messages.join(' ')).toContain('GitHub API error: 500')
  })
})

describe('executeSyncPlans', () => {
  function driftPlan(overrides: Record<string, unknown> = {}) {
    return {
      id: 'content-123',
      slug: 'rhel-9-stig',
      status: 'drift' as const,
      currentVersion: '1.0.0',
      inspecVersion: '1.2.0',
      releaseTag: '1.2.0',
      messages: [],
      update: { version: '1.2.0', releaseDate: '2026-07-01T00:00:00Z' },
      release: { slug: 'rhel-9-stig-v1-2-0', version: '1.2.0', releaseDate: '2026-07-01T00:00:00Z' },
      ...overrides,
    }
  }

  it('applies updates and upserts release rows for drift plans', async () => {
    const updateContent = vi.fn().mockResolvedValue({})
    const upsertRelease = vi.fn().mockResolvedValue({})
    const { executeSyncPlans } = await import('./content.logic.js')

    const summary = await executeSyncPlans([driftPlan()], { updateContent, upsertRelease }, { dryRun: false })

    expect(updateContent).toHaveBeenCalledWith('content-123', { version: '1.2.0', releaseDate: '2026-07-01T00:00:00Z' })
    expect(upsertRelease).toHaveBeenCalledWith('content-123', { slug: 'rhel-9-stig-v1-2-0', version: '1.2.0', releaseDate: '2026-07-01T00:00:00Z' })
    expect(summary.applied).toBe(1)
    expect(summary.errors).toBe(0)
  })

  it('writes nothing in dry-run mode', async () => {
    const updateContent = vi.fn()
    const upsertRelease = vi.fn()
    const { executeSyncPlans } = await import('./content.logic.js')

    const summary = await executeSyncPlans([driftPlan()], { updateContent, upsertRelease }, { dryRun: true })

    expect(updateContent).not.toHaveBeenCalled()
    expect(upsertRelease).not.toHaveBeenCalled()
    expect(summary.applied).toBe(0)
    expect(summary.drift).toBe(1)
  })

  it('skips non-drift plans and counts warnings and errors', async () => {
    const updateContent = vi.fn()
    const upsertRelease = vi.fn()
    const { executeSyncPlans } = await import('./content.logic.js')

    const summary = await executeSyncPlans([
      driftPlan({ status: 'up-to-date', update: undefined, release: undefined }),
      driftPlan({ status: 'warning', update: undefined, release: undefined }),
      driftPlan({ status: 'error', update: undefined, release: undefined }),
    ], { updateContent, upsertRelease }, { dryRun: false })

    expect(updateContent).not.toHaveBeenCalled()
    expect(summary.applied).toBe(0)
    expect(summary.upToDate).toBe(1)
    expect(summary.warnings).toBe(1)
    expect(summary.errors).toBe(1)
  })

  it('counts a plan as an error when the write fails, and continues with the rest', async () => {
    const updateContent = vi.fn()
      .mockRejectedValueOnce(new Error('PB down'))
      .mockResolvedValueOnce({})
    const upsertRelease = vi.fn().mockResolvedValue({})
    const { executeSyncPlans } = await import('./content.logic.js')

    const summary = await executeSyncPlans([
      driftPlan(),
      driftPlan({ id: 'content-456', slug: 'other' }),
    ], { updateContent, upsertRelease }, { dryRun: false })

    expect(summary.applied).toBe(1)
    expect(summary.errors).toBe(1)
    expect(updateContent).toHaveBeenCalledTimes(2)
  })
})

// ============================================================================
// CONTENT DISCOVER (discoverContent)
// ============================================================================

describe('discoverContent', () => {
  function repo(name: string, overrides: Record<string, unknown> = {}) {
    return {
      name,
      htmlUrl: `https://github.com/mitre/${name}`,
      description: `InSpec profile for ${name}`,
      pushedAt: '2026-08-01T00:00:00Z',
      ...overrides,
    }
  }

  it('returns repos matching baseline patterns that have no content record with a matching GitHub URL', async () => {
    const { discoverContent } = await import('./content.logic.js')

    const repos = [
      repo('debian-12-stig-baseline'),
      repo('redhat-enterprise-linux-10-stig-baseline'),
      repo('canonical-ubuntu-22.04-lts-stig-baseline'),
      repo('saf-site-vitepress'), // tooling repo, no pattern match
    ]
    const existing = ['https://github.com/mitre/canonical-ubuntu-22.04-lts-stig-baseline']

    const candidates = discoverContent(repos, existing)

    expect(candidates.map(c => c.name)).toEqual([
      'debian-12-stig-baseline',
      'redhat-enterprise-linux-10-stig-baseline',
    ])
  })

  it('matches hardening, benchmark, and baseline-overlay naming conventions', async () => {
    const { discoverContent } = await import('./content.logic.js')

    const repos = [
      repo('ansible-pg12-stig-hardening'),
      repo('inspec-gcp-cis-benchmark'),
      repo('couchbase-community-srg-baseline-overlay'),
      repo('chef-workstation'),
      repo('inspec_profile_coding_conventions'),
    ]

    const candidates = discoverContent(repos, [])

    expect(candidates.map(c => c.name)).toEqual(expect.arrayContaining([
      'ansible-pg12-stig-hardening',
      'inspec-gcp-cis-benchmark',
      'couchbase-community-srg-baseline-overlay',
    ]))
    expect(candidates).toHaveLength(3)
  })

  it('normalizes existing URLs: case, trailing slash, and .git suffix all count as present', async () => {
    const { discoverContent } = await import('./content.logic.js')

    const repos = [
      repo('debian-11-stig-baseline'),
      repo('debian-12-stig-baseline'),
      repo('debian-13-stig-baseline'),
    ]
    const existing = [
      'https://github.com/MITRE/Debian-11-STIG-Baseline',
      'https://github.com/mitre/debian-12-stig-baseline/',
      'https://github.com/mitre/debian-13-stig-baseline.git',
    ]

    expect(discoverContent(repos, existing)).toEqual([])
  })

  it('does not treat a same-named repo in a different org as present', async () => {
    const { discoverContent } = await import('./content.logic.js')

    const repos = [repo('rhel-9-stig-baseline')]
    const existing = ['https://github.com/someone-else/rhel-9-stig-baseline']

    expect(discoverContent(repos, existing).map(c => c.name)).toEqual(['rhel-9-stig-baseline'])
  })

  it('sorts candidates newest push first, null push dates last', async () => {
    const { discoverContent } = await import('./content.logic.js')

    const repos = [
      repo('old-thing-stig-baseline', { pushedAt: '2020-01-01T00:00:00Z' }),
      repo('dateless-stig-baseline', { pushedAt: null }),
      repo('new-thing-stig-baseline', { pushedAt: '2026-08-15T00:00:00Z' }),
    ]

    expect(discoverContent(repos, []).map(c => c.name)).toEqual([
      'new-thing-stig-baseline',
      'old-thing-stig-baseline',
      'dateless-stig-baseline',
    ])
  })

  it('silently skips unparseable entries in the existing URL list', async () => {
    const { discoverContent } = await import('./content.logic.js')

    const repos = [repo('debian-12-stig-baseline')]
    const existing = ['not a url at all \u0000', '']

    expect(discoverContent(repos, existing).map(c => c.name)).toEqual(['debian-12-stig-baseline'])
  })

  it('falls back to the repo name when its htmlUrl does not parse', async () => {
    const { discoverContent } = await import('./content.logic.js')

    const repos = [repo('debian-12-stig-baseline', { htmlUrl: 'not-github' })]

    expect(discoverContent(repos, []).map(c => c.name)).toEqual(['debian-12-stig-baseline'])
  })

  it('skips monorepo tree URLs without marking the whole repo present', async () => {
    const { discoverContent } = await import('./content.logic.js')

    // A content record pointing INTO a repo subdirectory still means the repo is covered
    const repos = [repo('profiles-monorepo-stig-baseline')]
    const existing = ['https://github.com/mitre/profiles-monorepo-stig-baseline/tree/main/profiles/rhel-9']

    expect(discoverContent(repos, existing)).toEqual([])
  })
})
