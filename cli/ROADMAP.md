# CLI Development Roadmap

TDD bottom-up development plan for the saf-site CLI.

**Approach:** Schema-first, test-driven, bottom-up
**Start Date:** 2026-01-23
**Status:** In Progress

---

## Phase 1: Schema Foundation

**Location:** `docs/.vitepress/database/`

The database folder is the single source of truth for all schemas and types.

### 1.1 Entity Schemas
- [x] Write tests for entity schemas (`schemas.spec.ts`) - 37 tests
- [x] Implement Zod schemas for: target, standard, organization, technology, team, tag
- [x] Implement content schema (extends existing validation.ts)

### 1.2 TypeScript Types
- [x] Export inferred types: `type Target = z.infer<typeof targetSchema>`
- [x] Export input types for create/update operations
- [x] Verify types work with Pocketbase responses
  - Added `pbRecordSchema` for Pocketbase metadata (created, updated, collectionId, collectionName)
  - Added `pb*Schema` for each entity with snake_case fields
  - Added `pbContentWithExpand` for expanded FK relations
  - 12 new tests for Pocketbase compatibility

### 1.3 Validation Functions
- [x] `validateSlug()` - slug format validation
- [x] `validateContent()` - full content validation
- [x] `auditSlug()` - convention compliance check
- [x] Add `validateEntity()` - generic validation pattern
- [x] Add `validateOrganization()`, `validateTarget()`, `validateStandard()`, etc.
- [x] Add `auditEntity()` - generic audit with slug suggestion
- [x] Refactored validation.ts to use schemas.ts as source of truth

---

## Phase 2: Service Layer

**Location:** `cli/src/lib/`

### 2.1 GitHub Service
- [x] `parseGitHubUrl()` - extract owner/repo
- [x] `fetchRepoInfo()` - repository metadata
- [x] `fetchInspecYml()` - parse inspec.yml
- [x] `fetchReadme()` - fetch README content
- [x] `extractControlCount()` - parse control count from README
- [x] `generateSlug()` - basic slug from repo name

### 2.2 Pocketbase Service
- [x] `getPocketBase()` - authenticated client
- [x] `checkConnection()` - connectivity check
- [x] `loadFkMaps()` - FK lookup maps
- [x] `createContent()` - create with validation + snake_case conversion
- [x] `updateContent()` - update with validation + snake_case conversion
- [x] `getContentBySlug()` - lookup by slug with optional FK expansion
- [x] `listContent()` - filtered list with expansion and sorting

### 2.3 Content Service
- [x] Write tests for `content-service.spec.ts` - 26 tests
- [x] `buildContentFromRepo()` - GitHub repo + inspec.yml + README → CreateContentInput
- [x] `resolveContentFKs()` - human-readable names → Pocketbase IDs
- [x] `diffContent()` - compare existing record vs updated input

---

## Phase 3: Command Logic

**Location:** `cli/src/commands/`

Separate pure business logic from I/O.

### 3.1 Content Command Logic
- [ ] Write tests for `content.logic.spec.ts`
- [ ] `prepareContentAdd()` - validate inputs, build record
- [ ] `prepareContentUpdate()` - diff and validate changes

### 3.2 Database Command Logic
- [x] `db status` - connection check
- [x] `db export` - export to diffable
- [x] `db validate` - FK integrity
- [x] `db lookups` - show FK values
- [x] `db audit` - slug convention audit

---

## Phase 4: CLI Interface

**Location:** `cli/src/`

### 4.1 Mode Detection
- [ ] Write tests for `cli.spec.ts`
- [ ] `isInteractive()` - TTY detection
- [ ] `--yes` / `-y` flag support
- [ ] `--json` output format
- [ ] `--quiet` minimal output

### 4.2 Interactive Prompts
- [ ] Content add wizard (missing params → prompts)
- [ ] Confirmation prompts for destructive actions
- [ ] Progress spinners and feedback

### 4.3 Non-Interactive Mode
- [ ] All params via flags
- [ ] Clear error messages for missing required params
- [ ] JSON output for scripting
- [ ] Proper exit codes

---

## Test Summary

| Phase | Test File | Tests | Status |
|-------|-----------|-------|--------|
| 1 | `schemas.spec.ts` | 49 | ✅ Passing |
| 1 | `conventions.spec.ts` | 32 | ✅ Passing |
| 1 | `validation.spec.ts` | 35 | ✅ Passing |
| 2 | `github.spec.ts` | 37 | ✅ Passing |
| 2 | `pocketbase.spec.ts` | 38+5 skipped | ✅ Passing |
| 2 | `content-service.spec.ts` | 26 | ✅ Passing |
| 3 | `content.logic.spec.ts` | TBD | Not started |
| 4 | `cli.spec.ts` | TBD | Not started |

**Current Total:** 217 passing, 5 skipped

---

## Progress Log

### Session 047 (2026-01-23)
- [x] Schema-first refactor: moved conventions.ts, validation.ts to database folder
- [x] Added @schema/* path alias to CLI
- [x] Phase 1.1: Entity schemas (TDD)
  - Wrote 37 failing tests for schemas.spec.ts
  - Implemented Zod schemas for all entities
  - All 123 tests passing
- [x] Phase 1.2: Pocketbase type compatibility (TDD)
  - Wrote 12 failing tests for Pocketbase schemas
  - Implemented pb*Schema for all entities with snake_case
  - Added pbContentWithExpand for FK expansion
  - All 135 tests passing
- [x] Phase 1.3: Entity validation functions (TDD)
  - Wrote 35 failing tests for validation functions
  - Implemented validateEntity(), validateOrganization(), etc.
  - Added auditEntity() with slug suggestion generation
  - Refactored validation.ts to use schemas.ts as source of truth
  - All 170 tests passing

### Session 048 (2026-01-23)
- [x] Phase 2.2: Pocketbase CRUD operations (TDD)
  - Wrote 21 failing tests for CRUD operations
  - Implemented `getContentBySlug()` with optional FK expansion
  - Implemented `listContent()` with filtering, sorting, expansion
  - Implemented `createContent()` with Zod validation + snake_case conversion
  - Implemented `updateContent()` with partial update + validation
  - All 191 tests passing
- [x] Phase 2.3: Content Service (TDD)
  - Wrote 26 failing tests for content service
  - Implemented `buildContentFromRepo()` - builds CreateContentInput from GitHub data
  - Implemented `resolveContentFKs()` - resolves human names to Pocketbase IDs
  - Implemented `diffContent()` - compares existing vs updated content
  - All 217 tests passing

---

## References

- [NAMING-CONVENTIONS.md](../docs/.vitepress/database/NAMING-CONVENTIONS.md) - Slug conventions
- [conventions.ts](../docs/.vitepress/database/conventions.ts) - Abbreviation maps
- [validation.ts](../docs/.vitepress/database/validation.ts) - Zod schemas
- [schema.ts](../docs/.vitepress/database/schema.ts) - Drizzle schema (reference)
