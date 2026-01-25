# Session Recovery - 2026-01-25 (Post db-diffable)

## Quick Start

```bash
# 1. Read context
cat WORKSTREAM.md
bd show saf-site-jur

# 2. Verify tests pass
pnpm test:run           # Should be 423
cd cli && pnpm test:run # Should be 476

# 3. Start migration task
bd update saf-site-jur --status=in_progress
```

---

## Epic Context

**Epic:** saf-site-tdi - Automated Content Pipeline
**Branch:** feature/drizzle-pocketbase-sync
**Goal:** Self-maintaining SAF site where upstream releases auto-trigger content updates via CI/CD

**Key Decision:** SQLite + Drizzle + Domain CLI (No Pocketbase GUI)
- Fresh Drizzle database will have SQL-level FK constraints
- Current Pocketbase DB has NO SQL-level FK constraints (app-level only)

---

## Current Progress: ~40%

### PHASE 1: DRY Foundation ✅ COMPLETE
| Task | Description | Status |
|------|-------------|--------|
| saf-site-zpj | fk-utils.ts | DONE ✅ |
| saf-site-jr5 | field-mapping.ts | DONE ✅ |

### PHASE 2: db-diffable Feature Complete ✅ COMPLETE
| Task | Description | Status |
|------|-------------|--------|
| saf-site-0by | Object format dump | DONE ✅ |
| saf-site-km5 | Format auto-detection | DONE ✅ |
| saf-site-o2f | --data-only flag | DONE ✅ |
| saf-site-97p | tableOrder (FK ordering) | DONE ✅ |
| saf-site-3cn | --skip-tables (glob patterns) | DONE ✅ |

### PHASE 3: Migration ← NEXT
| Task | Description | Status |
|------|-------------|--------|
| **saf-site-jur** | Migrate to Drizzle DB | **READY** |

---

## Test Counts

| Suite | Count | Command |
|-------|-------|---------|
| VitePress | 423 | `pnpm test:run` |
| CLI | 476 | `cd cli && pnpm test:run` |
| **Total** | **899** | |

---

## Next Task: saf-site-jur (Migration)

**Goal:** Create clean Drizzle-managed SQLite database with proper FK constraints

### Source Data (diffable/)
- 43 total tables in diffable/
- 8 PB internal tables to skip: `_authOrigins`, `_collections`, `_externalAuths`, `_mfas`, `_migrations`, `_otps`, `_params`, `_superusers`
- 35 user tables to migrate

### Drizzle Schema Tables (schema.ts)
```
capabilities, categories, organizations, teams, standards, technologies,
targets, tags, toolTypes, distributionTypes, registries, resourceTypes,
mediaTypes, content, tools, courses, courseResources, courseSessions,
media, distributions, contentReleases, toolReleases, distributionReleases,
contentCapabilities, contentTags, contentRelationships, toolCapabilities,
toolTags, courseCapabilities, courseTags, courseTools, mediaCapabilities,
mediaTags, distributionCapabilities, distributionTags
```

### Migration Steps

```typescript
// 1. Get FK-safe insert order
import * as schema from './docs/.vitepress/database/schema'
import { getInsertOrder } from './docs/.vitepress/database/fk-utils'

const tableOrder = getInsertOrder(schema)
console.log(tableOrder) // Use this for --table-order

// 2. Create fresh Drizzle DB
// drizzle-kit push --config=drizzle.config.ts

// 3. Load data
import { load } from './scripts/db-diffable'
load('new-drizzle.db', '.pocketbase/pb_data/diffable', {
  dataOnly: true,
  skipTables: ['_*'],
  tableOrder: tableOrder
})
```

### TDD Approach
```typescript
// scripts/migrate-to-drizzle.spec.ts
describe('Drizzle migration', () => {
  it('getInsertOrder returns valid table order')
  it('creates database with drizzle-kit push')
  it('loads data with --data-only --skip-tables')
  it('FK constraints are enforced (try invalid insert)')
  it('record counts match source diffable/')
  it('content table has correct FK references')
})
```

### Key Files
- `docs/.vitepress/database/schema.ts` - Drizzle schema (source of truth)
- `docs/.vitepress/database/fk-utils.ts` - getInsertOrder()
- `scripts/db-diffable.ts` - load() with all options
- `.pocketbase/pb_data/diffable/` - Source data (35 user tables)
- `drizzle.config.ts` - Drizzle Kit configuration

---

## db-diffable API Reference

```typescript
// Dump (always object format now)
dump(dbPath, outDir, { exclude?: string[], tables?: string[] })

// Load with all options
load(dbPath, srcDir, {
  replace?: boolean,      // Drop tables first
  dataOnly?: boolean,     // Skip table creation, insert only
  tableOrder?: string[],  // Process tables in this order
  skipTables?: string[],  // Skip tables matching patterns ('_*')
})

// CLI
tsx scripts/db-diffable.ts load db.sqlite diffable/ \
  --data-only \
  --skip-tables '_*' \
  --table-order orgs,users,content
```

---

## Recovery Commands

```bash
# Primary recovery
cat WORKSTREAM.md
bd ready
bd show saf-site-jur

# Verify tests
pnpm test:run
cd cli && pnpm test:run

# Git status
git log --oneline -5
```
