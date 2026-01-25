# Session Recovery - 2026-01-25 (CLI CRUD Architecture)

## Quick Start

```bash
# 1. Read this file and WORKSTREAM.md
cat RECOVERY.md
cat WORKSTREAM.md

# 2. Verify drizzle.db exists
ls -la docs/.vitepress/database/drizzle.db  # Should be ~1.3MB

# 3. Verify tests pass
pnpm test:run           # Should be 432
cd cli && pnpm test:run # Should be 497 (plus new table tests)

# 4. Check task status
bd show saf-site-gf9
```

---

## Current Task: saf-site-gf9 (CLI CRUD)

**Status:** Step 2 IN PROGRESS - Generic table commands

### Architecture (AGREED - Option A Service Layer)

```
┌─────────────────────────────────────┐
│           CLI Layer                 │  table.ts, content.ts, db.ts
│   (argument parsing, output)        │
├─────────────────────────────────────┤
│        Service Layer                │  content-service.ts (domain logic)
│   (validation, GitHub, FK by name)  │  Generic commands SKIP this layer
├─────────────────────────────────────┤
│        Data Layer                   │  drizzle.ts (generic CRUD)
│   (listRecords, createRecord, etc)  │
└─────────────────────────────────────┘
```

**Key insight:** Generic table commands are THIN wrappers around drizzle.ts (no service layer). Domain commands (content.ts) use the service layer for business logic.

### Step Progress

| Step | Description | Status |
|------|-------------|--------|
| 1 | Data layer (drizzle.ts) | ✅ DONE (21 tests) |
| 2 | Generic table commands (table.ts) | 🔄 IN PROGRESS |
| 3 | Service layer (content-service.ts) | - |
| 4 | Migrate domain commands | - |
| 5 | Delete pocketbase.ts | - |

---

## Step 2: Generic Table Commands

### What Was Created

1. **`cli/src/commands/table.spec.ts`** - 17 TDD tests (RED phase)
2. **`cli/src/commands/table.ts`** - Implementation (GREEN phase in progress)
3. **`cli/src/index.ts`** - Updated to register tableCommand

### Commands Being Implemented

```bash
pnpm cli table list <table> [--filter key=value] [--json]
pnpm cli table show <table> <id> [--json]
pnpm cli table add <table> --data <json> [--json]
pnpm cli table update <table> <id> --data <json> [--json]
pnpm cli table delete <table> <id> [--yes]
```

### Current Issue

Tests are failing because:
1. The tests use `execSync('pnpm cli ...')`
2. Need to verify CLI is accessible from test context
3. May need to run from correct directory or use different invocation

### Next Steps to Complete Step 2

1. Fix test invocation (may need to use `tsx src/index.ts` instead of `pnpm cli`)
2. Run tests, verify they pass
3. Verify all existing tests still pass (497 CLI tests)
4. Commit when GREEN

---

## Files Modified This Session

| File | Change |
|------|--------|
| `cli/src/lib/drizzle.ts` | Created - generic CRUD layer |
| `cli/src/lib/drizzle.spec.ts` | Created - 21 tests |
| `cli/src/commands/table.ts` | Created - generic table commands |
| `cli/src/commands/table.spec.ts` | Created - 17 TDD tests |
| `cli/src/index.ts` | Added tableCommand registration |
| `WORKSTREAM.md` | Updated with architecture and step order |

---

## Key Decisions Made

1. **Option A (Service Layer)** is the correct architecture - more testable, isolated
2. **Generic commands skip service layer** - they're pure CRUD wrappers
3. **Domain commands use service layer** - for business logic (GitHub, validation)
4. **Order matters**: Generic table commands BEFORE migrating domain commands
5. **TDD is mandatory** - don't move on until tests pass

---

## Test Counts

| Suite | Count | Command |
|-------|-------|---------|
| VitePress | 432 | `pnpm test:run` |
| CLI | 497 + 17 new | `cd cli && pnpm test:run` |

---

## Git Commits This Session

1. `f006190` - feat(cli): add Drizzle data layer for generic CRUD operations
2. `9080567` - docs: update WORKSTREAM.md with corrected CLI CRUD plan

---

## Recovery Prompt

```
Read RECOVERY.md and WORKSTREAM.md.

CONTEXT:
- Task: saf-site-gf9 (CLI CRUD)
- Step 2 IN PROGRESS: Generic table commands
- Created table.ts and table.spec.ts (17 tests)
- Tests currently failing - need to fix test invocation

ARCHITECTURE (Option A - Service Layer):
- CLI Layer: table.ts (generic), content.ts (domain)
- Service Layer: content-service.ts (domain logic only)
- Data Layer: drizzle.ts (generic CRUD) ✅ DONE

NEXT:
1. Fix table.spec.ts test invocation
2. Run tests until GREEN
3. Verify all 497+ CLI tests pass
4. Commit Step 2
5. Then Step 3: Service layer

DO NOT:
- Skip TDD steps
- Move on until tests pass
- Add unnecessary abstractions
```
