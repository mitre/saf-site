# Work Order: Automated Content Pipeline

**Epic:** saf-site-tdi
**Decision:** SQLite + Drizzle + Domain CLI (No external GUI)
**Approach:** Clean migration to fresh Drizzle-managed database
**Date:** 2025-01-25

## Decision Summary

From evaluation (saf-site-9ew):
- **No Pocketbase** - Only provided GUI, we don't need it
- **No NocoDB** - Same reason
- **No lazysql** - Reference for UX patterns only
- **CLI is the interface** - Both human (interactive) and CI/CD (--yes, --json)
- **Clean database** - Fresh Drizzle DB with FK constraints, no PB baggage

## TDD Process

For each task:

```
1. Write failing tests (RED)
   └── Define expected behavior
   └── Cover edge cases
   └── Commit tests

2. Implement minimum to pass (GREEN)
   └── No over-engineering
   └── Follow existing patterns
   └── Commit implementation

3. Refactor if needed (REFACTOR)
   └── DRY violations
   └── Performance
   └── Commit refactor

4. Verify all 368+ existing tests pass

5. Close task: bd close <id>
```

---

## Phase 1: DRY Foundation

**Status:** READY (no blockers)

| Task | Description | Ready |
|------|-------------|-------|
| saf-site-jr5 | field-mapping.ts (camelCase ↔ snake_case) | ✅ |
| saf-site-zpj | fk-utils.ts (FK validation, ordering) | ✅ |
| saf-site-jg4 | slug-utils.ts (consolidate slug generation) | ✅ |

**Start with:** jr5 + zpj (independent, can parallel)

### saf-site-jr5: field-mapping.ts

```typescript
describe('field-mapping', () => {
  it('converts camelCase to snake_case')
  it('converts snake_case to camelCase')
  it('handles nested objects')
  it('preserves null/undefined')
  it('round-trips correctly')
})
```

### saf-site-zpj: fk-utils.ts

```typescript
describe('fk-utils', () => {
  it('detects FK columns from Drizzle schema')
  it('orders tables by FK dependencies')
  it('validates FK reference exists')
  it('handles self-references gracefully')
  it('returns insert-safe order')
})
```

### saf-site-jg4: slug-utils.ts

```typescript
describe('slug-utils', () => {
  it('generates slug from content name')
  it('abbreviates target names')
  it('abbreviates standard names')
  it('parses GitHub repo to slug')
  it('validates slug format')
})
```

---

## Phase 2: db-diffable Feature Complete

**Goal:** Object format + data-only import for clean migration

| Task | Description | Blocked By |
|------|-------------|------------|
| saf-site-0by | Object format dump | ✅ READY |
| saf-site-km5 | Format auto-detection (load) | 0by |
| saf-site-6uf | Re-export diffable/ | km5 |
| saf-site-o2f | --data-only flag | 6uf |
| saf-site-3cn | --skip-tables option | o2f |
| saf-site-97p | FK dependency ordering | o2f, zpj |

### saf-site-0by: Object format dump

```typescript
describe('dump with object format', () => {
  it('outputs NDJSON with objects not arrays')
  it('each line is self-contained JSON object')
  it('includes all column names as keys')
  it('maintains backward compatibility with --format=array')
})
```

### saf-site-km5: Format auto-detection

```typescript
describe('load format detection', () => {
  it('detects array format from first line')
  it('detects object format from first line')
  it('loads array format correctly')
  it('loads object format correctly')
})
```

### saf-site-o2f: --data-only flag

```typescript
describe('load --data-only', () => {
  it('skips table creation')
  it('inserts into existing tables')
  it('preserves existing FK constraints')
  it('fails gracefully if table missing')
})
```

### saf-site-3cn: --skip-tables

```typescript
describe('load --skip-tables', () => {
  it('skips tables matching pattern')
  it('skips PB internal tables with "_*"')
  it('processes other tables normally')
})
```

### saf-site-97p: FK ordering

```typescript
describe('FK-safe insert order', () => {
  it('inserts reference tables first')
  it('inserts dependent tables after')
  it('handles circular references')
  it('uses fk-utils for ordering')
})
```

---

## Phase 3: Database Migration

| Task | Description | Blocked By |
|------|-------------|------------|
| saf-site-jur | Migrate to fresh Drizzle DB | o2f, 3cn, 97p |

### saf-site-jur: Clean migration

```bash
# Steps:
1. drizzle-kit push → fresh DB with FK constraints
2. db-diffable load --data-only --skip-tables '_*'
3. Verify data integrity
4. Update config to use new DB
5. Remove old PB database
```

```typescript
describe('database migration', () => {
  it('creates DB with FK constraints')
  it('imports all content data')
  it('imports all reference data')
  it('skips PB internal tables')
  it('maintains referential integrity')
})
```

---

## Phase 4: Core Features

**After clean DB exists**

| Task | Description | Blocked By |
|------|-------------|------------|
| saf-site-gf9 | Schema-driven CLI CRUD | jur |
| saf-site-3b9 | VitePress loaders → Drizzle | jur |

### saf-site-gf9: CLI CRUD

Generic CRUD + domain commands. Reference lazysql for UX patterns.

```typescript
describe('generic CRUD', () => {
  describe('list', () => { ... })
  describe('show', () => { ... })
  describe('add', () => { ... })
  describe('update', () => { ... })
  describe('delete', () => { ... })
})

describe('domain commands', () => {
  describe('content add-release', () => { ... })
  describe('tool add', () => { ... })
})
```

### saf-site-3b9: Data loaders

```typescript
describe('Drizzle data loaders', () => {
  it('loads content without PB server')
  it('expands FK relations')
  it('works in build environment')
})
```

---

## Phase 5: Domain Features

| Task | Description | Blocked By |
|------|-------------|------------|
| saf-site-c9k | Release management commands | gf9 |
| saf-site-u62 | CLI automation polish | gf9 |

---

## Phase 6: CI/CD & Epic Complete

| Task | Description | Blocked By |
|------|-------------|------------|
| saf-site-0j8 | GitHub Actions workflows | c9k, u62, 3b9 |
| saf-site-tdi | Epic complete | 0j8 |

---

## Starting Point

**Ready now:**
1. saf-site-jr5 (field-mapping.ts)
2. saf-site-zpj (fk-utils.ts)
3. saf-site-jg4 (slug-utils.ts)
4. saf-site-0by (object format dump)

**Recommended:** Start with zpj (fk-utils) - it unblocks 97p (FK ordering)

---

## Success Criteria

- [ ] All 368+ existing tests pass throughout
- [ ] db-diffable exports object format NDJSON
- [ ] db-diffable imports data-only into existing schema
- [ ] Fresh Drizzle DB with FK constraints
- [ ] CLI works interactive + automation modes
- [ ] VitePress builds without PB server
- [ ] GitHub Actions can automate content updates
