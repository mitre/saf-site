# CLI DRY Analysis

> Generated: 2026-01-23 | Session 054
> Total potential savings: 130-190 lines

## Overview

This document tracks DRY (Don't Repeat Yourself) violations identified in the CLI codebase.
Work on these items should be done incrementally across sessions.

## Priority 1: FK Resolution Warnings Loop (40-60 lines)

**Location:** `src/commands/content.logic.ts` lines 169-183

**Problem:** FK resolution warning pattern repeats 5 times identically:
```typescript
if (input.fkNames.vendor && !resolvedFKs.vendor) {
  warnings.push(`Could not resolve vendor: "${input.fkNames.vendor}"`)
}
// ... repeated 4 more times for standard, technology, target, maintainer
```

**Solution:** Create helper function:
```typescript
function checkUnresolvedFKs(
  fkNames: ContentFKNames,
  resolvedFKs: ResolvedFKs
): string[] {
  const warnings: string[] = []
  const fields = ['vendor', 'standard', 'technology', 'target', 'maintainer'] as const

  for (const field of fields) {
    if (fkNames[field] && !resolvedFKs[field]) {
      warnings.push(`Could not resolve ${field}: "${fkNames[field]}"`)
    }
  }
  return warnings
}
```

**Effort:** 1 hour | **Lines saved:** ~45

---

## Priority 2: GitHub Fetch Headers (20-30 lines)

**Location:** `src/lib/github.ts` lines 57-64 and 96-103

**Problem:** HTTP headers construction duplicated in `fetchRepoInfo()` and `fetchRawFile()`:
```typescript
const headers: HeadersInit = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'saf-site-cli'
}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

**Solution:** Extract helper:
```typescript
function getGitHubHeaders(acceptType = 'application/vnd.github.v3+json'): HeadersInit {
  const token = process.env.GITHUB_TOKEN
  const headers: HeadersInit = {
    'Accept': acceptType,
    'User-Agent': 'saf-site-cli'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
```

**Effort:** 30 min | **Lines saved:** ~20

---

## Priority 3a: Error Formatting in Results (15-25 lines)

**Location:** `src/commands/content.cli.ts` lines 204-209 and 262-267

**Problem:** Error section formatting identical in `formatAddResult()` and `formatUpdateResult()`:
```typescript
if (result.errors.length > 0) {
  lines.push(pc.red('Errors:'))
  for (const error of result.errors) {
    lines.push(pc.red(`  ✗ ${error}`))
  }
}
```

**Solution:** Extract helper (could add to cli-utils.ts):
```typescript
function formatErrorsForText(errors: string[]): string {
  if (errors.length === 0) return ''
  const lines: string[] = [pc.red('Errors:')]
  for (const error of errors) {
    lines.push(pc.red(`  ✗ ${error}`))
  }
  return lines.join('\n')
}
```

**Effort:** 45 min | **Lines saved:** ~15

---

## Priority 3b: FK Map Lookups (15-20 lines)

**Location:** `src/lib/content-service.ts` lines 131-154

**Problem:** Map lookup + case-insensitive resolution repeated 5 times:
```typescript
if (fkNames.vendor) {
  const id = fkMaps.organizations.get(fkNames.vendor.toLowerCase())
  if (id) result.vendor = id
}
// repeated for standard, technology, target, maintainer
```

**Solution:**
```typescript
function resolveSingleFK(
  name: string | undefined,
  mapKey: keyof FkMaps,
  fkMaps: FkMaps
): string | undefined {
  if (!name) return undefined
  return fkMaps[mapKey].get(name.toLowerCase())
}

export function resolveContentFKs(fkNames: ContentFKNames, fkMaps: FkMaps): ResolvedFKs {
  return {
    vendor: resolveSingleFK(fkNames.vendor, 'organizations', fkMaps),
    standard: resolveSingleFK(fkNames.standard, 'standards', fkMaps),
    technology: resolveSingleFK(fkNames.technology, 'technologies', fkMaps),
    target: resolveSingleFK(fkNames.target, 'targets', fkMaps),
    maintainer: resolveSingleFK(fkNames.maintainer, 'teams', fkMaps)
  }
}
```

**Effort:** 45 min | **Lines saved:** ~15

---

## Priority 4a: FK Collection Mapping (20-25 lines)

**Location:** `src/lib/pocketbase.ts` lines 111-120

**Problem:** FK collection loading uses redundant mapping:
```typescript
organizations: new Map(organizations.map(r => [r.name.toLowerCase(), r.id])),
teams: new Map(teams.map(r => [r.name.toLowerCase(), r.id])),
// repeated 6 more times...
```

**Solution:**
```typescript
function createLowerCaseIdMap(records: Array<{name: string; id: string}>): Map<string, string> {
  return new Map(records.map(r => [r.name.toLowerCase(), r.id]))
}
```

**Effort:** 1 hour | **Lines saved:** ~20

---

## Priority 4b: FK Validation Checks (12-18 lines)

**Location:** `src/commands/db.ts` lines 119-130

**Problem:** FK validation check pattern repeated 4 times:
```typescript
if (record.target && !await recordExists(pb, 'targets', record.target)) {
  issues.push(`Content ${record.id}: invalid target reference "${record.target}"`)
}
// repeated for standard, technology, vendor
```

**Solution:**
```typescript
async function validateFK(
  pb: PocketBase,
  recordId: string,
  fkValue: string | undefined,
  collection: string,
  fieldName: string
): Promise<string | null> {
  if (!fkValue) return null
  if (!await recordExists(pb, collection, fkValue)) {
    return `${recordId}: invalid ${fieldName} reference "${fkValue}"`
  }
  return null
}
```

**Effort:** 1 hour | **Lines saved:** ~15

---

## Summary

| Priority | Issue | Lines Saved | Effort | Status |
|----------|-------|-------------|--------|--------|
| P1 | FK resolution warnings | 40-60 | 1h | ⬜ Todo |
| P2 | GitHub fetch headers | 20-30 | 30m | ⬜ Todo |
| P3a | Error formatting | 15-25 | 45m | ⬜ Todo |
| P3b | FK map lookups | 15-20 | 45m | ⬜ Todo |
| P4a | FK collection mapping | 20-25 | 1h | ⬜ Todo |
| P4b | FK validation checks | 12-18 | 1h | ⬜ Todo |
| **Total** | | **130-190** | **~5.5h** | |

## Quick Wins (Do First)

1. **P2: GitHub headers** - Simple extraction, high value, 30 min
2. **P3a: Error formatting** - Already have cli-utils.ts, just add helper, 45 min

## Session Planning

- **Session A:** P2 + P3a (~1.5h, ~35 lines)
- **Session B:** P1 + P3b (~2h, ~60 lines)
- **Session C:** P4a + P4b (~2h, ~35 lines)
