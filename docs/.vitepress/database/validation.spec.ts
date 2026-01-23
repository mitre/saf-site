/**
 * Validation Module Tests (Phase 1.3)
 *
 * TDD tests for entity validation functions
 */

import { describe, it, expect } from 'vitest'
import {
  validateSlug,
  validateEntity,
  validateOrganization,
  validateTarget,
  validateStandard,
  validateContent,
  auditSlug,
  auditEntity,
  type ValidationResult,
  type AuditResult
} from './validation.js'

// ============================================================================
// VALIDATE SLUG (existing, verify still works)
// ============================================================================

describe('validateSlug', () => {
  it('validates correct slug format', () => {
    const result = validateSlug('rhel-9-stig')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects uppercase characters', () => {
    const result = validateSlug('RHEL-9-stig')
    expect(result.valid).toBe(false)
  })

  it('rejects consecutive hyphens', () => {
    const result = validateSlug('rhel--9-stig')
    expect(result.valid).toBe(false)
  })

  it('warns about non-standard abbreviations', () => {
    const result = validateSlug('red-hat-9-stig')
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some(w => w.includes('rhel'))).toBe(true)
  })

  it('warns when slug does not end with known standard', () => {
    const result = validateSlug('rhel-9-custom')
    expect(result.warnings.some(w => w.includes('standard identifier'))).toBe(true)
  })
})

// ============================================================================
// VALIDATE ENTITY (generic validation pattern)
// ============================================================================

describe('validateEntity', () => {
  it('validates organization input', () => {
    const result = validateEntity('organization', {
      name: 'MITRE',
      slug: 'mitre'
    })
    expect(result.valid).toBe(true)
  })

  it('validates target input', () => {
    const result = validateEntity('target', {
      name: 'Red Hat Enterprise Linux 9',
      slug: 'rhel-9'
    })
    expect(result.valid).toBe(true)
  })

  it('validates content input', () => {
    const result = validateEntity('content', {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation'
    })
    expect(result.valid).toBe(true)
  })

  it('returns errors for invalid input', () => {
    const result = validateEntity('organization', {
      name: '',  // required
      slug: 'valid-slug'
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('returns warnings for convention issues', () => {
    const result = validateEntity('content', {
      name: 'Red Hat 9 STIG',
      slug: 'red-hat-9-stig',  // should use rhel
      contentType: 'validation'
    })
    expect(result.valid).toBe(true)  // valid but with warnings
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('throws for unknown entity type', () => {
    expect(() => validateEntity('unknown' as any, {})).toThrow()
  })
})

// ============================================================================
// VALIDATE ORGANIZATION
// ============================================================================

describe('validateOrganization', () => {
  it('validates minimal organization', () => {
    const result = validateOrganization({
      name: 'MITRE',
      slug: 'mitre'
    })
    expect(result.valid).toBe(true)
    expect(result.data?.name).toBe('MITRE')
  })

  it('validates complete organization', () => {
    const result = validateOrganization({
      name: 'MITRE Corporation',
      slug: 'mitre',
      description: 'Not-for-profit organization',
      website: 'https://mitre.org',
      orgType: 'government'
    })
    expect(result.valid).toBe(true)
  })

  it('rejects invalid website URL', () => {
    const result = validateOrganization({
      name: 'Test',
      slug: 'test',
      website: 'not-a-url'
    })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid orgType', () => {
    const result = validateOrganization({
      name: 'Test',
      slug: 'test',
      orgType: 'invalid' as any
    })
    expect(result.valid).toBe(false)
  })
})

// ============================================================================
// VALIDATE TARGET
// ============================================================================

describe('validateTarget', () => {
  it('validates minimal target', () => {
    const result = validateTarget({
      name: 'Red Hat Enterprise Linux 9',
      slug: 'rhel-9'
    })
    expect(result.valid).toBe(true)
  })

  it('validates target with FK references', () => {
    const result = validateTarget({
      name: 'Red Hat Enterprise Linux 9',
      slug: 'rhel-9',
      category: 'cat_os',
      vendor: 'org_redhat'
    })
    expect(result.valid).toBe(true)
    expect(result.data?.category).toBe('cat_os')
  })

  it('warns about non-standard target abbreviations in slug', () => {
    const result = validateTarget({
      name: 'Red Hat Enterprise Linux 9',
      slug: 'red-hat-enterprise-linux-9'  // should be rhel-9
    })
    expect(result.valid).toBe(true)  // valid but with warning
    expect(result.warnings.some(w => w.includes('rhel'))).toBe(true)
  })
})

// ============================================================================
// VALIDATE STANDARD
// ============================================================================

describe('validateStandard', () => {
  it('validates minimal standard', () => {
    const result = validateStandard({
      name: 'Security Technical Implementation Guide',
      slug: 'stig'
    })
    expect(result.valid).toBe(true)
  })

  it('validates complete standard', () => {
    const result = validateStandard({
      name: 'Security Technical Implementation Guide',
      shortName: 'STIG',
      slug: 'stig',
      description: 'DISA security configuration standard',
      website: 'https://public.cyber.mil/stigs/',
      organization: 'org_disa',
      standardType: 'government'
    })
    expect(result.valid).toBe(true)
  })

  it('rejects invalid standardType', () => {
    const result = validateStandard({
      name: 'Test',
      slug: 'test',
      standardType: 'invalid' as any
    })
    expect(result.valid).toBe(false)
  })
})

// ============================================================================
// VALIDATE CONTENT (updated to use new schemas)
// ============================================================================

describe('validateContent', () => {
  it('validates minimal validation profile', () => {
    const result = validateContent({
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation'
    })
    expect(result.valid).toBe(true)
  })

  it('validates complete validation profile', () => {
    const result = validateContent({
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      status: 'active',
      version: '1.0.0',
      target: 'target_rhel9',
      standard: 'std_stig',
      technology: 'tech_inspec',
      github: 'https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline',
      controlCount: 452,
      license: 'Apache-2.0'
    })
    expect(result.valid).toBe(true)
  })

  it('validates hardening content', () => {
    const result = validateContent({
      name: 'Ansible RHEL 9 STIG',
      slug: 'ansible-rhel-9-stig',
      contentType: 'hardening',
      automationLevel: 'full'
    })
    expect(result.valid).toBe(true)
  })

  it('rejects invalid contentType', () => {
    const result = validateContent({
      name: 'Test',
      slug: 'test',
      contentType: 'invalid' as any
    })
    expect(result.valid).toBe(false)
  })

  it('warns about non-standard slug conventions', () => {
    const result = validateContent({
      name: 'Red Hat 9 STIG',
      slug: 'red-hat-9-stig',  // should use rhel
      contentType: 'validation'
    })
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// AUDIT SLUG (existing, verify still works)
// ============================================================================

describe('auditSlug', () => {
  it('returns compliant for correct slug', () => {
    const result = auditSlug('rhel-9-stig', 'Red Hat Enterprise Linux 9 STIG')
    expect(result.compliant).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('returns issues for non-compliant slug', () => {
    const result = auditSlug('red-hat-9-stig', 'Red Hat Enterprise Linux 9 STIG')
    expect(result.compliant).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('detects windows naming convention issues', () => {
    const result = auditSlug('windows-2019-stig', 'Windows Server 2019 STIG')
    expect(result.issues.some(i => i.includes('win'))).toBe(true)
  })
})

// ============================================================================
// AUDIT ENTITY (generic audit pattern)
// ============================================================================

describe('auditEntity', () => {
  it('audits content record for convention compliance', () => {
    const result = auditEntity('content', {
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation'
    })
    expect(result.compliant).toBe(true)
  })

  it('returns issues for non-compliant content', () => {
    const result = auditEntity('content', {
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'red-hat-9-stig',  // wrong convention
      contentType: 'validation'
    })
    expect(result.compliant).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('audits target for convention compliance', () => {
    const result = auditEntity('target', {
      name: 'Red Hat Enterprise Linux 9',
      slug: 'rhel-9'
    })
    expect(result.compliant).toBe(true)
  })

  it('suggests corrected slug', () => {
    const result = auditEntity('content', {
      name: 'Red Hat Enterprise Linux 9 STIG',
      slug: 'red-hat-enterprise-linux-9-stig',
      contentType: 'validation'
    })
    expect(result.suggestedSlug).toBe('rhel-9-stig')
  })
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

describe('Type exports', () => {
  it('ValidationResult has expected shape', () => {
    const result: ValidationResult<{ name: string }> = {
      valid: true,
      data: { name: 'Test' },
      warnings: []
    }
    expect(result.valid).toBe(true)
  })

  it('AuditResult has expected shape', () => {
    const result: AuditResult = {
      compliant: true,
      issues: [],
      suggestedSlug: 'test-slug'
    }
    expect(result.compliant).toBe(true)
  })
})
