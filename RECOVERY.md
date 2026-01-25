# Session Recovery - 2026-01-25 (Drizzle DB Created)

## Quick Start

```bash
# 1. Read context
cat WORKSTREAM.md
bd show saf-site-3b9

# 2. Verify drizzle.db exists
ls -la docs/.vitepress/database/drizzle.db  # Should be ~1.3MB

# 3. If missing, regenerate it:
npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:docs/.vitepress/database/drizzle.db"
# Then run migration script (see below)

# 4. Verify tests pass
pnpm test:run           # Should be 432
cd cli && pnpm test:run # Should be 476
```

---

## Drizzle Database Status: ✅ CREATED

**Location:** `docs/.vitepress/database/drizzle.db` (1.3MB, gitignored)

### Record Counts
| Table | Count |
|-------|-------|
| content | 85 |
| organizations | 16 |
| targets | 27 |
| standards | 18 |
| tags | 52 |
| capabilities | 5 |
| technologies | 8 |
| tools | 7 |
| content_tags | 115 |
| content_capabilities | 85 |
| content_relationships | 4 |

### Data Quality
- FK constraints enforced ✅
- All content linked to capabilities ✅
- Validation ↔ Hardening relationships ✅

---

## Epic Context

**Epic:** saf-site-tdi - Automated Content Pipeline
**Branch:** feature/drizzle-pocketbase-sync
**Progress:** ~50% complete

**Goal:** Self-maintaining SAF site where upstream releases auto-trigger content updates via CI/CD

---

## Completed This Session

### Phase 3: Migration ✅ COMPLETE
- Added db-diffable options: `emptyToNull`, `columnMappings`, `ignoreConflicts`
- Created drizzle.db with all data migrated
- Fixed content_capabilities (populated 85 rows from content_type)
- Added drizzle.db to .gitignore

---

## Next Tasks

### 1. Add migration to dev:setup (not tracked as beads task)
Create script to regenerate drizzle.db from diffable/ so other devs can set up.

### 2. saf-site-3b9: Update VitePress loaders to use Drizzle
- Currently: Loaders query Pocketbase API at build time
- Target: Loaders query drizzle.db directly (no Pocketbase needed)

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/.vitepress/database/drizzle.db` | Drizzle SQLite database (gitignored) |
| `docs/.vitepress/database/schema.ts` | Drizzle schema (source of truth) |
| `scripts/db-diffable.ts` | Export/import tool with migration options |
| `scripts/migrate-to-drizzle.spec.ts` | Migration tests (9 tests) |
| `.pocketbase/pb_data/diffable/` | Source data (NDJSON, git-tracked) |

---

## Migration Script (for regenerating drizzle.db)

```typescript
import * as schema from './docs/.vitepress/database/schema'
import { getInsertOrder } from './docs/.vitepress/database/fk-utils'
import { ColumnMapping, load } from './scripts/db-diffable'

const COLUMN_MAPPINGS: Record<string, ColumnMapping> = {
  content_capabilities: { rename: { content: 'content_id', capability: 'capability_id' }, skip: ['id'] },
  content_relationships: { rename: { content: 'content_id', related_content: 'related_content_id' }, skip: ['id'] },
  content_tags: { rename: { content: 'content_id', tag: 'tag_id' }, skip: ['id'] },
  course_capabilities: { rename: { course: 'course_id', capability: 'capability_id' }, skip: ['id'] },
  course_tags: { rename: { course: 'course_id', tag: 'tag_id' }, skip: ['id'] },
  course_tools: { rename: { course: 'course_id', tool: 'tool_id' }, skip: ['id'] },
  distribution_capabilities: { rename: { distribution: 'distribution_id', capability: 'capability_id' }, skip: ['id'] },
  distribution_tags: { rename: { distribution: 'distribution_id', tag: 'tag_id' }, skip: ['id'] },
  media_capabilities: { rename: { media: 'media_id', capability: 'capability_id' }, skip: ['id'] },
  media_tags: { rename: { media: 'media_id', tag: 'tag_id' }, skip: ['id'] },
  tool_capabilities: { rename: { tool: 'tool_id', capability: 'capability_id' }, skip: ['id'] },
  tool_tags: { rename: { tool: 'tool_id', tag: 'tag_id' }, skip: ['id'] },
}

const tableOrder = getInsertOrder(schema)

// 1. Create schema: npx drizzle-kit push --dialect=sqlite --schema=docs/.vitepress/database/schema.ts --url="file:docs/.vitepress/database/drizzle.db"

// 2. Load data
load('docs/.vitepress/database/drizzle.db', '.pocketbase/pb_data/diffable', {
  dataOnly: true,
  skipTables: ['_*'],
  tableOrder,
  emptyToNull: true,
  columnMappings: COLUMN_MAPPINGS,
  ignoreConflicts: true,
})

// 3. Populate content_capabilities from content_type
// sqlite3 drizzle.db "INSERT INTO content_capabilities (content_id, capability_id) SELECT id, 'l39v4q9e3gol7p1' FROM content WHERE content_type = 'validation';"
// sqlite3 drizzle.db "INSERT INTO content_capabilities (content_id, capability_id) SELECT id, 'k9862idzj7324cf' FROM content WHERE content_type = 'hardening';"
```

---

## Test Counts

| Suite | Count | Command |
|-------|-------|---------|
| VitePress | 432 | `pnpm test:run` |
| CLI | 476 | `cd cli && pnpm test:run` |
| **Total** | **908** | |

---

## Git Commits This Session

1. `feat(db-diffable): add migration options for Drizzle transition (saf-site-jur)`
2. `docs: update RECOVERY.md and WORKSTREAM.md for completed migration`
3. `chore: gitignore drizzle.db (generated from diffable/)`
4. `docs: update RECOVERY.md with Drizzle DB status`
