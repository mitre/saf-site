/**
 * Content Command Logic Tests (Phase 3.1)
 *
 * TDD tests for pure business logic functions that prepare content records.
 * These functions are independent of I/O (no prompts, no console, no network).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  prepareContentAdd,
  prepareContentUpdate,
  type PrepareAddInput,
  type PrepareAddResult,
  type PrepareUpdateInput,
  type PrepareUpdateResult,
  type ServiceDeps
} from './content.logic.js'
import type { FkMaps } from '../lib/pocketbase.js'
import type { RepoInfo, InspecProfile } from '../lib/github.js'

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
    ...overrides
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
    ...overrides
  }
}

function createMockFkMaps(): FkMaps {
  return {
    organizations: new Map([
      ['mitre', 'org-mitre-123'],
      ['disa', 'org-disa-456']
    ]),
    teams: new Map([
      ['saf team', 'team-saf-001']
    ]),
    standards: new Map([
      ['disa stig', 'std-stig-001'],
      ['stig', 'std-stig-001'],
      ['cis benchmark', 'std-cis-002']
    ]),
    technologies: new Map([
      ['inspec', 'tech-inspec-001'],
      ['ansible', 'tech-ansible-002']
    ]),
    targets: new Map([
      ['red hat enterprise linux 9', 'tgt-rhel9-001'],
      ['rhel 9', 'tgt-rhel9-001']
    ]),
    categories: new Map([
      ['operating system', 'cat-os-001']
    ]),
    capabilities: new Map([
      ['validate', 'cap-validate-001']
    ]),
    tags: new Map([
      ['linux', 'tag-linux-001']
    ])
  }
}

function createMockServiceDeps(overrides: Partial<ServiceDeps> = {}): ServiceDeps {
  return {
    parseGitHubUrl: vi.fn().mockReturnValue({ owner: 'mitre', repo: 'redhat-enterprise-linux-9-stig-baseline' }),
    fetchRepoInfo: vi.fn().mockResolvedValue(createMockRepoInfo()),
    fetchInspecYml: vi.fn().mockResolvedValue(createMockInspecProfile()),
    fetchReadme: vi.fn().mockResolvedValue('# RHEL 9 STIG\n\n452 controls.'),
    ...overrides
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
          target: 'Red Hat Enterprise Linux 9'
        }
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
          target: 'RHEL 9'
        }
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
          version: '2.0.0'
        }
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
        contentType: 'validation'
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
          controlCount: 500
        }
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.content?.controlCount).toBe(500)
    })

    it('stores README markdown', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation'
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.content?.readmeMarkdown).toContain('# RHEL 9 STIG')
    })

    it('sets status to active by default', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation'
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.content?.status).toBe('active')
    })

    it('allows status override', async () => {
      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation',
        overrides: {
          status: 'beta'
        }
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
          standard: 'Unknown Standard'
        }
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
          slug: 'red-hat-9-stig' // Should use 'rhel'
        }
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.warnings.some(w => w.includes('rhel'))).toBe(true)
    })

    it('warns when inspec.yml is missing', async () => {
      deps.fetchInspecYml = vi.fn().mockResolvedValue(null)

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation'
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('No inspec.yml found - using defaults')
    })

    it('warns when README is missing', async () => {
      deps.fetchReadme = vi.fn().mockResolvedValue(null)

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/test-repo',
        contentType: 'validation'
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
        contentType: 'validation'
      }

      const result = await prepareContentAdd(input, fkMaps, deps)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Invalid GitHub URL')
    })

    it('fails when repo fetch fails', async () => {
      deps.fetchRepoInfo = vi.fn().mockRejectedValue(new Error('GitHub API error: 404'))

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/nonexistent-repo',
        contentType: 'validation'
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
          slug: 'INVALID--SLUG' // uppercase and consecutive hyphens
        }
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
          version: 'not-semver'
        }
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
        description: 'Ansible playbook for RHEL 9 STIG'
      }))
      deps.fetchInspecYml = vi.fn().mockResolvedValue(null) // No inspec.yml for hardening

      const input: PrepareAddInput = {
        githubUrl: 'https://github.com/mitre/ansible-rhel-9-stig-hardening',
        contentType: 'hardening',
        overrides: {
          automationLevel: 'full'
        }
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
        control_count: 400
      }

      const input: PrepareUpdateInput = {
        updates: {
          version: '1.1.0',
          controlCount: 452
        }
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
        version: '1.0.0'
      }

      const input: PrepareUpdateInput = {
        updates: {
          name: 'Red Hat Enterprise Linux 9 STIG',
          version: '1.1.0'
        }
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.diff?.hasChanges).toBe(true)
      expect(result.diff?.changes.name).toEqual({
        old: 'RHEL 9 STIG',
        new: 'Red Hat Enterprise Linux 9 STIG'
      })
      expect(result.diff?.changes.version).toEqual({
        old: '1.0.0',
        new: '1.1.0'
      })
    })

    it('returns hasChanges=false when no changes', async () => {
      const existing = {
        id: 'content-123',
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
        version: '1.0.0'
      }

      const input: PrepareUpdateInput = {
        updates: {
          name: 'RHEL 9 STIG', // Same value
          version: '1.0.0'     // Same value
        }
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
        description: 'Original description'
      }

      const input: PrepareUpdateInput = {
        updates: {
          name: 'RHEL 9 STIG',  // No change
          version: '1.1.0'      // Changed
        }
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
        content_type: 'validation'
      }

      const input: PrepareUpdateInput = {
        updates: {
          slug: 'INVALID--SLUG'
        }
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
        content_type: 'validation'
      }

      const input: PrepareUpdateInput = {
        updates: {
          version: 'not-semver'
        }
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
        content_type: 'validation'
      }

      const input: PrepareUpdateInput = {
        updates: {
          status: 'invalid-status' as any
        }
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
        content_type: 'validation'
      }

      const input: PrepareUpdateInput = {
        updates: {
          slug: 'red-hat-9-stig' // valid format but poor convention
        }
      }

      const result = prepareContentUpdate(existing, input)

      expect(result.success).toBe(true) // Valid but with warning
      expect(result.warnings.some(w => w.includes('rhel'))).toBe(true)
    })
  })
})
