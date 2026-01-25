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
bd list --status=in_progress  # What's in flight

# 3. Verify tests pass
pnpm test:run               # Should be 410+ tests
cd cli && pnpm test:run     # Should be 453 tests

# 4. Continue with next ready task (currently km5)
bd show saf-site-km5
```

---

## Current Progress: ~15% Complete

### PHASE 1: DRY Foundation ✅ COMPLETE (2/3 needed)

| Task | Description | Status | Tests |
|------|-------------|--------|-------|
| **saf-site-zpj** | fk-utils.ts - FK detection, ordering | **DONE ✅** | 13 |
| **saf-site-jr5** | field-mapping.ts - camelCase ↔ snake_case | **DONE ✅** | 23 |
| saf-site-jg4 | slug-utils.ts - consolidate slug generation | READY (not critical) | - |

**Files created:**
- `docs/.vitepress/database/fk-utils.ts` + spec
- `docs/.vitepress/database/field-mapping.ts` + spec

### PHASE 2: db-diffable Feature Complete (IN PROGRESS)

| Task | Description | Status | Tests |
|------|-------------|--------|-------|
| **saf-site-0by** | Object format dump (`--format object`) | **DONE ✅** | 6 |
| **saf-site-km5** | Format auto-detection on load | **READY ← NEXT** | - |
| saf-site-6uf | Re-export diffable/ in object format | blocked by km5 | - |
| saf-site-o2f | --data-only flag | blocked by 6uf | - |
| saf-site-3cn | --skip-tables option | blocked by o2f | - |
| saf-site-97p | FK dependency ordering | blocked by o2f | - |

**Files modified:**
- `scripts/db-diffable.ts` - added `format` option to dump()

### PHASE 3-6: Not Started

See dependency chain below.

---

## Test Counts (Keep These Passing!)

| Suite | Count | Command |
|-------|-------|---------|
| VitePress | 410 | `pnpm test:run` |
| CLI | 453 | `cd cli && pnpm test:run` |
| **Total** | **863** | |

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
- Data exported to `diffable/` as NDJSON
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
Phase 2 (db-diffable) ← WE ARE HERE
├── 0by (object dump) ✅
├── km5 (auto-detect) ← NEXT
│   └─► 6uf (re-export)
│       └─► o2f (--data-only)
│           ├─► 3cn (--skip-tables)
│           └─► 97p (FK ordering) ← uses fk-utils
│                   │
│                   ▼
Phase 3 (migration)
└── jur (migrate to Drizzle)
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
| `docs/.vitepress/database/WORK-ORDER.md` | TDD specs for each task |
| `docs/.vitepress/database/schema.ts` | Drizzle schema (source of truth) |
| `docs/.vitepress/database/fk-utils.ts` | FK detection & ordering (NEW) |
| `docs/.vitepress/database/field-mapping.ts` | Case conversion (NEW) |
| `scripts/db-diffable.ts` | Export/import tool (enhanced) |

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
   └── pnpm test:run (410+)
   └── cd cli && pnpm test:run (453)

4. Close task
   └── bd close <id> --reason="..."
```

---

## Recovery Commands

```bash
# Primary recovery
cat WORKSTREAM.md
bd ready
bd show saf-site-km5

# Check progress
bd stats
bd list --status=in_progress
bd blocked

# Verify tests
pnpm test:run
cd cli && pnpm test:run

# Git status
git status
git log --oneline -5
```
