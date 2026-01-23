/**
 * Entity Schema Tests (Phase 1.1)
 *
 * TDD tests for Zod validation schemas
 * These tests are written FIRST, then schemas implemented to pass them
 */

import { describe, it, expect } from 'vitest'
import {
  organizationSchema,
  targetSchema,
  standardSchema,
  technologySchema,
  teamSchema,
  tagSchema,
  contentSchema,
  // Input schemas (for create/update)
  organizationInputSchema,
  targetInputSchema,
  standardInputSchema,
  technologyInputSchema,
  teamInputSchema,
  tagInputSchema,
  contentInputSchema,
  // Pocketbase record schemas (Phase 1.2)
  pbRecordSchema,
  pbOrganizationSchema,
  pbTargetSchema,
  pbContentSchema,
  pbContentWithExpand,
  // Type exports
  type Organization,
  type Target,
  type Standard,
  type Technology,
  type Team,
  type Tag,
  type ContentRecord,
  type OrganizationInput,
  type TargetInput,
  type PocketbaseRecord,
  type PBContent,
  type PBContentExpanded,
} from './schemas.js'

// ============================================================================
// ORGANIZATION SCHEMA
// ============================================================================

describe('organizationSchema', () => {
  it('validates a complete organization', () => {
    const org = {
      id: 'org_mitre',
      name: 'MITRE',
      slug: 'mitre',
      description: 'Not-for-profit organization',
      website: 'https://mitre.org',
      logo: 'https://example.com/logo.png',
      orgType: 'government'
    }
    const result = organizationSchema.safeParse(org)
    expect(result.success).toBe(true)
  })

  it('validates with minimal required fields', () => {
    const org = {
      id: 'org_test',
      name: 'Test Org',
      slug: 'test-org'
    }
    const result = organizationSchema.safeParse(org)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const org = { id: 'org_test' }
    const result = organizationSchema.safeParse(org)
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug format', () => {
    const org = {
      id: 'org_test',
      name: 'Test',
      slug: 'Invalid Slug!' // spaces and special chars
    }
    const result = organizationSchema.safeParse(org)
    expect(result.success).toBe(false)
  })

  it('rejects invalid website URL', () => {
    const org = {
      id: 'org_test',
      name: 'Test',
      slug: 'test',
      website: 'not-a-url'
    }
    const result = organizationSchema.safeParse(org)
    expect(result.success).toBe(false)
  })

  it('accepts valid orgType values', () => {
    const orgTypes = ['vendor', 'government', 'community', 'standards_body']
    for (const orgType of orgTypes) {
      const org = { id: 'org_test', name: 'Test', slug: 'test', orgType }
      const result = organizationSchema.safeParse(org)
      expect(result.success).toBe(true)
    }
  })
})

describe('organizationInputSchema', () => {
  it('does not require id for input', () => {
    const input = {
      name: 'New Org',
      slug: 'new-org'
    }
    const result = organizationInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// TARGET SCHEMA
// ============================================================================

describe('targetSchema', () => {
  it('validates a complete target', () => {
    const target = {
      id: 'target_rhel9',
      name: 'Red Hat Enterprise Linux 9',
      slug: 'rhel-9',
      description: 'Enterprise Linux distribution',
      category: 'cat_os',
      vendor: 'org_redhat',
      website: 'https://redhat.com/rhel',
      logo: 'https://example.com/rhel.png'
    }
    const result = targetSchema.safeParse(target)
    expect(result.success).toBe(true)
  })

  it('validates with minimal required fields', () => {
    const target = {
      id: 'target_test',
      name: 'Test Target',
      slug: 'test-target'
    }
    const result = targetSchema.safeParse(target)
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const target = {
      id: 'target_test',
      name: '',
      slug: 'test'
    }
    const result = targetSchema.safeParse(target)
    expect(result.success).toBe(false)
  })

  it('enforces slug conventions', () => {
    const target = {
      id: 'target_test',
      name: 'Test',
      slug: 'UPPERCASE-SLUG' // should be lowercase
    }
    const result = targetSchema.safeParse(target)
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// STANDARD SCHEMA
// ============================================================================

describe('standardSchema', () => {
  it('validates a complete standard', () => {
    const standard = {
      id: 'std_stig',
      name: 'Security Technical Implementation Guide',
      shortName: 'STIG',
      slug: 'stig',
      description: 'DISA security configuration standard',
      website: 'https://public.cyber.mil/stigs/',
      logo: 'https://example.com/stig.png',
      organization: 'org_disa',
      standardType: 'government'
    }
    const result = standardSchema.safeParse(standard)
    expect(result.success).toBe(true)
  })

  it('validates with minimal required fields', () => {
    const standard = {
      id: 'std_test',
      name: 'Test Standard',
      slug: 'test-standard'
    }
    const result = standardSchema.safeParse(standard)
    expect(result.success).toBe(true)
  })

  it('accepts valid standardType values', () => {
    const types = ['regulatory', 'industry', 'government']
    for (const standardType of types) {
      const std = { id: 'std_test', name: 'Test', slug: 'test', standardType }
      const result = standardSchema.safeParse(std)
      expect(result.success).toBe(true)
    }
  })
})

// ============================================================================
// TECHNOLOGY SCHEMA
// ============================================================================

describe('technologySchema', () => {
  it('validates a complete technology', () => {
    const tech = {
      id: 'tech_inspec',
      name: 'Chef InSpec',
      slug: 'inspec',
      description: 'Infrastructure testing framework',
      website: 'https://inspec.io',
      logo: 'https://example.com/inspec.png',
      github: 'https://github.com/inspec/inspec',
      organization: 'org_progress',
      documentationUrl: 'https://docs.chef.io/inspec/'
    }
    const result = technologySchema.safeParse(tech)
    expect(result.success).toBe(true)
  })

  it('validates with minimal required fields', () => {
    const tech = {
      id: 'tech_test',
      name: 'Test Tech',
      slug: 'test-tech'
    }
    const result = technologySchema.safeParse(tech)
    expect(result.success).toBe(true)
  })

  it('validates github URL format', () => {
    const tech = {
      id: 'tech_test',
      name: 'Test',
      slug: 'test',
      github: 'not-a-url'
    }
    const result = technologySchema.safeParse(tech)
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// TEAM SCHEMA
// ============================================================================

describe('teamSchema', () => {
  it('validates a complete team', () => {
    const team = {
      id: 'team_saf',
      name: 'MITRE SAF Team',
      slug: 'saf-team',
      description: 'Security Automation Framework team',
      organization: 'org_mitre',
      website: 'https://saf.mitre.org',
      logo: 'https://example.com/saf.png'
    }
    const result = teamSchema.safeParse(team)
    expect(result.success).toBe(true)
  })

  it('validates with minimal required fields', () => {
    const team = {
      id: 'team_test',
      name: 'Test Team',
      slug: 'test-team'
    }
    const result = teamSchema.safeParse(team)
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// TAG SCHEMA
// ============================================================================

describe('tagSchema', () => {
  it('validates a complete tag', () => {
    const tag = {
      id: 'tag_linux',
      name: 'linux',
      slug: 'linux',
      displayName: 'Linux',
      description: 'Linux-related content',
      tagCategory: 'platform',
      badgeColor: 'blue'
    }
    const result = tagSchema.safeParse(tag)
    expect(result.success).toBe(true)
  })

  it('validates with minimal required fields', () => {
    const tag = {
      id: 'tag_test',
      name: 'test',
      slug: 'test'
    }
    const result = tagSchema.safeParse(tag)
    expect(result.success).toBe(true)
  })

  it('accepts valid tagCategory values', () => {
    const categories = ['platform', 'compliance', 'feature', 'technology']
    for (const tagCategory of categories) {
      const tag = { id: 'tag_test', name: 'test', slug: 'test', tagCategory }
      const result = tagSchema.safeParse(tag)
      expect(result.success).toBe(true)
    }
  })
})

// ============================================================================
// CONTENT SCHEMA (extends existing validation.ts)
// ============================================================================

describe('contentSchema', () => {
  it('validates a complete validation profile', () => {
    const content = {
      id: 'content_rhel9_stig',
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'rhel-9-stig',
      description: 'InSpec profile for RHEL 9 STIG',
      contentType: 'validation',
      status: 'active',
      version: '1.0.0',
      target: 'target_rhel9',
      standard: 'std_stig',
      technology: 'tech_inspec',
      vendor: 'org_mitre',
      maintainer: 'team_saf',
      github: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
      controlCount: 452,
      license: 'Apache-2.0'
    }
    const result = contentSchema.safeParse(content)
    expect(result.success).toBe(true)
  })

  it('validates a hardening content record', () => {
    const content = {
      id: 'content_ansible_rhel9_stig',
      name: 'Ansible RHEL 9 STIG Hardening',
      slug: 'ansible-rhel-9-stig',
      description: 'Ansible playbook for RHEL 9 STIG',
      contentType: 'hardening',
      status: 'active',
      target: 'target_rhel9',
      standard: 'std_stig',
      technology: 'tech_ansible',
      automationLevel: 'full'
    }
    const result = contentSchema.safeParse(content)
    expect(result.success).toBe(true)
  })

  it('validates with minimal required fields', () => {
    const content = {
      id: 'content_test',
      name: 'Test Content',
      slug: 'test-content',
      contentType: 'validation'
    }
    const result = contentSchema.safeParse(content)
    expect(result.success).toBe(true)
  })

  it('rejects invalid contentType', () => {
    const content = {
      id: 'content_test',
      name: 'Test',
      slug: 'test',
      contentType: 'invalid'
    }
    const result = contentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const content = {
      id: 'content_test',
      name: 'Test',
      slug: 'test',
      contentType: 'validation',
      status: 'invalid'
    }
    const result = contentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })

  it('validates automationLevel for hardening', () => {
    const levels = ['full', 'partial', 'manual']
    for (const automationLevel of levels) {
      const content = {
        id: 'content_test',
        name: 'Test',
        slug: 'test',
        contentType: 'hardening',
        automationLevel
      }
      const result = contentSchema.safeParse(content)
      expect(result.success).toBe(true)
    }
  })

  it('enforces slug naming conventions', () => {
    const content = {
      id: 'content_test',
      name: 'Test',
      slug: 'Invalid--Slug', // consecutive hyphens
      contentType: 'validation'
    }
    const result = contentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })

  it('validates version is semver format', () => {
    const validVersions = ['1.0.0', '0.1.0', '2.3.4', '10.20.30']
    for (const version of validVersions) {
      const content = {
        id: 'content_test',
        name: 'Test',
        slug: 'test',
        contentType: 'validation',
        version
      }
      const result = contentSchema.safeParse(content)
      expect(result.success).toBe(true)
    }
  })

  it('validates controlCount is positive integer', () => {
    const content = {
      id: 'content_test',
      name: 'Test',
      slug: 'test',
      contentType: 'validation',
      controlCount: -1
    }
    const result = contentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })
})

describe('contentInputSchema', () => {
  it('does not require id for input', () => {
    const input = {
      name: 'New Content',
      slug: 'new-content',
      contentType: 'validation'
    }
    const result = contentInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('allows FK references as strings', () => {
    const input = {
      name: 'New Content',
      slug: 'new-content',
      contentType: 'validation',
      target: 'target_rhel9',
      standard: 'std_stig'
    }
    const result = contentInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// TYPE INFERENCE TESTS
// ============================================================================

describe('Type inference', () => {
  it('Organization type has expected shape', () => {
    // This is a compile-time check - if types are wrong, TS will error
    const org: Organization = {
      id: 'org_test',
      name: 'Test',
      slug: 'test',
      description: undefined,
      website: undefined,
      logo: undefined,
      orgType: undefined
    }
    expect(org.id).toBe('org_test')
  })

  it('Target type has expected shape', () => {
    const target: Target = {
      id: 'target_test',
      name: 'Test',
      slug: 'test',
      description: undefined,
      category: undefined,
      vendor: undefined,
      website: undefined,
      logo: undefined
    }
    expect(target.id).toBe('target_test')
  })

  it('ContentRecord type has expected shape', () => {
    const content: ContentRecord = {
      id: 'content_test',
      name: 'Test',
      slug: 'test',
      contentType: 'validation',
      status: 'active',
      description: undefined,
      longDescription: undefined,
      version: undefined,
      target: undefined,
      standard: undefined,
      technology: undefined,
      vendor: undefined,
      maintainer: undefined,
      github: undefined,
      documentationUrl: undefined,
      referenceUrl: undefined,
      readmeUrl: undefined,
      readmeMarkdown: undefined,
      controlCount: undefined,
      stigId: undefined,
      benchmarkVersion: undefined,
      automationLevel: undefined,
      isFeatured: undefined,
      featuredOrder: undefined,
      license: undefined,
      releaseDate: undefined,
      deprecatedAt: undefined
    }
    expect(content.contentType).toBe('validation')
  })

  it('Input types omit id', () => {
    const input: OrganizationInput = {
      name: 'Test',
      slug: 'test'
    }
    // @ts-expect-error - id should not be allowed on input type
    input.id = 'should-error'
    expect(input.name).toBe('Test')
  })
})

// ============================================================================
// PHASE 1.2: POCKETBASE COMPATIBILITY
// ============================================================================

describe('Pocketbase Record Schema', () => {
  it('validates Pocketbase metadata fields', () => {
    const pbRecord = {
      id: 'abc123',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_abc',
      collectionName: 'organizations'
    }
    const result = pbRecordSchema.safeParse(pbRecord)
    expect(result.success).toBe(true)
  })

  it('validates with optional expand field', () => {
    const pbRecord = {
      id: 'abc123',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_abc',
      collectionName: 'organizations',
      expand: {}
    }
    const result = pbRecordSchema.safeParse(pbRecord)
    expect(result.success).toBe(true)
  })
})

describe('pbOrganizationSchema', () => {
  it('validates Pocketbase organization response', () => {
    const pbOrg = {
      id: 'org_mitre',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_orgs',
      collectionName: 'organizations',
      name: 'MITRE',
      slug: 'mitre',
      description: 'Not-for-profit',
      website: 'https://mitre.org',
      org_type: 'government'
    }
    const result = pbOrganizationSchema.safeParse(pbOrg)
    expect(result.success).toBe(true)
  })

  it('handles Pocketbase snake_case field names', () => {
    const pbOrg = {
      id: 'org_test',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_orgs',
      collectionName: 'organizations',
      name: 'Test',
      slug: 'test',
      org_type: 'vendor'  // snake_case from Pocketbase
    }
    const result = pbOrganizationSchema.safeParse(pbOrg)
    expect(result.success).toBe(true)
  })
})

describe('pbTargetSchema', () => {
  it('validates Pocketbase target with FK references', () => {
    const pbTarget = {
      id: 'target_rhel9',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_targets',
      collectionName: 'targets',
      name: 'Red Hat Enterprise Linux 9',
      slug: 'rhel-9',
      category: 'cat_os',  // FK as string ID
      vendor: 'org_redhat'  // FK as string ID
    }
    const result = pbTargetSchema.safeParse(pbTarget)
    expect(result.success).toBe(true)
  })
})

describe('pbContentSchema', () => {
  it('validates Pocketbase content response', () => {
    const pbContent = {
      id: 'content_rhel9_stig',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_content',
      collectionName: 'content',
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      status: 'active',
      target: 'target_rhel9',
      standard: 'std_stig',
      technology: 'tech_inspec',
      vendor: 'org_mitre',
      maintainer: 'team_saf',
      github: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
      control_count: 452,
      license: 'Apache-2.0'
    }
    const result = pbContentSchema.safeParse(pbContent)
    expect(result.success).toBe(true)
  })

  it('handles all snake_case field names from Pocketbase', () => {
    const pbContent = {
      id: 'content_test',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_content',
      collectionName: 'content',
      name: 'Test Content',
      slug: 'test-content',
      content_type: 'hardening',
      long_description: 'Long description here',
      documentation_url: 'https://docs.example.com',
      reference_url: 'https://ref.example.com',
      readme_url: 'https://raw.github.com/readme.md',
      readme_markdown: '# README',
      control_count: 100,
      stig_id: 'RHEL-09-010001',
      benchmark_version: 'V1R1',
      automation_level: 'full',
      is_featured: true,
      featured_order: 1,
      release_date: '2024-01-01',
      deprecated_at: null
    }
    const result = pbContentSchema.safeParse(pbContent)
    expect(result.success).toBe(true)
  })
})

describe('pbContentWithExpand', () => {
  it('validates content with expanded FK relations', () => {
    const pbContentExpanded = {
      id: 'content_rhel9_stig',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_content',
      collectionName: 'content',
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      target: 'target_rhel9',
      standard: 'std_stig',
      vendor: 'org_mitre',
      expand: {
        target: {
          id: 'target_rhel9',
          created: '2024-01-15 10:30:00.000Z',
          updated: '2024-01-15 10:30:00.000Z',
          collectionId: 'col_targets',
          collectionName: 'targets',
          name: 'Red Hat Enterprise Linux 9',
          slug: 'rhel-9'
        },
        standard: {
          id: 'std_stig',
          created: '2024-01-15 10:30:00.000Z',
          updated: '2024-01-15 10:30:00.000Z',
          collectionId: 'col_standards',
          collectionName: 'standards',
          name: 'Security Technical Implementation Guide',
          short_name: 'STIG',
          slug: 'stig'
        },
        vendor: {
          id: 'org_mitre',
          created: '2024-01-15 10:30:00.000Z',
          updated: '2024-01-15 10:30:00.000Z',
          collectionId: 'col_orgs',
          collectionName: 'organizations',
          name: 'MITRE',
          slug: 'mitre'
        }
      }
    }
    const result = pbContentWithExpand.safeParse(pbContentExpanded)
    expect(result.success).toBe(true)
  })

  it('handles partial expand (not all FKs expanded)', () => {
    const pbContentPartial = {
      id: 'content_test',
      created: '2024-01-15 10:30:00.000Z',
      updated: '2024-01-15 10:30:00.000Z',
      collectionId: 'col_content',
      collectionName: 'content',
      name: 'Test',
      slug: 'test',
      content_type: 'validation',
      target: 'target_test',
      expand: {
        target: {
          id: 'target_test',
          created: '2024-01-15 10:30:00.000Z',
          updated: '2024-01-15 10:30:00.000Z',
          collectionId: 'col_targets',
          collectionName: 'targets',
          name: 'Test Target',
          slug: 'test-target'
        }
        // standard and vendor not expanded
      }
    }
    const result = pbContentWithExpand.safeParse(pbContentPartial)
    expect(result.success).toBe(true)
  })
})

describe('Pocketbase type compatibility', () => {
  it('PocketbaseRecord type has metadata fields', () => {
    const record: PocketbaseRecord = {
      id: 'test',
      created: '2024-01-15',
      updated: '2024-01-15',
      collectionId: 'col',
      collectionName: 'test'
    }
    expect(record.collectionName).toBe('test')
  })

  it('PBContent type combines content + metadata', () => {
    const content: PBContent = {
      id: 'content_test',
      created: '2024-01-15',
      updated: '2024-01-15',
      collectionId: 'col',
      collectionName: 'content',
      name: 'Test',
      slug: 'test',
      content_type: 'validation'
    }
    expect(content.content_type).toBe('validation')
    expect(content.collectionName).toBe('content')
  })

  it('PBContentExpanded includes expand object', () => {
    const content: PBContentExpanded = {
      id: 'content_test',
      created: '2024-01-15',
      updated: '2024-01-15',
      collectionId: 'col',
      collectionName: 'content',
      name: 'Test',
      slug: 'test',
      content_type: 'validation',
      expand: {
        target: {
          id: 'target_test',
          created: '2024-01-15',
          updated: '2024-01-15',
          collectionId: 'col',
          collectionName: 'targets',
          name: 'Test Target',
          slug: 'test'
        }
      }
    }
    expect(content.expand?.target?.name).toBe('Test Target')
  })
})
