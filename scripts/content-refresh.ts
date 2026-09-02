#!/usr/bin/env tsx
/**
 * Content Refresh - one-command local update of the content database
 *
 * Examines mitre GitHub for updates (inspec.yml is the source of truth),
 * writes them to the running Pocketbase, exports to the git-tracked
 * diffable/ format, and prints a list of what changed. After a run,
 * `git diff .pocketbase/pb_data/diffable/` shows the changes ready to
 * review, commit, and PR — no further tooling involved.
 *
 * Usage:
 *   pnpm content:refresh              # sync + discover + export
 *   pnpm content:refresh --dry-run    # report drift without writing
 *
 * Requires Pocketbase running (cd .pocketbase && ./pocketbase serve).
 * Uses GITHUB_TOKEN if set, falling back to `gh auth token`, to avoid
 * GitHub's anonymous rate limit (60 req/hr is not enough for a full run).
 */

import { execFileSync, execSync } from 'node:child_process'
import process from 'node:process'

// Shapes of the CLI's --json outputs (subset the report needs)
export interface SyncPlan {
  slug: string
  status: 'up-to-date' | 'drift' | 'warning' | 'error'
  currentVersion: string | null
  messages: string[]
  update?: { version: string, releaseDate?: string }
}

export interface SyncReport {
  dryRun: boolean
  summary: { total: number, upToDate: number, drift: number, applied: number, warnings: number, errors: number }
  plans: SyncPlan[]
}

export interface DiscoverReport {
  org: string
  count: number
  candidates: Array<{ name: string, htmlUrl: string, description: string | null, pushedAt: string | null }>
}

const DISCOVER_LIST_CAP = 10

// Reports are pretty-printed JSON starting at column 0; pnpm's script echo
// lines never do, so anchor extraction on a line-leading brace
const JSON_LINE_START_REGEX = /^\{/m

/**
 * The CLI prints `{"success": false, "errors": [...]}` on hard failures —
 * valid JSON, so parsing alone can't distinguish a report from a failure.
 * These narrow the shapes the report builder actually dereferences.
 */
export function isSyncReport(value: unknown): value is SyncReport {
  const v = value as SyncReport
  return Boolean(v && typeof v === 'object' && v.summary && typeof v.summary === 'object'
    && typeof v.summary.total === 'number' && Array.isArray(v.plans))
}

export function isDiscoverReport(value: unknown): value is DiscoverReport {
  const v = value as DiscoverReport
  return Boolean(v && typeof v === 'object' && typeof v.count === 'number' && Array.isArray(v.candidates))
}

/**
 * Render the human-readable refresh report (pure — unit tested)
 */
export function buildRefreshReport(sync: SyncReport, discover: DiscoverReport): string {
  const drift = sync.plans.filter(p => p.status === 'drift')
  const errors = sync.plans.filter(p => p.status === 'error')
  const s = sync.summary

  const lines: string[] = []
  lines.push('## Content refresh')
  lines.push('')
  lines.push(`${s.total} records checked: ${s.upToDate} up-to-date, ${s.drift} drift (${s.applied} applied), ${s.warnings} warnings, ${s.errors} errors.`)
  if (sync.dryRun) {
    lines.push('')
    lines.push('**Dry run — no changes were written.**')
  }
  lines.push('')

  if (drift.length) {
    lines.push(sync.dryRun ? '### Version updates (would apply)' : '### Version updates applied')
    lines.push('')
    lines.push('| Slug | Version |')
    lines.push('|---|---|')
    for (const p of drift)
      lines.push(`| ${p.slug} | ${p.currentVersion ?? '(none)'} → ${p.update?.version} |`)
    lines.push('')
  }

  if (errors.length) {
    lines.push('### Errors (needs attention)')
    lines.push('')
    for (const p of errors)
      lines.push(`- **${p.slug}**: ${p.messages.join('; ')}`)
    lines.push('')
  }

  lines.push(`### Discovery: ${discover.count} repos with no content record`)
  lines.push('')
  if (discover.count) {
    lines.push(`Newest first (top ${Math.min(DISCOVER_LIST_CAP, discover.count)}) — review and import with \`pnpm cli content add <url>\`:`)
    lines.push('')
    for (const c of discover.candidates.slice(0, DISCOVER_LIST_CAP))
      lines.push(`- [${c.name}](${c.htmlUrl}) — pushed ${c.pushedAt ? c.pushedAt.slice(0, 10) : 'unknown'}`)
    if (discover.count > DISCOVER_LIST_CAP)
      lines.push(`- …and ${discover.count - DISCOVER_LIST_CAP} more (run \`pnpm cli content discover\`)`)
    lines.push('')
  }

  return lines.join('\n')
}

function runCliJson(args: string[], env: NodeJS.ProcessEnv): { json: string, exitCode: number } {
  // cli.sh cds into cli/; capture stdout and strip pnpm's script echo
  let output = ''
  let exitCode = 0
  try {
    output = execFileSync('./scripts/cli.sh', args, { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
  }
  catch (error) {
    const err = error as { status?: number, stdout?: string }
    exitCode = err.status ?? 1
    output = err.stdout ?? ''
  }
  const jsonStart = output.search(JSON_LINE_START_REGEX)
  return { json: jsonStart >= 0 ? output.slice(jsonStart) : '', exitCode }
}

/**
 * Parse a CLI report or abort (before any export) with the CLI's own
 * error details when the command failed
 */
function parseReportOrDie<T>(
  label: string,
  result: { json: string, exitCode: number },
  guard: (value: unknown) => value is T,
): T {
  let parsed: unknown
  try {
    parsed = JSON.parse(result.json)
  }
  catch {
    parsed = null
  }
  if (guard(parsed)) {
    return parsed
  }
  console.error(`${label} failed (exit code ${result.exitCode}) — aborting before export`)
  const errorPayload = parsed as { errors?: string[] } | null
  for (const message of errorPayload?.errors ?? []) {
    console.error(`  ${message}`)
  }
  return process.exit(1)
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run')

  // Fail fast with a helpful message if Pocketbase isn't up
  const pbUrl = process.env.PB_URL || 'http://localhost:8090'
  try {
    execFileSync('curl', ['-sf', '-o', '/dev/null', `${pbUrl}/api/health`], { stdio: 'ignore' })
  }
  catch {
    console.error(`Pocketbase is not reachable at ${pbUrl}.`)
    console.error('Start it first:  cd .pocketbase && ./pocketbase serve')
    process.exit(1)
  }

  // Rate-limit safety: authenticated GitHub API access
  const env = { ...process.env }
  if (!env.GITHUB_TOKEN) {
    try {
      env.GITHUB_TOKEN = execSync('gh auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
      console.error('Using GitHub token from `gh auth token`')
    }
    catch {
      console.error('Warning: no GITHUB_TOKEN and gh CLI unavailable — a full run will hit the anonymous rate limit (60 req/hr)')
    }
  }

  console.error(`Checking mitre GitHub for updates${dryRun ? ' (dry run)' : ''}...`)
  const syncArgs = ['content', 'sync', '--json', ...(dryRun ? ['--dry-run'] : [])]
  const syncResult = runCliJson(syncArgs, env)
  const sync = parseReportOrDie<SyncReport>('content sync', syncResult, isSyncReport)

  console.error('Checking for unregistered repos...')
  const discoverResult = runCliJson(['content', 'discover', '--json'], env)
  const discover = parseReportOrDie<DiscoverReport>('content discover', discoverResult, isDiscoverReport)

  if (!dryRun) {
    console.error('Exporting database to diffable/...')
    execSync('./scripts/export-db.sh', { stdio: ['ignore', 'ignore', 'inherit'] })
  }

  console.log(buildRefreshReport(sync, discover))
  if (!dryRun) {
    console.log('Next steps:')
    console.log('  git diff .pocketbase/pb_data/diffable/')
    console.log('  git add .pocketbase/pb_data/diffable/ && git commit')
  }

  // Non-zero only when sync recorded errors — drift and warnings are normal
  process.exit(sync.summary.errors > 0 ? 1 : 0)
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('content-refresh.ts')) {
  main()
}
