# Session Recovery - 2026-01-25

## FIRST: Commit Uncommitted Work

```bash
git status  # Verify these files are staged/modified

git add docs/.vitepress/database/fk-utils.ts \
        docs/.vitepress/database/fk-utils.spec.ts \
        docs/.vitepress/database/field-mapping.ts \
        docs/.vitepress/database/field-mapping.spec.ts \
        docs/.vitepress/database/validation.ts \
        scripts/db-diffable.ts \
        scripts/db-diffable.spec.ts \
        WORKSTREAM.md \
        RECOVERY.md

git commit -m "feat: Phase 1 DRY utilities + Phase 2 object format dump"
```

---

## Epic Context

**Epic:** saf-site-tdi - Automated Content Pipeline
**Branch:** feature/drizzle-pocketbase-sync
**Goal:** Self-maintaining SAF site where upstream releases auto-trigger content updates via CI/CD

**Key Decision:** SQLite + Drizzle + Domain CLI (No Pocketbase GUI, No NocoDB, No lazysql)
- CLI is the interface for both humans (interactive) and CI/CD (--yes, --json)
- Fresh Drizzle database will have SQL-level FK constraints
- Current Pocketbase DB has NO SQL-level FK constraints (app-level only)

---

## Current State

### Test Counts (MUST PASS)
| Suite | Count | Command |
|-------|-------|---------|
| VitePress | 410 | `pnpm test:run` |
| CLI | 453 | `cd cli && pnpm test:run` |
| **Total** | **863** | |

### Progress: ~15%

**Phase 1 (DRY Foundation) - COMPLETE:**
| Task | Description | Status |
|------|-------------|--------|
| saf-site-zpj | fk-utils.ts | DONE ✅ |
| saf-site-jr5 | field-mapping.ts | DONE ✅ |
| saf-site-jg4 | slug-utils.ts | READY (not critical path) |

**Phase 2 (db-diffable) - IN PROGRESS:**
| Task | Description | Status |
|------|-------------|--------|
| saf-site-0by | Object format dump | DONE ✅ |
| **saf-site-km5** | Format auto-detection | **NEXT** |
| saf-site-6uf | Re-export diffable/ | blocked |
| saf-site-o2f | --data-only flag | blocked |
| saf-site-3cn | --skip-tables | blocked |
| saf-site-97p | FK ordering | blocked |

---

## What Was Built This Session

### 1. fk-utils.ts (saf-site-zpj)
**Location:** `docs/.vitepress/database/fk-utils.ts`

**Functions:**
- `detectForeignKeys(table)` - Extract FK info from Drizzle table using introspection symbols
- `getInsertOrder(schema)` - Topological sort for insert-safe order (parents before children)
- `validateFkReference(value, data)` - Check if FK value exists in target data

**Why needed:** db-diffable needs to insert records in FK-safe order during migration (97p)

### 2. field-mapping.ts (saf-site-jr5)
**Location:** `docs/.vitepress/database/field-mapping.ts`

**Functions:**
- `toSnakeCase(fieldName)` - contentType → content_type
- `toCamelCase(fieldName)` - content_type → contentType
- `mapFieldsToSnakeCase(obj)` - Convert all keys recursively
- `mapFieldsToCamelCase(obj)` - Convert all keys recursively

**Why needed:** CLI uses camelCase, Pocketbase/SQLite uses snake_case

### 3. db-diffable --format option (saf-site-0by)
**Location:** `scripts/db-diffable.ts`

**Change:** Added `format: 'array' | 'object'` option to `dump()`
- Array format (default): `[val1, val2, val3]`
- Object format: `{"col1": val1, "col2": val2}`

**Why needed:** Object format is more compatible with standard tools (jq, sqlite-utils)

---

## Next Task: saf-site-km5

**Goal:** Update `load()` to auto-detect NDJSON format

**TDD Specs:**
```typescript
describe('load format detection', () => {
  it('detects array format from first line')
  it('detects object format from first line')
  it('loads array format correctly')
  it('loads object format correctly')
})
```

**Implementation approach:**
1. Read first line of NDJSON file
2. Parse JSON and check if it's an array or object
3. If array: use column order from metadata (current behavior)
4. If object: extract values by column name from metadata

---

## Critical Path to Migration

```
km5 (auto-detect) → 6uf (re-export) → o2f (--data-only) → 3cn + 97p → jur (MIGRATION)
```

**Why --data-only matters:** Current `load()` DELETES the database and recreates tables from Pocketbase schema. This would DESTROY Drizzle's FK constraints. We need `--data-only` to insert data into existing Drizzle schema.

---

## Recovery Commands

```bash
# 1. Read context
cat WORKSTREAM.md

# 2. Check beads status
bd ready
bd show saf-site-km5

# 3. Verify tests pass
pnpm test:run           # Should be 410
cd cli && pnpm test:run # Should be 453

# 4. Start next task
bd update saf-site-km5 --status=in_progress
```

---

## TDD Process (MANDATORY)

```
1. RED: Write failing tests first
   - Create/update spec file
   - Run tests, confirm FAIL

2. GREEN: Implement minimum to pass
   - Write implementation
   - Run tests, confirm PASS

3. Verify all 863 tests still pass

4. Close task: bd close <id> --reason="..."
```

---

## Key Files

| File | Purpose |
|------|---------|
| WORKSTREAM.md | Full workstream context |
| docs/.vitepress/database/WORK-ORDER.md | TDD specs |
| docs/.vitepress/database/fk-utils.ts | FK utilities (NEW) |
| docs/.vitepress/database/field-mapping.ts | Case conversion (NEW) |
| scripts/db-diffable.ts | Export/import tool |
