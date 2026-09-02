import { describe, expect, it } from 'vitest'
import { buildRefreshReport, isDiscoverReport, isSyncReport } from './content-refresh.js'

// Fixtures shaped like the CLI's real --json outputs
const syncReport = {
  dryRun: false,
  summary: { total: 156, upToDate: 116, drift: 2, applied: 2, warnings: 37, errors: 1 },
  plans: [
    {
      id: 'content-1',
      slug: 'red-hat-7-stig',
      status: 'drift',
      currentVersion: '1.0.0',
      inspecVersion: '3.10.1',
      releaseTag: '3.10.1',
      messages: ['1.0.0 → 3.10.1'],
      update: { version: '3.10.1', releaseDate: '2023-06-02T20:03:06Z' },
      release: { slug: 'red-hat-7-stig-v3-10-1', version: '3.10.1', releaseDate: '2023-06-02T20:03:06Z' },
    },
    {
      id: 'content-2',
      slug: 'debian-13-stig',
      status: 'drift',
      currentVersion: null,
      inspecVersion: '0.1.0',
      releaseTag: '0.1.0',
      messages: ['(none) → 0.1.0'],
      update: { version: '0.1.0' },
      release: { slug: 'debian-13-stig-v0-1-0', version: '0.1.0' },
    },
    {
      id: 'content-3',
      slug: 'up-to-date-thing',
      status: 'up-to-date',
      currentVersion: '2.0.0',
      inspecVersion: '2.0.0',
      releaseTag: '2.0.0',
      messages: [],
    },
    {
      id: 'content-4',
      slug: 'broken-thing',
      status: 'error',
      currentVersion: '1.0.0',
      inspecVersion: null,
      releaseTag: null,
      messages: ['GitHub API error: 500 Internal Server Error'],
    },
  ],
}

const discoverReport = {
  org: 'mitre',
  count: 2,
  candidates: [
    {
      name: 'oracle-database-19c-stig-baseline',
      htmlUrl: 'https://github.com/mitre/oracle-database-19c-stig-baseline',
      description: 'Oracle 19c STIG profile',
      pushedAt: '2026-06-12T00:00:00Z',
    },
    {
      name: 'dateless-baseline',
      htmlUrl: 'https://github.com/mitre/dateless-baseline',
      description: null,
      pushedAt: null,
    },
  ],
}

describe('buildRefreshReport', () => {
  it('renders summary line, drift table, errors, and discovery candidates', () => {
    const report = buildRefreshReport(syncReport as any, discoverReport as any)

    expect(report).toContain('156 records checked: 116 up-to-date, 2 drift (2 applied), 37 warnings, 1 errors.')
    expect(report).toContain('### Version updates applied')
    expect(report).toContain('| red-hat-7-stig | 1.0.0 → 3.10.1 |')
    expect(report).toContain('| debian-13-stig | (none) → 0.1.0 |')
    expect(report).toContain('**broken-thing**: GitHub API error: 500 Internal Server Error')
    expect(report).toContain('2 repos with no content record')
    expect(report).toContain('[oracle-database-19c-stig-baseline](https://github.com/mitre/oracle-database-19c-stig-baseline)')
    expect(report).toContain('pushed 2026-06-12')
    expect(report).toContain('pushed unknown')
  })

  it('omits the drift and error sections when there is nothing to report', () => {
    const quiet = {
      dryRun: false,
      summary: { total: 10, upToDate: 10, drift: 0, applied: 0, warnings: 0, errors: 0 },
      plans: [],
    }
    const report = buildRefreshReport(quiet as any, { org: 'mitre', count: 0, candidates: [] } as any)

    expect(report).not.toContain('Version updates')
    expect(report).not.toContain('needs attention')
    expect(report).toContain('0 repos with no content record')
  })

  it('notes dry-run mode and labels the drift table as not-yet-applied', () => {
    const report = buildRefreshReport({ ...syncReport, dryRun: true } as any, discoverReport as any)

    expect(report.toLowerCase()).toContain('dry run')
    expect(report).toContain('### Version updates (would apply)')
    expect(report).not.toContain('### Version updates applied')
  })

  it('caps the discovery list and counts the remainder', () => {
    const many = {
      org: 'mitre',
      count: 15,
      candidates: Array.from({ length: 15 }, (_, i) => ({
        name: `repo-${i}-stig-baseline`,
        htmlUrl: `https://github.com/mitre/repo-${i}-stig-baseline`,
        description: null,
        pushedAt: '2026-01-01T00:00:00Z',
      })),
    }
    const report = buildRefreshReport(syncReport as any, many as any)

    expect(report).toContain('repo-9-stig-baseline')
    expect(report).not.toContain('repo-10-stig-baseline')
    expect(report).toContain('and 5 more')
  })
})

describe('report shape guards', () => {
  it('accepts the real report shapes', () => {
    expect(isSyncReport(syncReport)).toBe(true)
    expect(isDiscoverReport(discoverReport)).toBe(true)
  })

  it('rejects the CLI error payload so a failed sync aborts before export', () => {
    const cliError = { success: false, errors: ['Failed to authenticate with Pocketbase'] }

    expect(isSyncReport(cliError)).toBe(false)
    expect(isDiscoverReport(cliError)).toBe(false)
  })

  it('rejects near-miss shapes', () => {
    expect(isSyncReport({ summary: {}, plans: 'not-an-array' })).toBe(false)
    expect(isSyncReport({ plans: [] })).toBe(false)
    expect(isDiscoverReport({ count: 3 })).toBe(false)
  })
})
