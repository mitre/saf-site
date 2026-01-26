# SAF Site CLI Specification

## Overview

`saf-site` is a command-line tool for managing SAF site content and database. It provides an interactive TUI for adding, updating, and validating content records with proper FK resolution and GitHub integration.

## Goals

1. **Type-Safe Content Management** - Use Drizzle schema types for validation
2. **Interactive TUI** - Beautiful prompts for complex operations
3. **FK Resolution** - Resolve human-readable names to Pocketbase IDs
4. **GitHub Integration** - Fetch repo metadata, README, inspec.yml automatically
5. **Database Integrity** - Validate referential integrity before/after changes
6. **Developer Experience** - Fast, clear feedback, undo-friendly operations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   content   │  │     db      │  │    dev      │              │
│  │   commands  │  │   commands  │  │  commands   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Library Layer                           ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       ││
│  │  │  pocketbase  │  │    github    │  │   schema     │       ││
│  │  │   client     │  │    client    │  │   types      │       ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Commands

### `saf-site content`

Content record management.

#### `saf-site content list`

List content records with optional filters.

```
Usage: saf-site content list [options]

Options:
  -t, --type <type>      Filter by type (validation|hardening)
  -s, --standard <name>  Filter by standard name
  -T, --target <name>    Filter by target name
  -l, --limit <n>        Limit results (default: 20)
  --json                 Output as JSON

Output:
  Table with: ID, Name, Type, Target, Standard, Version
```

**Behavior:**
- Fetches from Pocketbase with FK expansion
- Sorts by created date descending
- Truncates long names for display
- Shows total count vs displayed count

#### `saf-site content show <id>`

Show detailed content record.

```
Usage: saf-site content show <id>

Output:
  All fields with FK names resolved
  Full description if present
```

**Behavior:**
- Expands all FK relations for display
- Shows all metadata fields
- Formats dates human-readable

#### `saf-site content add [url]`

Interactive wizard to add content from GitHub repo.

```
Usage: saf-site content add [url]

Arguments:
  url  GitHub repository URL (prompted if not provided)

Flow:
  1. Prompt for GitHub URL (if not provided)
  2. Fetch repo metadata, inspec.yml, README
  3. Display fetched info for confirmation
  4. Prompt for content type (validation/hardening)
  5. Prompt for name, slug, description (pre-filled from repo)
  6. Prompt for version (pre-filled from inspec.yml)
  7. Select target (from existing or create new)
  8. Select standard (from existing or skip)
  9. Select technology (from existing)
  10. Select vendor (from existing)
  11. Prompt for control count (pre-filled if found in README)
  12. Confirm and create record
```

**Behavior:**
- Validates GitHub URL format
- Handles GitHub API rate limiting gracefully
- Pre-fills fields from fetched data
- Shows existing FK options sorted alphabetically
- Allows skipping optional FKs
- Validates required fields before creation
- Shows created record ID on success

#### `saf-site content update <id>`

Update content record fields.

```
Usage: saf-site content update <id> [options]

Options:
  --name <name>           Update name
  --description <desc>    Update description
  --version <version>     Update version
  --status <status>       Update status
  --sync-readme           Fetch latest README from GitHub
  --interactive           Interactive mode (prompt for each field)
```

**Behavior:**
- Only updates fields explicitly specified
- `--sync-readme` fetches from github field URL
- `--interactive` prompts for each editable field

#### `saf-site content delete <id>`

Delete content record with confirmation.

```
Usage: saf-site content delete <id>

Flow:
  1. Show record details
  2. Prompt for confirmation
  3. Delete record
```

**Behavior:**
- Shows record before deletion
- Requires explicit confirmation
- Warns about orphaned relationships

### `saf-site db`

Database management commands.

#### `saf-site db status`

Check database connection and show statistics.

```
Usage: saf-site db status

Output:
  - Connection status
  - Record counts per collection
  - Last sync time (if available)
```

#### `saf-site db export`

Export database to diffable format for git.

```
Usage: saf-site db export

Behavior:
  - Runs scripts/export-db.sh
  - Shows diff summary if changes detected
```

#### `saf-site db validate`

Validate database integrity.

```
Usage: saf-site db validate

Checks:
  - Required fields present
  - FK references exist
  - Slug uniqueness
  - Content type enum values
  - URL format validation
```

**Exit codes:**
- 0: All validations pass
- 1: Validation failures found

#### `saf-site db lookups [collection]`

Show FK lookup values.

```
Usage: saf-site db lookups [collection]

Arguments:
  collection  Optional: organizations, standards, technologies, targets, etc.

Output:
  Name → ID mapping for FK selection
```

### `saf-site dev`

Development helper commands.

#### `saf-site dev reload`

Trigger VitePress data loader refresh.

```
Usage: saf-site dev reload

Behavior:
  - Touches paths.ts file to trigger rebuild
  - Reports success/failure
```

## Library APIs

### `lib/pocketbase.ts`

```typescript
// Get authenticated PB client
getPocketBase(): Promise<PocketBase>

// Check connection health
checkConnection(): Promise<boolean>

// Load all FK name→id maps
loadFkMaps(): Promise<FkMaps>

// Resolve name to id
resolveFK(maps: FkMaps, collection: string, name: string): string | null
```

### `lib/github.ts`

```typescript
// Parse GitHub URL to owner/repo
parseGitHubUrl(url: string): { owner: string; repo: string } | null

// Fetch repo metadata
fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo>

// Fetch raw file content
fetchRawFile(owner: string, repo: string, path: string, branch?: string): Promise<string | null>

// Fetch and parse inspec.yml
fetchInspecYml(owner: string, repo: string, branch?: string): Promise<InspecProfile | null>

// Fetch README.md
fetchReadme(owner: string, repo: string, branch?: string): Promise<string | null>

// Generate slug from repo name
generateSlug(repoName: string): string

// Extract control count from README
extractControlCount(readme: string): number | null
```

### `lib/schema.ts`

Re-exports types from `docs/.vitepress/database/schema.ts`:

```typescript
export type {
  Content,
  Organization,
  Standard,
  Technology,
  Target,
  Team,
  Tag,
  Tool,
  // ... etc
}
```

## Error Handling

### User Errors
- Invalid input: Show clear message with expected format
- Missing required field: Highlight field name
- FK not found: Suggest closest matches

### System Errors
- Pocketbase not running: Show start command
- GitHub API rate limited: Show wait time, suggest GITHUB_TOKEN
- Network errors: Suggest retry

### Cancellation
- User cancels prompt: Clean exit with message
- Ctrl+C: Graceful exit, no partial state

## Testing Strategy

### Unit Tests

```
cli/src/lib/github.spec.ts
  - parseGitHubUrl()
  - generateSlug()
  - extractControlCount()

cli/src/lib/pocketbase.spec.ts
  - resolveFK()
  - loadFkMaps() (mocked)
```

### Integration Tests

```
cli/src/commands/content.spec.ts
  - content list (with mock PB)
  - content show (with mock PB)
  - content add (dry-run mode)

cli/src/commands/db.spec.ts
  - db validate (with test data)
  - db lookups (with mock PB)
```

### E2E Tests (Manual)

```
# Test with real Pocketbase instance
pnpm --filter @saf-site/cli dev content list
pnpm --filter @saf-site/cli dev content add https://github.com/mitre/test-baseline
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PB_URL` | `http://localhost:8090` | Pocketbase server URL |
| `PB_EMAIL` | `admin@localhost.com` | Admin email |
| `PB_PASSWORD` | `testpassword123` | Admin password |
| `GITHUB_TOKEN` | (none) | GitHub PAT for API rate limits |

## Future Enhancements

1. **Batch operations** - `content add --from-file repos.txt`
2. **Diff preview** - Show changes before update
3. **Undo** - Track recent operations for reversal
4. **Watch mode** - Auto-sync README on schedule
5. **Templates** - Pre-defined content templates
6. **Plugins** - Extensible command system
