/**
 * Content CLI Tests (Phase 4.1)
 *
 * Tests for non-interactive CLI interface.
 * Tests argument parsing, output formatting, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseAddArgs,
  parseUpdateArgs,
  formatAddResult,
  formatUpdateResult,
  formatListResult,
  type AddCommandArgs,
  type UpdateCommandArgs,
  type OutputFormat
} from './content.cli.js'
import type { PrepareAddResult, PrepareUpdateResult } from './content.logic.js'

// ============================================================================
// PARSE ADD ARGS
// ============================================================================

describe('parseAddArgs', () => {
  it('parses GitHub URL from positional argument', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/rhel-9-stig-baseline',
      type: 'validation'
    })

    expect(args.githubUrl).toBe('https://github.com/mitre/rhel-9-stig-baseline')
    expect(args.contentType).toBe('validation')
  })

  it('parses all FK flags', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'validation',
      vendor: 'MITRE',
      standard: 'DISA STIG',
      technology: 'InSpec',
      target: 'RHEL 9',
      maintainer: 'SAF Team'
    })

    expect(args.fkNames?.vendor).toBe('MITRE')
    expect(args.fkNames?.standard).toBe('DISA STIG')
    expect(args.fkNames?.technology).toBe('InSpec')
    expect(args.fkNames?.target).toBe('RHEL 9')
    expect(args.fkNames?.maintainer).toBe('SAF Team')
  })

  it('parses override flags', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'validation',
      name: 'Custom Name',
      slug: 'custom-slug',
      version: '2.0.0',
      status: 'beta',
      controlCount: '500'
    })

    expect(args.overrides?.name).toBe('Custom Name')
    expect(args.overrides?.slug).toBe('custom-slug')
    expect(args.overrides?.version).toBe('2.0.0')
    expect(args.overrides?.status).toBe('beta')
    expect(args.overrides?.controlCount).toBe(500)
  })

  it('parses hardening-specific flags', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/ansible-test',
      type: 'hardening',
      automationLevel: 'full'
    })

    expect(args.contentType).toBe('hardening')
    expect(args.overrides?.automationLevel).toBe('full')
  })

  it('returns error for missing required URL', () => {
    const args = parseAddArgs({
      type: 'validation'
    })

    expect(args.errors).toContain('GitHub URL is required')
  })

  it('returns error for missing content type', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test'
    })

    expect(args.errors).toContain('Content type is required (--type validation|hardening)')
  })

  it('returns error for invalid content type', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'invalid'
    })

    expect(args.errors).toContain('Content type must be "validation" or "hardening"')
  })

  it('returns error for invalid status', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'validation',
      status: 'invalid'
    })

    expect(args.errors).toContain('Status must be one of: active, beta, deprecated, draft')
  })

  it('returns error for invalid automation level', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'hardening',
      automationLevel: 'invalid'
    })

    expect(args.errors).toContain('Automation level must be one of: full, partial, manual')
  })
})

// ============================================================================
// PARSE UPDATE ARGS
// ============================================================================

describe('parseUpdateArgs', () => {
  it('parses ID from positional argument', () => {
    const args = parseUpdateArgs({
      id: 'content-123',
      version: '2.0.0'
    })

    expect(args.id).toBe('content-123')
    expect(args.updates?.version).toBe('2.0.0')
  })

  it('parses all update flags', () => {
    const args = parseUpdateArgs({
      id: 'content-123',
      name: 'Updated Name',
      description: 'Updated description',
      version: '2.0.0',
      status: 'active',
      controlCount: '500'
    })

    expect(args.updates?.name).toBe('Updated Name')
    expect(args.updates?.description).toBe('Updated description')
    expect(args.updates?.version).toBe('2.0.0')
    expect(args.updates?.status).toBe('active')
    expect(args.updates?.controlCount).toBe(500)
  })

  it('parses sync-readme flag', () => {
    const args = parseUpdateArgs({
      id: 'content-123',
      syncReadme: true
    })

    expect(args.syncReadme).toBe(true)
  })

  it('returns error for missing ID', () => {
    const args = parseUpdateArgs({
      version: '2.0.0'
    })

    expect(args.errors).toContain('Content ID is required')
  })

  it('returns error when no updates specified', () => {
    const args = parseUpdateArgs({
      id: 'content-123'
    })

    expect(args.errors).toContain('No updates specified')
  })
})

// ============================================================================
// FORMAT ADD RESULT
// ============================================================================

describe('formatAddResult', () => {
  const successResult: PrepareAddResult = {
    success: true,
    content: {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
      version: '1.0.0',
      status: 'active'
    },
    warnings: [],
    errors: []
  }

  const warningResult: PrepareAddResult = {
    success: true,
    content: {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation'
    },
    warnings: ['No inspec.yml found - using defaults', 'Could not resolve vendor: "Unknown"'],
    errors: []
  }

  const errorResult: PrepareAddResult = {
    success: false,
    warnings: [],
    errors: ['Invalid GitHub URL', 'Slug validation failed']
  }

  describe('json format', () => {
    it('formats success as JSON', () => {
      const output = formatAddResult(successResult, 'json')
      const parsed = JSON.parse(output)

      expect(parsed.success).toBe(true)
      expect(parsed.content.name).toBe('RHEL 9 STIG')
      expect(parsed.content.slug).toBe('rhel-9-stig')
    })

    it('includes warnings in JSON', () => {
      const output = formatAddResult(warningResult, 'json')
      const parsed = JSON.parse(output)

      expect(parsed.warnings).toHaveLength(2)
      expect(parsed.warnings[0]).toContain('inspec.yml')
    })

    it('formats errors as JSON', () => {
      const output = formatAddResult(errorResult, 'json')
      const parsed = JSON.parse(output)

      expect(parsed.success).toBe(false)
      expect(parsed.errors).toHaveLength(2)
    })
  })

  describe('text format', () => {
    it('formats success as text', () => {
      const output = formatAddResult(successResult, 'text')

      expect(output).toContain('RHEL 9 STIG')
      expect(output).toContain('rhel-9-stig')
    })

    it('includes warnings in text', () => {
      const output = formatAddResult(warningResult, 'text')

      expect(output).toContain('Warning')
      expect(output).toContain('inspec.yml')
    })

    it('formats errors as text', () => {
      const output = formatAddResult(errorResult, 'text')

      expect(output).toContain('Error')
      expect(output).toContain('Invalid GitHub URL')
    })
  })

  describe('quiet format', () => {
    it('outputs only slug on success', () => {
      const output = formatAddResult(successResult, 'quiet')

      expect(output.trim()).toBe('rhel-9-stig')
    })

    it('outputs nothing on error', () => {
      const output = formatAddResult(errorResult, 'quiet')

      expect(output.trim()).toBe('')
    })
  })
})

// ============================================================================
// FORMAT UPDATE RESULT
// ============================================================================

describe('formatUpdateResult', () => {
  const successResult: PrepareUpdateResult = {
    success: true,
    hasChanges: true,
    updates: { version: '2.0.0', controlCount: 500 },
    diff: {
      hasChanges: true,
      changes: {
        version: { old: '1.0.0', new: '2.0.0' },
        controlCount: { old: 400, new: 500 }
      }
    },
    warnings: [],
    errors: []
  }

  const noChangesResult: PrepareUpdateResult = {
    success: true,
    hasChanges: false,
    warnings: [],
    errors: []
  }

  describe('json format', () => {
    it('formats success with changes as JSON', () => {
      const output = formatUpdateResult(successResult, 'content-123', 'json')
      const parsed = JSON.parse(output)

      expect(parsed.success).toBe(true)
      expect(parsed.id).toBe('content-123')
      expect(parsed.hasChanges).toBe(true)
      expect(parsed.changes.version.old).toBe('1.0.0')
      expect(parsed.changes.version.new).toBe('2.0.0')
    })

    it('formats no changes as JSON', () => {
      const output = formatUpdateResult(noChangesResult, 'content-123', 'json')
      const parsed = JSON.parse(output)

      expect(parsed.hasChanges).toBe(false)
    })
  })

  describe('text format', () => {
    it('shows diff in text format', () => {
      const output = formatUpdateResult(successResult, 'content-123', 'text')

      expect(output).toContain('version')
      expect(output).toContain('1.0.0')
      expect(output).toContain('2.0.0')
    })

    it('shows no changes message', () => {
      const output = formatUpdateResult(noChangesResult, 'content-123', 'text')

      expect(output).toContain('No changes')
    })
  })
})

// ============================================================================
// FORMAT LIST RESULT
// ============================================================================

describe('formatListResult', () => {
  const records = [
    {
      id: 'content-1',
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      content_type: 'validation',
      version: '1.0.0',
      expand: {
        target: { name: 'RHEL 9' },
        standard: { short_name: 'STIG' }
      }
    },
    {
      id: 'content-2',
      name: 'Ubuntu 22.04 CIS',
      slug: 'ubuntu-22-04-cis',
      content_type: 'validation',
      version: '2.0.0',
      expand: {
        target: { name: 'Ubuntu 22.04' },
        standard: { short_name: 'CIS' }
      }
    }
  ]

  describe('json format', () => {
    it('formats as JSON array', () => {
      const output = formatListResult(records, 'json')
      const parsed = JSON.parse(output)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('RHEL 9 STIG')
      expect(parsed[1].name).toBe('Ubuntu 22.04 CIS')
    })
  })

  describe('text format', () => {
    it('formats as table', () => {
      const output = formatListResult(records, 'text')

      expect(output).toContain('RHEL 9 STIG')
      expect(output).toContain('Ubuntu 22.04 CIS')
      expect(output).toContain('validation')
    })
  })

  describe('quiet format', () => {
    it('outputs only IDs', () => {
      const output = formatListResult(records, 'quiet')
      const lines = output.trim().split('\n')

      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('content-1')
      expect(lines[1]).toBe('content-2')
    })
  })
})
