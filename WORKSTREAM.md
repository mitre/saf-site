# SAF Site Work Stream

> **Read VISION.md first** - It explains WHY we're building this and how all the pieces connect.

**Epic:** saf-site-tdi - Automated Content Pipeline
**Goal:** Self-maintaining site where upstream releases auto-trigger content updates via CI/CD
**Stack:** SQLite + Drizzle + CLI + VitePress + GitHub Actions
**Branch:** feature/drizzle-pocketbase-sync
**Last Updated:** 2026-01-25

---

## QUICK RECOVERY (After Compact/New Session)

```bash
# 1. Read the vision and workstream
cat VISION.md              # WHY we're building this
cat WORKSTREAM.md          # HOW we're building it
cat RECOVERY.md            # Current session context

# 2. Check current progress
bd show saf-site-gf9       # Current task: CLI CRUD

# 3. Verify tests pass
pnpm test:run               # Should be 432 tests
cd cli && pnpm test:run     # Should be 476 tests

# 4. Verify drizzle.db exists
ls -la docs/.vitepress/database/drizzle.db  # Should be ~1.3MB

# 5. Start CLI CRUD task
bd update saf-site-gf9 --status=in_progress
```

---

## Current Progress: ~50% Complete

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

### PHASE 3: Migration ✅ COMPLETE

| Task | Description | Status |
|------|-------------|--------|
| **saf-site-jur** | Migrate to fresh Drizzle DB | **DONE ✅** |

### PHASE 4: CLI CRUD + Validation ← IN PROGRESS

**Architecture (Option A - Service Layer):**
```
┌─────────────────────────────────────┐
│           CLI Layer                 │  table.ts, content.ts, db.ts
│   (argument parsing, output)        │
├─────────────────────────────────────┤
│        Service Layer                │  content-service.ts (domain logic)
│   (validation, GitHub, FK by name)  │  Generic commands skip this layer
├─────────────────────────────────────┤
│        Data Layer                   │  drizzle.ts (generic CRUD)
│   (listRecords, createRecord, etc)  │
└─────────────────────────────────────┘
```

| Task | Description | Status |
|------|-------------|--------|
| **saf-site-gf9** | Schema-driven CLI CRUD operations | **IN PROGRESS** |
| └── Step 1 | Data layer (lib/drizzle.ts) | **DONE ✅** (21 tests) |
| └── Step 2 | Generic table commands (commands/table.ts) | **NEXT** |
| └── Step 3 | Service layer (services/content-service.ts) | - |
| └── Step 4 | Migrate domain commands to service+drizzle | - |
| └── Step 5 | Delete pocketbase.ts | - |
| (validation) | Validate diffable/ ↔ drizzle.db round-trip | After gf9 |

**Step 2: Generic table commands (TDD)**
```bash
# Commands to implement:
pnpm cli table list <table> [--filter key=value] [--json]
pnpm cli table show <table> <id> [--json]
pnpm cli table add <table> [--json] [--interactive]
pnpm cli table update <table> <id> [--json]
pnpm cli table delete <table> <id> [--yes]
```
- Thin CLI wrapper around drizzle.ts
- No service layer needed (pure CRUD)
- Works with any of 35 tables

**Step 3: Service layer (TDD)**
- Extract business logic from content.ts into content-service.ts
- GitHub integration, validation, FK resolution by name
- Service uses drizzle.ts for data access

**Step 4: Migrate domain commands (TDD)**
- content.ts becomes thin: parse args → call service → format output
- Existing content tests validate the migration

**Step 5: Delete pocketbase.ts**
- All imports removed
- File deleted
- No Pocketbase dependency

### PHASE 5: Loaders Migration

| Task | Description | Status |
|------|-------------|--------|
| saf-site-3b9 | Update VitePress loaders to use Drizzle | BLOCKED (needs CLI validation) |

### PHASE 6-7: Automation & CI/CD (Not Started)

See dependency chain below.

---

## Test Counts (Keep These Passing!)

| Suite | Count | Command |
|-------|-------|---------|
| VitePress | 432 | `pnpm test:run` |
| CLI | 497 | `cd cli && pnpm test:run` |
| **Total** | **929** | |

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
Phase 3 (migration) ✅ DONE
└── jur (migrate to Drizzle) ✅
        │
        ▼
Phase 4 (CLI CRUD) ← WE ARE HERE
└── gf9 Step 1: drizzle.ts ✅
└── gf9 Step 2: table.ts ← NEXT
└── gf9 Step 3: content-service.ts
└── gf9 Step 4: migrate content.ts
└── gf9 Step 5: delete pocketbase.ts
        │
        ▼
Phase 5 (loaders)
└── 3b9 (loaders) ← After CLI validated
        │
        ▼
Phase 6 (automation)
├── c9k (releases)
└── u62 (automation)
        │
        ▼
Phase 7 (CI/CD)
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
| `cli/src/lib/drizzle.ts` | CLI Drizzle data layer (generic CRUD) |
| `cli/src/lib/pocketbase.ts` | Legacy Pocketbase layer (to be replaced) |

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
   └── pnpm test:run (432)
   └── cd cli && pnpm test:run (497)

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
