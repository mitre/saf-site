# Session Recovery - 2026-01-25 (CLI CRUD Architecture)

## Quick Start

```bash
# 1. Read this file and WORKSTREAM.md
cat RECOVERY.md
cat WORKSTREAM.md

# 2. Check task status
bd show saf-site-gf9

# 3. Verify tests pass
pnpm test:run           # VitePress: 432
cd cli && pnpm test:run # CLI: ~514
```

---

## Current Task: saf-site-gf9 (CLI CRUD)

**Status:** Step 2 NEEDS REWORK - Tests are wrong pattern

### Architecture (AGREED - Must Follow This Pattern)

```
┌─────────────────────────────────────┐
│           CLI Layer                 │  table.ts, content.ts
│   (Commander actions - THIN)        │
├─────────────────────────────────────┤
│        CLI Utilities                │  table.cli.ts, content.cli.ts
│   (parsing, formatting - TESTABLE)  │  ← Unit tests go HERE
├─────────────────────────────────────┤
│        Logic Layer                  │  content.logic.ts
│   (business logic - pure functions) │  ← Unit tests go HERE
├─────────────────────────────────────┤
│        Service Layer                │  content-service.ts
│   (GitHub, FK resolution)           │
├─────────────────────────────────────┤
│        Data Layer                   │  drizzle.ts
│   (generic CRUD)                    │  ← Unit tests go HERE (DONE)
└─────────────────────────────────────┘
```

**Key Pattern from content commands:**
- `content.ts` - Commander orchestration (thin)
- `content.cli.ts` - parseAddArgs(), formatAddResult() (unit testable)
- `content.logic.ts` - prepareContentAdd() (unit testable)
- `content-service.ts` - buildContentFromRepo() (unit testable)

### What Exists

| File | Status | Issue |
|------|--------|-------|
| `cli/src/lib/drizzle.ts` | ✅ DONE | 21 unit tests, imports directly |
| `cli/src/lib/drizzle.spec.ts` | ✅ DONE | Correct pattern - unit tests |
| `cli/src/commands/table.ts` | NEEDS REFACTOR | Should extract formatting to table.cli.ts |
| `cli/src/commands/table.spec.ts` | ❌ WRONG PATTERN | 17 E2E tests (spawns CLI), should be unit tests |

### What Went Wrong

1. **Wrote E2E tests instead of unit tests** - table.spec.ts spawns `execSync('npx tsx ...')` for every test. This is slow (~1s/test) and tests the wrong thing.

2. **Didn't follow existing pattern** - content.cli.ts shows the right approach: extract formatting functions, test them directly with imports.

3. **No table.cli.ts** - Should have created this with:
   - `formatTableList(records, format)`
   - `formatTableRecord(record, format)`
   - Unit tests that import these directly

### Correct Approach for table Commands

```
table.ts (thin Commander wrapper)
    │
    ├── table.cli.ts (formatting - NEW)
    │       - formatTableList()
    │       - formatTableRecord()
    │       └── table.cli.spec.ts (unit tests - import directly)
    │
    └── drizzle.ts (data layer - EXISTS)
            - listRecords()
            - getRecord()
            └── drizzle.spec.ts (unit tests - EXISTS)
```

### Step 2 Rework Needed

1. Create `table.cli.ts` with formatting functions extracted from table.ts
2. Create `table.cli.spec.ts` with unit tests (import directly, no CLI spawning)
3. Reduce `table.spec.ts` to 2-3 E2E smoke tests only
4. Follow content.cli.ts pattern exactly

---

## TUI vs Non-Interactive

**Library:** `@clack/prompts` for interactive TUI

**Pattern:**
- Non-interactive: All params via flags, `--json` output, `--yes` for destructive ops
- Interactive: Prompts when params missing, spinners, confirmations

**Current:** table.ts is non-interactive only. TUI can be added later after non-interactive is solid.

---

## Test Counts

| Suite | Expected | Command |
|-------|----------|---------|
| VitePress | 432 | `pnpm test:run` |
| CLI | ~514 | `cd cli && pnpm test:run` |

---

## Recovery Prompt

```
Read RECOVERY.md and WORKSTREAM.md.

CONTEXT:
- Task: saf-site-gf9 (CLI CRUD)
- Step 2 NEEDS REWORK: table.spec.ts uses wrong pattern (E2E instead of unit)
- drizzle.ts and drizzle.spec.ts are CORRECT (unit tests)

ARCHITECTURE TO FOLLOW (from content commands):
- content.ts → content.cli.ts → content.logic.ts → services → data
- table.ts → table.cli.ts (NEW) → drizzle.ts

REWORK NEEDED:
1. Create table.cli.ts with formatting functions
2. Create table.cli.spec.ts with unit tests (import directly)
3. Reduce table.spec.ts to 2-3 E2E smoke tests
4. Follow content.cli.ts pattern exactly

REFERENCE FILES:
- cli/src/commands/content.cli.ts - CORRECT pattern for CLI layer
- cli/src/commands/content.cli.spec.ts - CORRECT pattern for unit tests
- cli/src/lib/drizzle.ts - CORRECT data layer
- cli/src/lib/drizzle.spec.ts - CORRECT unit tests

DO NOT:
- Write E2E tests that spawn CLI processes for unit testing
- Skip the table.cli.ts extraction
- Take shortcuts that ignore the established pattern
```

---

## Key Files Reference

| File | Purpose | Pattern |
|------|---------|---------|
| `cli/src/commands/content.cli.ts` | CLI formatting layer | FOLLOW THIS |
| `cli/src/commands/content.cli.spec.ts` | Unit tests for CLI layer | FOLLOW THIS |
| `cli/src/commands/content.logic.ts` | Business logic layer | FOLLOW THIS |
| `cli/src/lib/drizzle.ts` | Data layer | DONE |
| `cli/src/lib/drizzle.spec.ts` | Data layer unit tests | DONE |
| `cli/SPEC.md` | CLI specification | Reference |
| `cli/ROADMAP.md` | Development roadmap | Reference |
