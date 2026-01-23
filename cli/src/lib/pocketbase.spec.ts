/**
 * Pocketbase Helper Tests
 *
 * TDD tests for Pocketbase client and FK resolution functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveFK, type FkMaps } from './pocketbase.js'

// Mock FkMaps for testing
function createMockFkMaps(): FkMaps {
  return {
    organizations: new Map([
      ['mitre', 'org-mitre-123'],
      ['the mitre corporation', 'org-mitre-123'],
      ['disa', 'org-disa-456'],
      ['aws', 'org-aws-789']
    ]),
    teams: new Map([
      ['saf team', 'team-saf-001'],
      ['mitre saf team', 'team-saf-001']
    ]),
    standards: new Map([
      ['disa stig', 'std-stig-001'],
      ['cis benchmark', 'std-cis-002'],
      ['pci-dss', 'std-pci-003']
    ]),
    technologies: new Map([
      ['inspec', 'tech-inspec-001'],
      ['ansible', 'tech-ansible-002'],
      ['chef', 'tech-chef-003'],
      ['terraform', 'tech-terraform-004']
    ]),
    targets: new Map([
      ['red hat enterprise linux 8', 'tgt-rhel8-001'],
      ['red hat enterprise linux 9', 'tgt-rhel9-002'],
      ['ubuntu 20.04', 'tgt-ubuntu20-003'],
      ['mysql 8.0', 'tgt-mysql8-004']
    ]),
    categories: new Map([
      ['operating system', 'cat-os-001'],
      ['database', 'cat-db-002'],
      ['container', 'cat-container-003']
    ]),
    capabilities: new Map([
      ['validate', 'cap-validate-001'],
      ['harden', 'cap-harden-002'],
      ['normalize', 'cap-normalize-003'],
      ['plan', 'cap-plan-004'],
      ['visualize', 'cap-visualize-005']
    ]),
    tags: new Map([
      ['linux', 'tag-linux-001'],
      ['windows', 'tag-windows-002'],
      ['cloud', 'tag-cloud-003']
    ])
  }
}

describe('resolveFK', () => {
  let fkMaps: FkMaps

  beforeEach(() => {
    fkMaps = createMockFkMaps()
  })

  describe('exact matches', () => {
    it('resolves organization name to ID', () => {
      expect(resolveFK(fkMaps, 'organizations', 'mitre')).toBe('org-mitre-123')
      expect(resolveFK(fkMaps, 'organizations', 'disa')).toBe('org-disa-456')
    })

    it('resolves technology name to ID', () => {
      expect(resolveFK(fkMaps, 'technologies', 'inspec')).toBe('tech-inspec-001')
      expect(resolveFK(fkMaps, 'technologies', 'ansible')).toBe('tech-ansible-002')
    })

    it('resolves target name to ID', () => {
      expect(resolveFK(fkMaps, 'targets', 'red hat enterprise linux 8')).toBe('tgt-rhel8-001')
      expect(resolveFK(fkMaps, 'targets', 'mysql 8.0')).toBe('tgt-mysql8-004')
    })

    it('resolves standard name to ID', () => {
      expect(resolveFK(fkMaps, 'standards', 'disa stig')).toBe('std-stig-001')
      expect(resolveFK(fkMaps, 'standards', 'cis benchmark')).toBe('std-cis-002')
    })

    it('resolves category name to ID', () => {
      expect(resolveFK(fkMaps, 'categories', 'operating system')).toBe('cat-os-001')
      expect(resolveFK(fkMaps, 'categories', 'database')).toBe('cat-db-002')
    })

    it('resolves capability name to ID', () => {
      expect(resolveFK(fkMaps, 'capabilities', 'validate')).toBe('cap-validate-001')
      expect(resolveFK(fkMaps, 'capabilities', 'harden')).toBe('cap-harden-002')
    })

    it('resolves tag name to ID', () => {
      expect(resolveFK(fkMaps, 'tags', 'linux')).toBe('tag-linux-001')
      expect(resolveFK(fkMaps, 'tags', 'cloud')).toBe('tag-cloud-003')
    })

    it('resolves team name to ID', () => {
      expect(resolveFK(fkMaps, 'teams', 'saf team')).toBe('team-saf-001')
    })
  })

  describe('case insensitivity', () => {
    it('matches regardless of case', () => {
      expect(resolveFK(fkMaps, 'organizations', 'MITRE')).toBe('org-mitre-123')
      expect(resolveFK(fkMaps, 'organizations', 'Mitre')).toBe('org-mitre-123')
      expect(resolveFK(fkMaps, 'technologies', 'INSPEC')).toBe('tech-inspec-001')
      expect(resolveFK(fkMaps, 'technologies', 'InSpec')).toBe('tech-inspec-001')
    })

    it('handles mixed case target names', () => {
      expect(resolveFK(fkMaps, 'targets', 'Red Hat Enterprise Linux 8')).toBe('tgt-rhel8-001')
      expect(resolveFK(fkMaps, 'targets', 'RED HAT ENTERPRISE LINUX 8')).toBe('tgt-rhel8-001')
    })
  })

  describe('not found cases', () => {
    it('returns null for unknown names', () => {
      expect(resolveFK(fkMaps, 'organizations', 'unknown-org')).toBeNull()
      expect(resolveFK(fkMaps, 'technologies', 'puppet')).toBeNull()
      expect(resolveFK(fkMaps, 'targets', 'windows server 2022')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(resolveFK(fkMaps, 'organizations', '')).toBeNull()
    })

    it('returns null for whitespace-only string', () => {
      expect(resolveFK(fkMaps, 'organizations', '   ')).toBeNull()
    })
  })

  describe('alias handling', () => {
    it('resolves alternate names to same ID', () => {
      // Both "mitre" and "the mitre corporation" should resolve to same ID
      const mitre1 = resolveFK(fkMaps, 'organizations', 'mitre')
      const mitre2 = resolveFK(fkMaps, 'organizations', 'the mitre corporation')
      expect(mitre1).toBe(mitre2)
    })

    it('resolves team aliases', () => {
      const team1 = resolveFK(fkMaps, 'teams', 'saf team')
      const team2 = resolveFK(fkMaps, 'teams', 'mitre saf team')
      expect(team1).toBe(team2)
    })
  })
})

describe('FkMaps structure', () => {
  it('has all required collections', () => {
    const fkMaps = createMockFkMaps()

    expect(fkMaps).toHaveProperty('organizations')
    expect(fkMaps).toHaveProperty('teams')
    expect(fkMaps).toHaveProperty('standards')
    expect(fkMaps).toHaveProperty('technologies')
    expect(fkMaps).toHaveProperty('targets')
    expect(fkMaps).toHaveProperty('categories')
    expect(fkMaps).toHaveProperty('capabilities')
    expect(fkMaps).toHaveProperty('tags')
  })

  it('all values are Maps', () => {
    const fkMaps = createMockFkMaps()

    for (const key of Object.keys(fkMaps) as Array<keyof FkMaps>) {
      expect(fkMaps[key]).toBeInstanceOf(Map)
    }
  })
})

// Note: getPocketBase and loadFkMaps require integration testing
// with a running Pocketbase instance and are tested in e2e tests
describe('getPocketBase (integration)', () => {
  it.skip('connects to Pocketbase with valid credentials', async () => {
    // This test requires a running Pocketbase instance
    // Run manually with: pnpm --filter @saf-site/cli test -- --run pocketbase.spec.ts
  })

  it.skip('throws error when Pocketbase is not running', async () => {
    // This test verifies error handling when PB is unavailable
  })
})

describe('loadFkMaps (integration)', () => {
  it.skip('loads all FK maps from database', async () => {
    // This test requires a running Pocketbase instance
    // Verifies that all collections are fetched and mapped correctly
  })
})

describe('checkConnection (integration)', () => {
  it.skip('returns true when Pocketbase is running', async () => {
    // Integration test
  })

  it.skip('returns false when Pocketbase is not running', async () => {
    // Integration test
  })
})
