/**
 * Content Service Tests (Phase 2.3)
 *
 * TDD tests for building content records from GitHub data
 */

import type { ContentFKNames, RepoData } from './content-service.js'
import type { InspecProfile, RepoInfo } from './github.js'
import type { FkMaps } from './pocketbase.js'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildContentFromRepo,
  checkUnresolvedFKs,

  diffContent,

  resolveContentFKs,
} from './content-service.js'

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
    topics: ['inspec', 'stig', 'rhel', 'security'],
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
    supports: [{ 'platform-name': 'redhat', 'release': '9' }],
    ...overrides,
  }
}

function createMockFkMaps(): FkMaps {
  return {
    organizations: new Map([
      ['mitre', 'org-mitre-123'],
      ['the mitre corporation', 'org-mitre-123'],
      ['disa', 'org-disa-456'],
      ['cis', 'org-cis-789'],
    ]),
    teams: new Map([
      ['saf team', 'team-saf-001'],
      ['mitre saf team', 'team-saf-001'],
    ]),
    standards: new Map([
      ['disa stig', 'std-stig-001'],
      ['stig', 'std-stig-001'],
      ['cis benchmark', 'std-cis-002'],
      ['cis', 'std-cis-002'],
    ]),
    technologies: new Map([
      ['inspec', 'tech-inspec-001'],
      ['chef inspec', 'tech-inspec-001'],
      ['ansible', 'tech-ansible-002'],
    ]),
    targets: new Map([
      ['red hat enterprise linux 9', 'tgt-rhel9-001'],
      ['rhel 9', 'tgt-rhel9-001'],
      ['red hat enterprise linux 8', 'tgt-rhel8-002'],
      ['rhel 8', 'tgt-rhel8-002'],
      ['ubuntu 22.04', 'tgt-ubuntu22-003'],
    ]),
    categories: new Map([
      ['operating system', 'cat-os-001'],
      ['database', 'cat-db-002'],
    ]),
    capabilities: new Map([
      ['validate', 'cap-validate-001'],
      ['harden', 'cap-harden-002'],
    ]),
    tags: new Map([
      ['linux', 'tag-linux-001'],
      ['rhel', 'tag-rhel-002'],
    ]),
  }
}

// ============================================================================
// BUILD CONTENT FROM REPO
// ============================================================================

describe('buildContentFromRepo', () => {
  describe('validation profiles (InSpec)', () => {
    it('builds content from repo info and inspec.yml', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        inspecProfile: createMockInspecProfile(),
        readme: '# RHEL 9 STIG\n\nThis profile has 452 controls.',
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.name).toBe('Red Hat Enterprise Linux 9 STIG')
      expect(result.slug).toBe('redhat-enterprise-linux-9-stig')
      expect(result.contentType).toBe('validation')
      expect(result.version).toBe('1.2.0')
      expect(result.license).toBe('Apache-2.0')
      expect(result.github).toBe('https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline')
    })

    it('uses inspec.yml title as name', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        inspecProfile: createMockInspecProfile({ title: 'Custom Profile Title' }),
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.name).toBe('Custom Profile Title')
    })

    it('falls back to repo description if no inspec title', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo({ description: 'Repo Description Here' }),
        inspecProfile: createMockInspecProfile({ title: undefined }),
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.name).toBe('Repo Description Here')
    })

    it('extracts control count from README', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        inspecProfile: createMockInspecProfile(),
        readme: 'This profile validates 452 controls for RHEL 9.',
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.controlCount).toBe(452)
    })

    it('uses inspec.yml summary as description', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        inspecProfile: createMockInspecProfile({
          summary: 'InSpec profile for validating RHEL 9 STIG compliance',
        }),
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.description).toBe('InSpec profile for validating RHEL 9 STIG compliance')
    })

    it('stores full README as readmeMarkdown', () => {
      const readme = '# RHEL 9 STIG\n\nFull documentation here...'
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        inspecProfile: createMockInspecProfile(),
        readme,
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.readmeMarkdown).toBe(readme)
    })

    it('generates slug from repo name', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo({ repo: 'aws-rds-oracle-mysql-ee-5.7-cis-baseline' }),
        inspecProfile: createMockInspecProfile(),
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      // Dots are converted to hyphens in slugs (URL-safe)
      expect(result.slug).toBe('aws-rds-oracle-mysql-ee-5-7-cis')
    })

    it('sets status to active by default', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        inspecProfile: createMockInspecProfile(),
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.status).toBe('active')
    })
  })

  describe('hardening content (Ansible/Chef)', () => {
    it('builds hardening content', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo({
          repo: 'ansible-rhel-9-stig-hardening',
          fullName: 'mitre/ansible-rhel-9-stig-hardening',
          htmlUrl: 'https://github.com/mitre/ansible-rhel-9-stig-hardening',
          description: 'Ansible playbook for RHEL 9 STIG hardening',
        }),
        contentType: 'hardening',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.contentType).toBe('hardening')
      expect(result.slug).toBe('ansible-rhel-9-stig')
    })

    it('sets automation level when provided', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        contentType: 'hardening',
        automationLevel: 'full',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.automationLevel).toBe('full')
    })
  })

  describe('edge cases', () => {
    it('handles missing optional fields gracefully', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo({
          description: null,
          license: null,
        }),
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.name).toBeDefined()
      expect(result.slug).toBeDefined()
      expect(result.license).toBeUndefined()
    })

    it('handles missing inspec profile', () => {
      const repoData: RepoData = {
        repoInfo: createMockRepoInfo(),
        contentType: 'validation',
      }

      const result = buildContentFromRepo(repoData)

      expect(result.name).toBe('InSpec profile for RHEL 9 STIG') // falls back to repo description
      expect(result.version).toBeUndefined()
    })
  })
})

// ============================================================================
// RESOLVE CONTENT FKS
// ============================================================================

describe('resolveContentFKs', () => {
  let fkMaps: FkMaps

  beforeEach(() => {
    fkMaps = createMockFkMaps()
  })

  it('resolves all FK names to IDs', () => {
    const fkNames: ContentFKNames = {
      vendor: 'MITRE',
      standard: 'DISA STIG',
      technology: 'InSpec',
      target: 'Red Hat Enterprise Linux 9',
      maintainer: 'SAF Team',
    }

    const result = resolveContentFKs(fkNames, fkMaps)

    expect(result.vendor).toBe('org-mitre-123')
    expect(result.standard).toBe('std-stig-001')
    expect(result.technology).toBe('tech-inspec-001')
    expect(result.target).toBe('tgt-rhel9-001')
    expect(result.maintainer).toBe('team-saf-001')
  })

  it('returns undefined for unresolved names', () => {
    const fkNames: ContentFKNames = {
      vendor: 'Unknown Vendor',
      standard: 'Unknown Standard',
    }

    const result = resolveContentFKs(fkNames, fkMaps)

    expect(result.vendor).toBeUndefined()
    expect(result.standard).toBeUndefined()
  })

  it('handles partial FK names', () => {
    const fkNames: ContentFKNames = {
      vendor: 'MITRE',
      // No other FKs specified
    }

    const result = resolveContentFKs(fkNames, fkMaps)

    expect(result.vendor).toBe('org-mitre-123')
    expect(result.standard).toBeUndefined()
    expect(result.technology).toBeUndefined()
    expect(result.target).toBeUndefined()
    expect(result.maintainer).toBeUndefined()
  })

  it('is case-insensitive', () => {
    const fkNames: ContentFKNames = {
      vendor: 'mitre',
      standard: 'STIG',
      technology: 'INSPEC',
    }

    const result = resolveContentFKs(fkNames, fkMaps)

    expect(result.vendor).toBe('org-mitre-123')
    expect(result.standard).toBe('std-stig-001')
    expect(result.technology).toBe('tech-inspec-001')
  })

  it('handles alternate names/aliases', () => {
    const fkNames: ContentFKNames = {
      vendor: 'The MITRE Corporation',
      technology: 'Chef InSpec',
    }

    const result = resolveContentFKs(fkNames, fkMaps)

    expect(result.vendor).toBe('org-mitre-123')
    expect(result.technology).toBe('tech-inspec-001')
  })

  it('returns empty object for empty input', () => {
    const result = resolveContentFKs({}, fkMaps)

    expect(result).toEqual({})
  })
})

// ============================================================================
// CHECK UNRESOLVED FKS
// ============================================================================

describe('checkUnresolvedFKs', () => {
  it('returns empty array when all FKs are resolved', () => {
    const fkNames: ContentFKNames = {
      vendor: 'MITRE',
      standard: 'DISA STIG',
    }
    const resolvedFKs = {
      vendor: 'org-mitre-123',
      standard: 'std-stig-001',
    }

    const warnings = checkUnresolvedFKs(fkNames, resolvedFKs)

    expect(warnings).toEqual([])
  })

  it('returns warnings for unresolved FKs', () => {
    const fkNames: ContentFKNames = {
      vendor: 'Unknown Vendor',
      standard: 'Unknown Standard',
    }
    const resolvedFKs = {}

    const warnings = checkUnresolvedFKs(fkNames, resolvedFKs)

    expect(warnings).toHaveLength(2)
    expect(warnings).toContain('Could not resolve vendor: "Unknown Vendor"')
    expect(warnings).toContain('Could not resolve standard: "Unknown Standard"')
  })

  it('returns warnings only for unresolved FKs', () => {
    const fkNames: ContentFKNames = {
      vendor: 'MITRE',
      standard: 'Unknown Standard',
      technology: 'InSpec',
    }
    const resolvedFKs = {
      vendor: 'org-mitre-123',
      technology: 'tech-inspec-001',
      // standard not resolved
    }

    const warnings = checkUnresolvedFKs(fkNames, resolvedFKs)

    expect(warnings).toHaveLength(1)
    expect(warnings).toContain('Could not resolve standard: "Unknown Standard"')
  })

  it('returns empty array for empty FK names', () => {
    const warnings = checkUnresolvedFKs({}, {})

    expect(warnings).toEqual([])
  })

  it('checks all FK fields', () => {
    const fkNames: ContentFKNames = {
      vendor: 'Missing Vendor',
      standard: 'Missing Standard',
      technology: 'Missing Tech',
      target: 'Missing Target',
      maintainer: 'Missing Maintainer',
    }
    const resolvedFKs = {}

    const warnings = checkUnresolvedFKs(fkNames, resolvedFKs)

    expect(warnings).toHaveLength(5)
    expect(warnings).toContain('Could not resolve vendor: "Missing Vendor"')
    expect(warnings).toContain('Could not resolve standard: "Missing Standard"')
    expect(warnings).toContain('Could not resolve technology: "Missing Tech"')
    expect(warnings).toContain('Could not resolve target: "Missing Target"')
    expect(warnings).toContain('Could not resolve maintainer: "Missing Maintainer"')
  })
})

// ============================================================================
// DIFF CONTENT
// ============================================================================

describe('diffContent', () => {
  it('returns empty diff when content is identical', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      version: '1.0.0',
      control_count: 452,
    }

    const updated = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      version: '1.0.0',
      controlCount: 452,
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(false)
    expect(diff.changes).toEqual({})
  })

  it('detects name change', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
    }

    const updated = {
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(true)
    expect(diff.changes.name).toEqual({
      old: 'RHEL 9 STIG',
      new: 'Red Hat Enterprise Linux 9 STIG',
    })
  })

  it('detects version change', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      version: '1.0.0',
    }

    const updated = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      version: '1.1.0',
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(true)
    expect(diff.changes.version).toEqual({
      old: '1.0.0',
      new: '1.1.0',
    })
  })

  it('detects control count change', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      control_count: 400,
    }

    const updated = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      controlCount: 452,
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(true)
    expect(diff.changes.controlCount).toEqual({
      old: 400,
      new: 452,
    })
  })

  it('detects multiple changes', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      version: '1.0.0',
      control_count: 400,
      status: 'draft',
    }

    const updated = {
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      version: '1.1.0',
      controlCount: 452,
      status: 'active',
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(true)
    expect(Object.keys(diff.changes)).toHaveLength(4)
    expect(diff.changes.name).toBeDefined()
    expect(diff.changes.version).toBeDefined()
    expect(diff.changes.controlCount).toBeDefined()
    expect(diff.changes.status).toBeDefined()
  })

  it('ignores undefined values in update', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      version: '1.0.0',
    }

    const updated = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      // version not specified - should not show as a change
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(false)
    expect(diff.changes.version).toBeUndefined()
  })

  it('detects new field being added', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      // No license
    }

    const updated = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      license: 'Apache-2.0',
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(true)
    expect(diff.changes.license).toEqual({
      old: undefined,
      new: 'Apache-2.0',
    })
  })

  it('handles FK changes', () => {
    const existing = {
      id: 'content-123',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      vendor: 'org-old-vendor',
    }

    const updated = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      vendor: 'org-mitre-123',
    }

    const diff = diffContent(existing, updated)

    expect(diff.hasChanges).toBe(true)
    expect(diff.changes.vendor).toEqual({
      old: 'org-old-vendor',
      new: 'org-mitre-123',
    })
  })
})
