# SAF Site Work Stream

**Epic:** saf-site-tdi - Automated Content Pipeline
**Decision:** SQLite + Drizzle + Domain CLI (No Pocketbase, No NocoDB, No lazysql)
**Branch:** feature/drizzle-pocketbase-sync
**Last Updated:** 2026-01-25

---

## QUICK RECOVERY (After Compact/New Session)

```bash
# 1. Read this file first
cat WORKSTREAM.md

# 2. Check current progress
bd ready                    # What's ready to work on
bd show saf-site-jur        # Next task: Migration

# 3. Verify tests pass
pnpm test:run               # Should be 423 tests
cd cli && pnpm test:run     # Should be 476 tests

# 4. Start migration task
bd update saf-site-jur --status=in_progress
```

---

## Current Progress: ~40% Complete

### PHASE 1: DRY Foundation ✅ COMPLETE

| Task | Description | Status | Tests |
|------|-------------|--------|-------|
| **saf-site-zpj** | fk-utils.ts - FK detection, ordering | **DONE ✅** | 13 |
| **saf-site-jr5** | field-mapping.ts - camelCase ↔ snake_case | **DONE ✅** | 23 |
| saf-site-jg4 | slug-utils.ts - consolidate slug generation | READY (not critical) | - |

### PHASE 2: db-diffable Feature Complete ✅ COMPLETE

| Task | Description | Status | Tests |
|------|-------------|--------|-------|
| **saf-site-0by** | Object format dump | **DONE ✅** | 6 |
| **saf-site-km5** | Format auto-detection on load | **DONE ✅** | 6 |
| **saf-site-o2f** | --data-only flag | **DONE ✅** | 4 |
| **saf-site-97p** | tableOrder (FK ordering) | **DONE ✅** | 4 |
| **saf-site-3cn** | --skip-tables (glob patterns) | **DONE ✅** | 4 |
| saf-site-6uf | Re-export diffable/ in object format | DEFERRED (not critical) | - |

### PHASE 3: Migration ← NEXT

| Task | Description | Status |
|------|-------------|--------|
| **saf-site-jur** | Migrate to fresh Drizzle DB | **READY ← NEXT** |

### PHASE 4-6: Not Started

See dependency chain below.

---

## Test Counts (Keep These Passing!)

| Suite | Count | Command |
|-------|-------|---------|
| VitePress | 423 | `pnpm test:run` |
| CLI | 476 | `cd cli && pnpm test:run` |
| **Total** | **899** | |

---

## End Goal

Self-maintaining SAF site where upstream releases automatically trigger content updates via CI/CD.

```
UPSTREAM TRIGGERS                          SAF-SITE
─────────────────                          ────────
SAF CLI release     ──┐
                      ├──► GitHub Action ──► CLI ──► PR to saf-site
Profile release     ──┤                              (diffable/ update)
                      │
Community PR        ──┘
```

---

## Database Context

**Current State:**
- Pocketbase database at `.pocketbase/pb_data/data.db`
- Pocketbase handles FK relationships at application level (not SQL level)
- Data exported to `diffable/` as NDJSON (object format)
- 85 content records, 16 organizations, etc.

**Target State:**
- Fresh SQLite database created BY Drizzle (`drizzle-kit push`)
- SQL-level FK constraints with referential integrity
- Data imported from `diffable/` using enhanced db-diffable
- No Pocketbase dependency

---

## Dependency Chain

```
Phase 1 (DRY) ✅ DONE
├── zpj (fk-utils) ✅
├── jr5 (field-mapping) ✅
└── jg4 (slug-utils) - optional
        │
        ▼
Phase 2 (db-diffable) ✅ DONE
├── 0by (object dump) ✅
├── km5 (auto-detect) ✅
├── o2f (--data-only) ✅
├── 97p (tableOrder) ✅
└── 3cn (--skip-tables) ✅
        │
        ▼
Phase 3 (migration) ← WE ARE HERE
└── jur (migrate to Drizzle) ← NEXT
        │
        ▼
Phase 4 (CLI + loaders)
├── gf9 (CRUD) ← uses jr5, zpj
└── 3b9 (loaders) ← uses jr5, zpj
        │
        ▼
Phase 5 (automation)
├── c9k (releases)
└── u62 (automation)
        │
        ▼
Phase 6 (CI/CD)
├── 0j8 (Actions)
└── tdi EPIC COMPLETE
```

---

## Key Files

| File | Purpose |
|------|---------|
| `WORKSTREAM.md` | This file - primary recovery doc |
| `RECOVERY.md` | Detailed recovery with TDD specs |
| `docs/.vitepress/database/schema.ts` | Drizzle schema (source of truth) |
| `docs/.vitepress/database/fk-utils.ts` | FK detection & ordering |
| `docs/.vitepress/database/field-mapping.ts` | Case conversion |
| `scripts/db-diffable.ts` | Export/import tool (fully featured) |

---

## db-diffable API (Fully Featured)

```typescript
// Load with all options
load(dbPath, srcDir, {
  replace?: boolean,      // Drop tables first
  dataOnly?: boolean,     // Skip table creation, insert only
  tableOrder?: string[],  // Process tables in this order (FK safe)
  skipTables?: string[],  // Skip tables matching patterns ('_*')
})

// CLI example for migration
tsx scripts/db-diffable.ts load new.db diffable/ \
  --data-only \
  --skip-tables '_*' \
  --table-order orgs,targets,content
```

---

## TDD Process (MANDATORY)

```
1. Write failing tests (RED)
   └── bd update <id> --status=in_progress
   └── Create <feature>.spec.ts
   └── Run tests, confirm they FAIL

2. Implement minimum to pass (GREEN)
   └── Create <feature>.ts
   └── Run tests, confirm they PASS

3. Verify all existing tests pass
   └── pnpm test:run (423)
   └── cd cli && pnpm test:run (476)

4. Close task
   └── bd close <id> --reason="..."
```

---

## Recovery Commands

```bash
# Primary recovery
cat WORKSTREAM.md
bd ready
bd show saf-site-jur

# Check progress
bd stats
bd list --status=in_progress

# Verify tests
pnpm test:run
cd cli && pnpm test:run

# Git status
git status
git log --oneline -5
```
