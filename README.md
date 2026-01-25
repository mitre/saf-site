# MITRE SAF Site

Documentation and resource hub for the MITRE Security Automation Framework (SAF).

Built with [VitePress](https://vitepress.dev/) and [Pocketbase](https://pocketbase.io/).

## Prerequisites

Before setting up the project, ensure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 22.x | [nodejs.org](https://nodejs.org/) or use nvm |
| pnpm | 10.x | `npm install -g pnpm` or `corepack enable` |

**Optional but recommended:**
- [nvm](https://github.com/nvm-sh/nvm) - Node version manager (auto-switches via `.nvmrc`)

## Setup

### Automated Setup (Recommended)

After cloning, run the setup script:

```bash
git clone https://github.com/mitre/saf-site-vitepress.git
cd saf-site-vitepress
./scripts/setup.sh
```

The script is **idempotent** - safe to run anytime (first-time setup, after `git pull`, etc.).

**Script options:**
```bash
./scripts/setup.sh              # Normal setup (safe, idempotent)
./scripts/setup.sh --check      # Validate setup without changes
./scripts/setup.sh --dry-run    # Preview what would happen
./scripts/setup.sh --force      # Force fresh database restore
./scripts/setup.sh --force -y   # CI/CD: non-interactive fresh setup
./scripts/setup.sh --help       # Show all options
```

### Manual Setup

If you prefer manual steps or need to troubleshoot:

### 1. Clone the Repository

```bash
git clone https://github.com/mitre/saf-site-vitepress.git
cd saf-site-vitepress
```

### 2. Install Node.js Dependencies

```bash
# If using nvm, this switches to the correct Node version
nvm use

# Install dependencies
pnpm install
```

### 3. Restore the Database

The database content is stored in a git-friendly format and must be restored before first use:

```bash
pnpm db:load
```

This creates `data.db` from the version-controlled `diffable/` directory.

### 4. Clear Migrations (First-Time Only)

The diffable export includes the complete schema, so migrations are not needed. Clear them to avoid conflicts:

```bash
rm -rf .pocketbase/pb_migrations/*
```

> **Note:** Migrations are auto-generated during development. They're only needed if you're iterating on the schema, not for running the existing database.

### 5. Start Pocketbase

```bash
cd .pocketbase && ./pocketbase serve
```

Leave this terminal running. Pocketbase serves at:
- **API**: http://localhost:8090
- **Admin UI**: http://localhost:8090/_/
- **Login**: `admin@localhost.com` / `testpassword123`

### 6. Start the Dev Server

In a new terminal:

```bash
pnpm dev
```

Site runs at http://localhost:5173

## Quick Start (Returning Developers)

```bash
# Start Pocketbase (in background)
cd .pocketbase && ./pocketbase serve &

# Start dev server
pnpm dev
```

## Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm reload-data` | Reload data loaders (after Pocketbase edits) |

### Setup & Database

| Command | Description |
|---------|-------------|
| `pnpm dev:setup` | Run setup (idempotent, safe anytime) |
| `pnpm dev:setup:check` | Validate setup without changes |
| `pnpm dev:setup:force` | Force fresh database restore |
| `pnpm db:export` | Export database to git-friendly format |
| `pnpm db:export:diff` | Export and show git diff |

### Database Schema (DBML)

Generate DBML documentation from the Drizzle schema:

| Command | Description |
|---------|-------------|
| `pnpm db:dbml` | Generate DBML from Drizzle schema |

The script dynamically parses `docs/.vitepress/database/schema.ts` to:
- Extract all tables and columns
- Find all foreign key relationships (including junction tables)
- Auto-generate TableGroups for organization

Output: `docs/.vitepress/database/schema.dbml`

**Visualizing the Schema:**
1. Run `pnpm db:dbml` to generate fresh DBML
2. Copy contents to [dbdiagram.io](https://dbdiagram.io/d)
3. Drag tables to arrange layout
4. Export as PNG/SVG for documentation

### Content Population

Fetch README content from GitHub and populate reference URLs:

| Command | Description |
|---------|-------------|
| `pnpm db:populate` | Fetch README content from GitHub repos |
| `pnpm db:populate:refs` | Populate reference URLs (STIG/CIS links) |

**Script options:**
```bash
npx tsx scripts/fetch-readmes.ts --dry-run    # Preview changes
npx tsx scripts/fetch-readmes.ts --force      # Re-fetch all records
npx tsx scripts/fetch-readmes.ts --refs-only  # Only update reference URLs
npx tsx scripts/fetch-readmes.ts --limit 10   # Process first 10 records
```

### SAF Site CLI

Interactive CLI for managing content and database operations.

| Command | Description |
|---------|-------------|
| `pnpm cli --help` | Show CLI help |
| `pnpm cli content list` | List all content records |
| `pnpm cli content add <url>` | Add content from GitHub repo |
| `pnpm cli content show <id>` | Show content details |
| `pnpm cli db status` | Check database connection |
| `pnpm cli db validate` | Validate database integrity |
| `pnpm cli db lookups` | Show FK lookup values |

**Examples:**
```bash
# Add a new InSpec profile (interactive)
pnpm cli content add https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline

# Add with all options (non-interactive)
pnpm cli content add https://github.com/mitre/some-repo \
  --type validation \
  --vendor MITRE \
  --standard "DISA STIG" \
  --technology InSpec \
  --target "RHEL 9" \
  --yes

# List validation profiles
pnpm cli content list --type validation

# Validate database
pnpm cli db validate
```

See [cli/README.md](cli/README.md) for full CLI documentation.

### pb-cli (Pocketbase CLI)

Optional CLI for advanced database operations. Requires [pb-cli](https://github.com/skeeeon/pb-cli).

| Command | Description |
|---------|-------------|
| `pnpm pb:setup` | Configure pb-cli for this project (recommended) |
| `pnpm db:backup` | Create a binary backup |
| `pnpm db:backup:list` | List available backups |
| `pnpm db:backup:download <name>` | Download a backup file |
| `pnpm db:backup:restore <name>` | Restore from a backup |

**First-time setup:**
```bash
# Install pb-cli (Go required)
go install github.com/skeeeon/pb-cli/cmd/pb@latest

# Configure for this project (auto-configures all 33 collections)
pnpm pb:setup
```

The setup script creates a `saf-site` context with all collections from the database. Run it anytime to sync pb-cli with the current schema.

### Testing

| Command | Description |
|---------|-------------|
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |

### Component Development (Histoire)

| Command | Description |
|---------|-------------|
| `pnpm story:dev` | Start Histoire dev server (generates docs first) |
| `pnpm story:build` | Build stories for production |
| `pnpm story:preview` | Preview built stories |
| `pnpm story:docs` | Regenerate component documentation |
| `pnpm story:docs:check` | Verify docs are up-to-date (for CI) |

### Linting & Type Checking

| Command | Description |
|---------|-------------|
| `pnpm lint` | Check code style (ESLint + @antfu/eslint-config) |
| `pnpm lint:fix` | Auto-fix code style issues |
| `pnpm typecheck` | TypeScript type checking (vue-tsc) |

### CI Pipeline

| Command | Description |
|---------|-------------|
| `pnpm ci` | Run full CI pipeline (typecheck + lint + test + docs check) |
| `pnpm ci:security` | Run security audit (pnpm audit) |

### Task Tracking (Beads)

This project uses [Beads](https://github.com/steveyegge/beads) for task tracking. Tasks live in `.beads/` and sync with git.

| Command | Description |
|---------|-------------|
| `bd ready` | See available work (unblocked tasks) |
| `bd list --status=open` | List all open tasks |
| `bd show <id>` | View task details |
| `bd update <id> --status=in_progress` | Claim a task |
| `bd close <id>` | Complete a task |
| `bd sync` | Sync tasks with git remote |

## Common Workflows

### Daily Development

```bash
# Terminal 1: Start Pocketbase
cd .pocketbase && ./pocketbase serve

# Terminal 2: Start dev server
pnpm dev
```

Site available at http://localhost:5173

### After `git pull` (Sync Changes from Team)

```bash
# Run setup to restore any database changes
pnpm dev:setup

# Restart Pocketbase if it was running
cd .pocketbase && ./pocketbase serve
```

### Adding/Editing Content

1. **Open Pocketbase Admin**: http://localhost:8090/_/
2. **Login**: `admin@localhost.com` / `testpassword123`
3. **Navigate to collection** (e.g., content, organizations, standards)
4. **Edit or add records** - FK fields show searchable dropdowns
5. **Refresh dev server**: `pnpm reload-data`
6. **Export for git**: `pnpm db:export`
7. **Commit**: `git add .pocketbase/pb_data/diffable/ && git commit`

### Adding New Content (Validation Profile or Hardening Content)

1. Open Pocketbase Admin → **content** collection
2. Click **New record**
3. Fill required fields:
   - `name`: Display name (e.g., "RHEL 9 STIG")
   - `slug`: URL-friendly ID (e.g., "rhel-9-stig")
   - `content_type`: Select "validation" or "hardening"
   - `description`: Brief description
   - `github`: GitHub repository URL
   - `vendor`: Select from dropdown (MITRE, etc.)
   - `standard`: Select from dropdown (DISA STIG, CIS, etc.)
   - `target`: Select from dropdown (RHEL 9, etc.)
   - `technology`: Select from dropdown (InSpec, Ansible, etc.)
4. Save → Export → Commit
5. **Optional**: Run `pnpm db:populate` to fetch README from GitHub

### Running Tests Before Committing

```bash
# Run all tests
pnpm test:run

# Run with coverage
pnpm test:coverage

# Watch mode during development
pnpm test
```

### Building for Production

```bash
# Ensure Pocketbase is running
cd .pocketbase && ./pocketbase serve &

# Build static site
pnpm build

# Preview the build
pnpm preview
```

Output is in `docs/.vitepress/dist/`

### Creating a New Component

1. Create component in `docs/.vitepress/theme/components/` with JSDoc (`@component`, `@example`)
2. Create colocated test file (`ComponentName.spec.ts`)
3. Create a story file (`ComponentName.story.vue`) with variants
4. Run `pnpm story:docs` to generate documentation
5. Register globally in `docs/.vitepress/theme/index.ts` if needed
6. Run tests: `pnpm test:run`
7. Run lint: `pnpm lint:fix`
8. View in Histoire: `pnpm story:dev`

See `docs/.vitepress/theme/components/CLAUDE.md` for detailed patterns and conventions.

### Component Development with Histoire

[Histoire](https://histoire.dev/) provides an interactive component explorer (like Storybook).

```bash
# Start Histoire (separate from main dev server)
pnpm story:dev
```

Histoire runs at http://localhost:6006

#### Component Documentation (DRY Pattern)

Documentation is generated automatically from component JSDoc comments. This keeps docs in sync with code (single source of truth).

**In your component, use `@component` and `@example` tags:**
```vue
<script setup lang="ts">
/**
 * @component LogoGrid - Display partner logos in a responsive grid.
 * Supports multiple variants and layouts.
 *
 * @example Basic usage
 * <LogoGrid :items="partners" :showNames="true" />
 *
 * @example Card variant
 * <LogoGrid :items="partners" variant="card" />
 */
export interface LogoGridProps {
  /** Array of logo items to display */
  items: LogoItem[]
  /** Logo size in pixels */
  size?: number
}
</script>
```

**Run `pnpm story:docs` to generate `<docs>` blocks in story files.**

The generated docs include:
- Component description (from `@component`)
- Usage examples (from `@example`)
- Props table (from TypeScript interface)
- Exported types

See `docs/.vitepress/theme/components/STYLE-GUIDE.md` for full conventions.

#### Creating Stories

```vue
<!-- ComponentName.story.vue (colocated with component) -->
<script setup lang="ts">
import ComponentName from './ComponentName.vue'
</script>

<template>
  <Story title="Category/ComponentName">
    <Variant title="Default">
      <ComponentName />
    </Variant>
    <Variant title="With Props">
      <ComponentName :someProp="value" />
    </Variant>
  </Story>
</template>
<!-- <docs> block auto-generated by pnpm story:docs -->
```

**Key features:**
- Dark mode toggle syncs with component themes
- Docs panel shows auto-generated documentation
- Interactive controls panel for props
- Source code viewer
- Multiple variants per component

### Troubleshooting: Data Not Updating

```bash
# After editing in Pocketbase, refresh the dev server
pnpm reload-data
```

### Troubleshooting: Database Out of Sync

```bash
# Force restore from git
pnpm dev:setup:force
```

### Troubleshooting: Pocketbase Won't Start

```bash
# Clear migrations (common fix)
rm -rf .pocketbase/pb_migrations/*

# Try again
cd .pocketbase && ./pocketbase serve
```

## Project Structure

```
docs/
├── .vitepress/
│   ├── config.ts              # VitePress configuration
│   ├── database/
│   │   ├── schema.ts          # Drizzle schema (source of truth)
│   │   └── schema.zod.ts      # drizzle-zod generated validation
│   ├── loaders/
│   │   └── profiles.data.ts   # Build-time Pocketbase queries
│   └── theme/
│       ├── components/        # Vue components
│       │   ├── ui/            # shadcn-vue components
│       │   ├── CLAUDE.md      # AI context for component development
│       │   └── STYLE-GUIDE.md # Documentation conventions
│       ├── composables/       # Vue composables (logic)
│       └── custom.css         # Theme + Tailwind customization
├── index.md                   # Home page
├── content/                   # Content library (validation + hardening)
│   ├── index.md               # Browse page
│   ├── [slug].md              # Dynamic detail page template
│   └── [slug].paths.ts        # Dynamic route generator
└── validate/                  # Legacy validation profiles route

scripts/
├── setup.sh                   # Idempotent project setup
├── setup-pb-cli.sh            # Configure pb-cli for this project
├── fetch-readmes.ts           # Populate content from GitHub
├── export-db.sh               # Export database to diffable/
├── inject-story-docs.ts       # Generate component docs for Histoire
└── inject-story-docs.spec.ts  # Tests for doc generation

.pocketbase/
├── pocketbase                 # Pocketbase binary (macOS ARM64)
├── pb_data/
│   ├── data.db                # SQLite database (gitignored)
│   └── diffable/              # Git-tracked NDJSON export
└── pb_migrations/             # Auto-generated (gitignored)
```

## Content Management

Content is managed in Pocketbase and queried at build time via data loaders.

### Starting Pocketbase

```bash
cd .pocketbase && ./pocketbase serve
```

- Admin UI: http://localhost:8090/_/
- Default login: `admin@localhost.com` / `testpassword123`

### Collections

| Collection | Purpose |
|------------|---------|
| `content` | Validation profiles and hardening content (82 records) |
| `standards` | Compliance frameworks (STIG, CIS, etc.) |
| `technologies` | InSpec, Ansible, Chef, Terraform, etc. |
| `targets` | What gets secured (RHEL 8, MySQL, etc.) |
| `organizations` | MITRE, DISA, CIS, vendors |
| `tags` | Categorization tags |

### Editing Content

1. Start Pocketbase
2. Open admin UI at http://localhost:8090/_/
3. Edit collections (content, standards, technologies, etc.)
4. Run `pnpm reload-data` to refresh dev server

### Populating Content from GitHub

Content records can auto-populate README content and reference URLs:

```bash
# Fetch README.md from GitHub for all content
pnpm db:populate

# Populate reference URLs (STIG/CIS links)
pnpm db:populate:refs
```

### Database Version Control

The database is exported to git-friendly NDJSON format:

```bash
# Export (after editing in Pocketbase)
pnpm db:export

# Import (after cloning/pulling - handled by setup script)
pnpm db:load
```

## Architecture

### Development Flow
```
Edit in Pocketbase UI → pnpm reload-data → Dev server refreshes
```

### Build Flow
```
Pocketbase API → Data Loaders → Composables → Vue Components → Static HTML
```

### Testing
```
Composables (logic) ← Unit tests
Components (presentation) ← Component tests
```

## Testing

Tests use [Vitest](https://vitest.dev/) with [@vue/test-utils](https://test-utils.vuejs.org/).

```bash
pnpm test:run        # Run once
pnpm test:coverage   # With coverage
pnpm test            # Watch mode
```

Test files are colocated with source:
- `composables/useContentDetail.ts` → `composables/useContentDetail.spec.ts`
- `components/ContentDetail.vue` → `components/ContentDetail.spec.ts`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Static Site | VitePress 2.0 (alpha) |
| UI Framework | Vue 3.5 |
| Components | Reka UI (shadcn-vue) |
| Styling | Tailwind CSS 4 |
| Content Database | Pocketbase 0.36 |
| Schema Definition | Drizzle ORM |
| Testing | Vitest 4 |
| Component Stories | Histoire 1.0 (beta) |
| Linting | ESLint 9 + @antfu/eslint-config |
| Type Checking | vue-tsc |
| Package Manager | pnpm 10 |

## Deployment

Build output (`docs/.vitepress/dist/`) can be deployed to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

**Note:** Pocketbase must be running during `pnpm build` to query content.

## Troubleshooting

### Migration Errors on Startup

```
Error: Failed to apply migration ... due to existing relation references
```

**Fix:** Clear the migrations folder - they're not needed with a restored database:
```bash
rm -rf .pocketbase/pb_migrations/*
```

### Pocketbase Binary Not Working (Wrong Platform)

The included binary is for macOS ARM64 (Apple Silicon). For other platforms:

1. Download from [pocketbase.io/docs](https://pocketbase.io/docs/)
2. Replace `.pocketbase/pocketbase` with your platform's binary
3. Make executable: `chmod +x .pocketbase/pocketbase`

### Dev Server Can't Connect to Pocketbase

Ensure Pocketbase is running before starting the dev server:
```bash
# Check if running
curl http://localhost:8090/api/health

# If not, start it
cd .pocketbase && ./pocketbase serve
```

### Data Changes Not Appearing

VitePress data loaders run at build time. After editing in Pocketbase:
```bash
pnpm reload-data
```

### Database Commands Not Working

Ensure dependencies are installed:
```bash
pnpm install
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Apache 2.0 - See [LICENSE.md](LICENSE.md)

## Support

- GitHub Issues: https://github.com/mitre/saf-site-vitepress/issues
- SAF Discussions: https://github.com/mitre/saf/discussions
