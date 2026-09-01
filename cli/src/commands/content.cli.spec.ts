/**
 * Content CLI Tests (Phase 4.1)
 *
 * Tests for non-interactive CLI interface.
 * Tests argument parsing, output formatting, and error handling.
 */

import type { PrepareAddResult, PrepareUpdateResult } from './content.logic.js'
import { describe, expect, it } from 'vitest'
import {
  formatAddResult,
  formatDiscoverResult,
  formatListResult,
  formatSyncResult,
  formatUpdateResult,
  parseAddArgs,
  parseUpdateArgs,
} from './content.cli.js'

// ============================================================================
// PARSE ADD ARGS
// ============================================================================

describe('parseAddArgs', () => {
  it('parses GitHub URL from positional argument', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/rhel-9-stig-baseline',
      type: 'validation',
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
      maintainer: 'SAF Team',
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
      controlCount: '500',
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
      automationLevel: 'full',
    })

    expect(args.contentType).toBe('hardening')
    expect(args.overrides?.automationLevel).toBe('full')
  })

  it('returns error for missing required URL', () => {
    const args = parseAddArgs({
      type: 'validation',
    })

    expect(args.errors).toContain('GitHub URL is required')
  })

  it('returns error for missing content type', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
    })

    expect(args.errors).toContain('Content type is required (--type validation|hardening)')
  })

  it('returns error for invalid content type', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'invalid',
    })

    expect(args.errors).toContain('Content type must be "validation" or "hardening"')
  })

  it('returns error for invalid status', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'validation',
      status: 'invalid',
    })

    expect(args.errors).toContain('Status must be one of: active, beta, deprecated, draft')
  })

  it('returns error for invalid automation level', () => {
    const args = parseAddArgs({
      url: 'https://github.com/mitre/test',
      type: 'hardening',
      automationLevel: 'invalid',
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
      version: '2.0.0',
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
      controlCount: '500',
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
      syncReadme: true,
    })

    expect(args.syncReadme).toBe(true)
  })

  it('returns error for missing ID', () => {
    const args = parseUpdateArgs({
      version: '2.0.0',
    })

    expect(args.errors).toContain('Content ID is required')
  })

  it('returns error when no updates specified', () => {
    const args = parseUpdateArgs({
      id: 'content-123',
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
      status: 'active',
    },
    warnings: [],
    errors: [],
  }

  const warningResult: PrepareAddResult = {
    success: true,
    content: {
      name: 'RHEL 9 STIG',
      slug: 'rhel-9-stig',
      contentType: 'validation',
    },
    warnings: ['No inspec.yml found - using defaults', 'Could not resolve vendor: "Unknown"'],
    errors: [],
  }

  const errorResult: PrepareAddResult = {
    success: false,
    warnings: [],
    errors: ['Invalid GitHub URL', 'Slug validation failed'],
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
        controlCount: { old: 400, new: 500 },
      },
    },
    warnings: [],
    errors: [],
  }

  const noChangesResult: PrepareUpdateResult = {
    success: true,
    hasChanges: false,
    warnings: [],
    errors: [],
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
        standard: { short_name: 'STIG' },
      },
    },
    {
      id: 'content-2',
      name: 'Ubuntu 22.04 CIS',
      slug: 'ubuntu-22-04-cis',
      content_type: 'validation',
      version: '2.0.0',
      expand: {
        target: { name: 'Ubuntu 22.04' },
        standard: { short_name: 'CIS' },
      },
    },
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

// ============================================================================
// FORMAT SYNC RESULT
// ============================================================================

describe('formatSyncResult', () => {
  const plans = [
    {
      id: 'content-1',
      slug: 'rhel-9-stig',
      status: 'drift' as const,
      currentVersion: '1.0.0',
      inspecVersion: '1.2.0',
      releaseTag: '1.2.0',
      messages: ['1.0.0 \u2192 1.2.0'],
      update: { version: '1.2.0', releaseDate: '2026-07-01T00:00:00Z' },
      release: { slug: 'rhel-9-stig-v1-2-0', version: '1.2.0', releaseDate: '2026-07-01T00:00:00Z' },
    },
    {
      id: 'content-2',
      slug: 'ubuntu-2204-stig',
      status: 'up-to-date' as const,
      currentVersion: '2.0.0',
      inspecVersion: '2.0.0',
      releaseTag: '2.0.0',
      messages: [],
    },
    {
      id: 'content-3',
      slug: 'windows-2022-stig',
      status: 'warning' as const,
      currentVersion: '1.0.0',
      inspecVersion: '1.1.0',
      releaseTag: '1.3.0',
      messages: ['Version mismatch: inspec.yml says 1.1.0 but the latest release/tag is 1.3.0 \u2014 resolve upstream before syncing'],
    },
  ]
  const summary = { total: 3, upToDate: 1, drift: 1, applied: 0, warnings: 1, errors: 0 }

  describe('json format', () => {
    it('emits parseable JSON with summary and plans', () => {
      const output = formatSyncResult(plans, summary, 'json', true)
      const parsed = JSON.parse(output)

      expect(parsed.dryRun).toBe(true)
      expect(parsed.summary).toEqual(summary)
      expect(parsed.plans).toHaveLength(3)
      expect(parsed.plans[0].slug).toBe('rhel-9-stig')
    })
  })

  describe('quiet format', () => {
    it('outputs only drifted slugs', () => {
      const output = formatSyncResult(plans, summary, 'quiet', false)

      expect(output.trim()).toBe('rhel-9-stig')
    })
  })

  describe('text format', () => {
    it('shows each record status and a summary line', () => {
      const output = formatSyncResult(plans, summary, 'text', false)

      expect(output).toContain('rhel-9-stig')
      expect(output).toContain('drift')
      expect(output).toContain('up-to-date')
      expect(output).toContain('warning')
      expect(output).toContain('1 drift')
      expect(output).toContain('1 warning')
    })

    it('notes dry-run mode', () => {
      const output = formatSyncResult(plans, summary, 'text', true)

      expect(output.toLowerCase()).toContain('dry run')
    })
  })
})

// ============================================================================
// FORMAT DISCOVER RESULT
// ============================================================================

describe('formatDiscoverResult', () => {
  const candidates = [
    {
      name: 'debian-12-stig-baseline',
      htmlUrl: 'https://github.com/mitre/debian-12-stig-baseline',
      description: 'InSpec profile for Debian 12 STIG',
      pushedAt: '2026-08-15T00:00:00Z',
    },
    {
      name: 'redhat-enterprise-linux-10-stig-baseline',
      htmlUrl: 'https://github.com/mitre/redhat-enterprise-linux-10-stig-baseline',
      description: null,
      pushedAt: '2026-07-01T00:00:00Z',
    },
  ]

  describe('json format', () => {
    it('emits parseable JSON with org, count, and candidates', () => {
      const output = formatDiscoverResult(candidates, 'mitre', 'json')
      const parsed = JSON.parse(output)

      expect(parsed.org).toBe('mitre')
      expect(parsed.count).toBe(2)
      expect(parsed.candidates[0].name).toBe('debian-12-stig-baseline')
      expect(parsed.candidates[0].htmlUrl).toContain('github.com/mitre/')
    })
  })

  describe('quiet format', () => {
    it('outputs only repo names', () => {
      const output = formatDiscoverResult(candidates, 'mitre', 'quiet')

      expect(output.trim().split('\n')).toEqual([
        'debian-12-stig-baseline',
        'redhat-enterprise-linux-10-stig-baseline',
      ])
    })
  })

  describe('text format', () => {
    it('shows name, URL, push date, description, and a count line', () => {
      const output = formatDiscoverResult(candidates, 'mitre', 'text')

      expect(output).toContain('debian-12-stig-baseline')
      expect(output).toContain('github.com/mitre/debian-12-stig-baseline')
      expect(output).toContain('2026-08-15')
      expect(output).toContain('InSpec profile for Debian 12 STIG')
      expect(output).toContain('2 candidate')
    })

    it('reports when nothing new was found', () => {
      const output = formatDiscoverResult([], 'mitre', 'text')

      expect(output.toLowerCase()).toContain('no new')
    })
  })
})
