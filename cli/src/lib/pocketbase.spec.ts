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

// Integration tests using test Pocketbase instance (port 8091)
// Global setup starts Pocketbase and sets PB_URL environment variable
import { getPocketBase, loadFkMaps, checkConnection } from './pocketbase.js'

describe('getPocketBase (integration)', () => {
  it('connects to Pocketbase with valid credentials', async () => {
    const pb = await getPocketBase()
    expect(pb).toBeDefined()
    expect(pb.authStore.isValid).toBe(true)
  })

  it('returns cached instance on subsequent calls', async () => {
    const pb1 = await getPocketBase()
    const pb2 = await getPocketBase()
    // Should return the same cached instance
    expect(pb1).toBe(pb2)
  })
})

describe('loadFkMaps (integration)', () => {
  it('loads all FK maps from database', async () => {
    const maps = await loadFkMaps()

    // Verify all maps are populated
    expect(maps.organizations.size).toBeGreaterThan(0)
    expect(maps.teams.size).toBeGreaterThan(0)
    expect(maps.standards.size).toBeGreaterThan(0)
    expect(maps.technologies.size).toBeGreaterThan(0)
    expect(maps.targets.size).toBeGreaterThan(0)
    expect(maps.categories.size).toBeGreaterThan(0)
    expect(maps.capabilities.size).toBeGreaterThan(0)
    expect(maps.tags.size).toBeGreaterThan(0)
  })

  it('maps are lowercase keyed', async () => {
    const maps = await loadFkMaps()

    // Check that all keys are lowercase (required for resolveFK)
    for (const [key] of maps.organizations) {
      expect(key).toBe(key.toLowerCase())
    }
  })
})

describe('checkConnection (integration)', () => {
  it('returns true when Pocketbase is running', async () => {
    const isAvailable = await checkConnection()
    expect(isAvailable).toBe(true)
  })
})

// ============================================================================
// CRUD OPERATIONS (Phase 2.2)
// ============================================================================

import {
  createContent,
  updateContent,
  getContentBySlug,
  listContent,
  type CreateContentInput,
  type UpdateContentInput,
  type ListContentOptions
} from './pocketbase.js'

describe('getContentBySlug', () => {
  it('returns content record when slug exists', async () => {
    // Mock implementation will return a record
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue({
          id: 'content-123',
          slug: 'rhel-9-stig',
          name: 'RHEL 9 STIG',
          content_type: 'validation'
        })
      })
    }

    const result = await getContentBySlug('rhel-9-stig', mockPb as any)
    expect(result).not.toBeNull()
    expect(result?.slug).toBe('rhel-9-stig')
    expect(result?.name).toBe('RHEL 9 STIG')
  })

  it('returns null when slug does not exist', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })
    }

    const result = await getContentBySlug('nonexistent-slug', mockPb as any)
    expect(result).toBeNull()
  })

  it('expands FK relations when requested', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue({
          id: 'content-123',
          slug: 'rhel-9-stig',
          name: 'RHEL 9 STIG',
          content_type: 'validation',
          expand: {
            target: { id: 'tgt-1', name: 'RHEL 9' },
            standard: { id: 'std-1', name: 'DISA STIG' }
          }
        })
      })
    }

    const result = await getContentBySlug('rhel-9-stig', mockPb as any, {
      expand: ['target', 'standard']
    })

    expect(result?.expand?.target?.name).toBe('RHEL 9')
    expect(result?.expand?.standard?.name).toBe('DISA STIG')
  })
})

describe('listContent', () => {
  it('returns all content when no filters provided', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          { id: '1', slug: 'rhel-9-stig', content_type: 'validation' },
          { id: '2', slug: 'ansible-rhel-9', content_type: 'hardening' }
        ])
      })
    }

    const result = await listContent({}, mockPb as any)
    expect(result).toHaveLength(2)
  })

  it('filters by content_type', async () => {
    const mockGetFullList = vi.fn().mockResolvedValue([
      { id: '1', slug: 'rhel-9-stig', content_type: 'validation' }
    ])
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFullList: mockGetFullList
      })
    }

    await listContent({ contentType: 'validation' }, mockPb as any)

    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.stringContaining('content_type = "validation"')
      })
    )
  })

  it('filters by status', async () => {
    const mockGetFullList = vi.fn().mockResolvedValue([])
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFullList: mockGetFullList
      })
    }

    await listContent({ status: 'active' }, mockPb as any)

    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.stringContaining('status = "active"')
      })
    )
  })

  it('combines multiple filters with AND', async () => {
    const mockGetFullList = vi.fn().mockResolvedValue([])
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFullList: mockGetFullList
      })
    }

    await listContent({ contentType: 'validation', status: 'active' }, mockPb as any)

    const callArgs = mockGetFullList.mock.calls[0][0]
    expect(callArgs.filter).toContain('content_type = "validation"')
    expect(callArgs.filter).toContain('status = "active"')
    expect(callArgs.filter).toContain('&&')
  })

  it('expands FK relations when requested', async () => {
    const mockGetFullList = vi.fn().mockResolvedValue([])
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFullList: mockGetFullList
      })
    }

    await listContent({ expand: ['target', 'standard', 'vendor'] }, mockPb as any)

    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        expand: 'target,standard,vendor'
      })
    )
  })

  it('sorts by specified field', async () => {
    const mockGetFullList = vi.fn().mockResolvedValue([])
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFullList: mockGetFullList
      })
    }

    await listContent({ sort: '-created' }, mockPb as any)

    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: '-created'
      })
    )
  })

  it('defaults to sorting by name', async () => {
    const mockGetFullList = vi.fn().mockResolvedValue([])
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        getFullList: mockGetFullList
      })
    }

    await listContent({}, mockPb as any)

    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'name'
      })
    )
  })
})

describe('createContent', () => {
  it('creates content with required fields', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'new-content-123',
      slug: 'rhel-9-stig',
      name: 'RHEL 9 STIG',
      content_type: 'validation'
    })
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        create: mockCreate
      })
    }

    const input: CreateContentInput = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation'
    }

    const result = await createContent(input, mockPb as any)

    expect(result.id).toBe('new-content-123')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation'
      })
    )
  })

  it('creates content with all optional fields', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'new-content-123',
      slug: 'rhel-9-stig',
      name: 'RHEL 9 STIG',
      content_type: 'validation'
    })
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        create: mockCreate
      })
    }

    const input: CreateContentInput = {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      description: 'InSpec profile for RHEL 9',
      version: '1.0.0',
      status: 'active',
      github: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
      controlCount: 452,
      target: 'tgt-rhel9-id',
      standard: 'std-stig-id',
      technology: 'tech-inspec-id',
      vendor: 'org-mitre-id',
      maintainer: 'team-saf-id'
    }

    await createContent(input, mockPb as any)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'RHEL 9 STIG',
        slug: 'rhel-9-stig',
        content_type: 'validation',
        description: 'InSpec profile for RHEL 9',
        version: '1.0.0',
        status: 'active',
        github: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
        control_count: 452,
        target: 'tgt-rhel9-id',
        standard: 'std-stig-id',
        technology: 'tech-inspec-id',
        vendor: 'org-mitre-id',
        maintainer: 'team-saf-id'
      })
    )
  })

  it('validates input before creating', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        create: vi.fn()
      })
    }

    const invalidInput = {
      name: '',  // Empty name - invalid
      slug: 'valid-slug',
      contentType: 'validation'
    } as CreateContentInput

    await expect(createContent(invalidInput, mockPb as any))
      .rejects.toThrow()
  })

  it('rejects invalid slug format', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        create: vi.fn()
      })
    }

    const invalidInput: CreateContentInput = {
      name: 'Valid Name',
      slug: 'INVALID--SLUG',  // Uppercase and consecutive hyphens
      contentType: 'validation'
    }

    await expect(createContent(invalidInput, mockPb as any))
      .rejects.toThrow()
  })

  it('rejects invalid contentType', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        create: vi.fn()
      })
    }

    const invalidInput = {
      name: 'Valid Name',
      slug: 'valid-slug',
      contentType: 'invalid-type'
    } as CreateContentInput

    await expect(createContent(invalidInput, mockPb as any))
      .rejects.toThrow()
  })
})

describe('updateContent', () => {
  it('updates content by ID', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      id: 'content-123',
      slug: 'rhel-9-stig',
      name: 'RHEL 9 STIG Updated',
      content_type: 'validation'
    })
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        update: mockUpdate
      })
    }

    const update: UpdateContentInput = {
      name: 'RHEL 9 STIG Updated'
    }

    const result = await updateContent('content-123', update, mockPb as any)

    expect(result.name).toBe('RHEL 9 STIG Updated')
    expect(mockUpdate).toHaveBeenCalledWith(
      'content-123',
      expect.objectContaining({
        name: 'RHEL 9 STIG Updated'
      })
    )
  })

  it('updates multiple fields at once', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      id: 'content-123',
      name: 'Updated Name',
      version: '2.0.0',
      control_count: 500
    })
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        update: mockUpdate
      })
    }

    const update: UpdateContentInput = {
      name: 'Updated Name',
      version: '2.0.0',
      controlCount: 500
    }

    await updateContent('content-123', update, mockPb as any)

    expect(mockUpdate).toHaveBeenCalledWith(
      'content-123',
      expect.objectContaining({
        name: 'Updated Name',
        version: '2.0.0',
        control_count: 500
      })
    )
  })

  it('validates slug format on update', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        update: vi.fn()
      })
    }

    const update: UpdateContentInput = {
      slug: 'INVALID--SLUG'
    }

    await expect(updateContent('content-123', update, mockPb as any))
      .rejects.toThrow()
  })

  it('validates version format on update', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        update: vi.fn()
      })
    }

    const update: UpdateContentInput = {
      version: 'not-semver'
    }

    await expect(updateContent('content-123', update, mockPb as any))
      .rejects.toThrow()
  })

  it('allows partial updates', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      id: 'content-123',
      control_count: 500
    })
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        update: mockUpdate
      })
    }

    const update: UpdateContentInput = {
      controlCount: 500
    }

    await updateContent('content-123', update, mockPb as any)

    expect(mockUpdate).toHaveBeenCalledWith(
      'content-123',
      { control_count: 500 }
    )
  })

  it('throws error for non-existent ID', async () => {
    const mockPb = {
      collection: vi.fn().mockReturnValue({
        update: vi.fn().mockRejectedValue(new Error('Record not found'))
      })
    }

    await expect(updateContent('nonexistent-id', { name: 'Test' }, mockPb as any))
      .rejects.toThrow('Record not found')
  })
})
