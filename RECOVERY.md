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

**Steps:**
1. `drizzle-kit push` → Creates fresh DB with FK constraints
2. Use `getInsertOrder(schema)` from fk-utils to get table order
3. `db-diffable load --data-only --skip-tables '_*' --table-order <order>`
4. Verify all data migrated correctly
5. Update references to use new DB path

**TDD Approach:**
```typescript
describe('migration', () => {
  it('creates database with FK constraints')
  it('imports all content records')
  it('imports all reference data (orgs, targets, etc.)')
  it('FK relationships are enforced')
  it('record counts match source')
})
```

**Key Files:**
- `docs/.vitepress/database/schema.ts` - Drizzle schema (source of truth)
- `docs/.vitepress/database/fk-utils.ts` - getInsertOrder()
- `scripts/db-diffable.ts` - load() with all options
- `.pocketbase/pb_data/diffable/` - Source data

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
