# SAF Site VitePress Architecture

## Core Principle

**Single source of truth:** SQLite database (via Drizzle ORM) manages all content with FK constraints, version-controlled via sqlite-diffable. VitePress queries SQLite directly at build time for static site generation. No server required.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT MANAGEMENT LAYER                     │
│                                                                 │
│  SAF Site CLI (pnpm cli)                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Command-line content management                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │ content add │  │ content list│  │  db status  │       │ │
│  │  │ (from URL)  │  │ (browse)    │  │ (validate)  │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Drizzle ORM (Direct SQLite access)                       │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  drizzle.db (SQLite binary)                         │ │ │
│  │  │  - 12 tables (base + FKs + junctions)               │ │ │
│  │  │  - FK constraints enforced                          │ │ │
│  │  │  - Relational queries via Drizzle                   │ │ │
│  │  │  - No server required                               │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  sqlite-diffable export (version control)                 │ │
│  │  docs/.vitepress/database/diffable/                       │ │
│  │    - *.metadata.json (table schemas)                      │ │
│  │    - *.ndjson (data, one record per line)                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ (git commits)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VITEPRESS BUILD LAYER                        │
│                                                                 │
│  VitePress Data Loaders (build time)                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  content.data.ts                                          │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Query SQLite via Drizzle ORM                       │ │ │
│  │  │  import { db } from '../database/db'                │ │ │
│  │  │  const items = await db.query.content.findMany({    │ │ │
│  │  │    with: { target: true, standard: true, ... }      │ │ │
│  │  │  })                                                 │ │ │
│  │  │  return { items }  // Fully typed data              │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Vue 3 Components                                         │ │
│  │  - ContentCard, ContentFilters, ContentDetail             │ │
│  │  - Browse pages with client-side filtering                │ │
│  │  - Detail pages (dynamic routes)                          │ │
│  │  - shadcn-vue / Reka UI components                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│              Static Site (docs/.vitepress/dist/)               │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Content Management | SAF Site CLI (pnpm cli) |
| Database | SQLite (via Drizzle ORM) |
| ORM | Drizzle ORM 0.45 |
| Version Control | sqlite-diffable (NDJSON exports) |
| Static Site | VitePress 2.0.0-alpha.15 |
| UI Framework | Vue 3.5 |
| Components | shadcn-vue / Reka UI |
| Testing | Vitest 4 |
| Data Loading | VitePress Data Loaders (query SQLite) |
| Source of Truth | SQLite database |

## Prerequisites

### Required

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 22.x | https://nodejs.org/ or `nvm use` |
| pnpm | 10.x | `npm install -g pnpm` |
| Python | 3.8+ | System Python or pyenv |
| pip | latest | Included with Python |

### Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `sqlite-diffable` - Git-friendly database export/import

## Data Flow

### Content Editing (Development)
```
CLI (pnpm cli content add) → SQLite Database → sqlite-diffable export → Git commit → Push
```

### Production Build (CI/CD)
```
Git clone → sqlite-diffable restore → VitePress queries SQLite → Build static site → Deploy
```

### Local Development
```
pnpm dev → VitePress queries SQLite directly → Hot reload on data changes
```

## Tables (12 Total)

### Base Tables (No Foreign Keys)
- **tags** - Content tags (ansible, cloud, security, etc.)
- **organizations** - Organizations (MITRE, DISA, CIS, etc.)
- **technologies** - Technologies (InSpec, Ansible, Terraform, etc.)
- **standards** - Standards (STIG, CIS, NIST, PCI-DSS, etc.)
- **capabilities** - Capabilities (validate, harden, plan, etc.)

### Tables with Foreign Keys
- **teams** - Teams (FK: organization)
- **content** - All content items (FKs: technology, organization, team, standard, target)
- **tools** - Tools (FKs: technology, organization)
- **targets** - Targets (FK: category)

### Junction Tables (Many-to-Many)
- **content_tags** - Links content to tags
- **content_relationships** - Links content items to each other

## Schema Architecture (Single Source of Truth)

The schema flows through a layered architecture:

```
┌────────────────────────────────────────────────────────────────┐
│  schema.ts (Drizzle)          ← SINGLE SOURCE OF TRUTH        │
│  docs/.vitepress/database/schema.ts                            │
│  - Table definitions with types, constraints, defaults         │
│  - FK relationships                                            │
│  - Enum definitions                                            │
└──────────────────────┬─────────────────────────────────────────┘
                       │ drizzle-zod
                       ▼
┌────────────────────────────────────────────────────────────────┐
│  schema.zod.ts (drizzle-zod)  ← GENERATED VALIDATION          │
│  docs/.vitepress/database/schema.zod.ts                        │
│  - Insert/Select schemas for all tables                        │
│  - Custom refinements (slug, semver, URL patterns)             │
│  - Enum schemas (contentType, status, orgType, etc.)           │
│  - Type exports (ContentInsert, ContentSelect, etc.)           │
└──────────────────────┬─────────────────────────────────────────┘
                       │ imports
           ┌───────────┴───────────┐
           ▼                       ▼
┌──────────────────────┐  ┌──────────────────────┐
│  CLI                 │  │  VitePress           │
│  cli/src/lib/        │  │  validation.ts       │
│  - drizzle.ts        │  │  - Entity validation │
│  - content.logic.ts  │  │  - Audit functions   │
└──────────────────────┘  └──────────────────────┘
```

**Key files:**
- `schema.ts` - Drizzle table definitions (edit this to change schema)
- `schema.zod.ts` - Generated Zod schemas (regenerate after schema changes)
- `validation.ts` - Convention-aware validation (imports from schema.zod.ts)
- `db.ts` - Shared Drizzle database instance

**Benefits:**
- Single source of truth for all validation
- Type-safe validation shared between CLI and VitePress
- Automatic sync between database schema and runtime validation
- No duplicate manual Zod schemas to maintain

## Directory Structure

```
saf-site-vitepress/
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts           # VitePress config
│   │   ├── database/
│   │   │   ├── schema.ts       # Drizzle schema (source of truth)
│   │   │   ├── schema.zod.ts   # drizzle-zod generated Zod schemas
│   │   │   ├── db.ts           # Shared Drizzle database instance
│   │   │   ├── drizzle.db      # SQLite database (gitignored)
│   │   │   └── diffable/       # Git-tracked NDJSON exports
│   │   │       ├── *.metadata.json # Table schemas
│   │   │       └── *.ndjson    # Table data
│   │   ├── loaders/
│   │   │   └── content.data.ts # Query SQLite via Drizzle
│   │   └── theme/
│   │       ├── index.ts
│   │       ├── custom.css
│   │       ├── components/
│   │       │   ├── ContentCard.vue
│   │       │   ├── ContentFilters.vue
│   │       │   └── ContentDetail.vue
│   │       └── composables/
│   │           ├── useContentDetail.ts
│   │           └── useContentFiltering.ts
│   ├── public/
│   │   └── img/                # Logos, icons, badges
│   ├── index.md                # Home page
│   └── content/
│       ├── index.md            # Browse all content
│       ├── [slug].md           # Dynamic detail pages
│       └── [slug].paths.ts     # Dynamic route generator
├── cli/
│   ├── src/                    # CLI source code
│   └── README.md               # CLI documentation
├── scripts/
│   ├── setup.sh                # Idempotent setup script
│   ├── export-db.sh            # Export database to diffable/
│   └── *.ts                    # Various migration/import scripts
└── requirements.txt            # Python dependencies
```

## Content Editing Workflow

### 1. Initial Setup (First Time)

```bash
# Clone repository
git clone https://github.com/mitre/saf-site-vitepress.git
cd saf-site-vitepress

# Run setup script (handles everything)
./scripts/setup.sh

# Or use pnpm
pnpm dev:setup
```

The setup script:
1. Checks prerequisites (Node.js, pnpm, sqlite-diffable)
2. Installs Node dependencies
3. Restores database from `diffable/` (if not exists)
4. Validates setup

**Script options:**
```bash
pnpm dev:setup              # Normal setup (idempotent)
pnpm dev:setup:check        # Validate without changes
pnpm dev:setup:force        # Force fresh database restore
./scripts/setup.sh -h       # Show all options
```

### 2. Start Development

```bash
# Single terminal - no server needed
pnpm dev
```

### 3. Edit Content

Use the CLI to manage content:

```bash
# Add new content from GitHub repo
pnpm cli content add https://github.com/mitre/some-repo

# List all content
pnpm cli content list

# Show content details
pnpm cli content show <id>

# Check database status
pnpm cli db status
```

After changes, run `pnpm reload-data` to refresh the dev server.

### 4. Export Changes for Git

```bash
# Export database to git-friendly format
pnpm db:export

# Or with diff preview
pnpm db:export:diff

# Review changes
git diff docs/.vitepress/database/diffable/

# Commit
git add docs/.vitepress/database/diffable/
git commit -m "content: update profiles"
git push
```

### 5. Build & Deploy

```bash
# Build static site (no server needed)
pnpm build

# Deploy docs/.vitepress/dist/ to hosting
```

## VitePress Data Loader Pattern

**All data loaders query SQLite directly via Drizzle:**

```typescript
// docs/.vitepress/loaders/content.data.ts
import { defineLoader } from 'vitepress'
import { db } from '../database/db'

export interface ContentData {
  items: ContentItem[]
}

export default defineLoader({
  async load(): Promise<ContentData> {
    // Query with automatic relation expansion
    const items = await db.query.content.findMany({
      with: {
        target: true,
        standard: true,
        technology: true,
        vendor: true,
        maintainer: true,
      },
    })

    return { items }
  }
})
```

**Key features:**
- No server required - queries SQLite file directly
- Automatic FK expansion via Drizzle relations
- Returns fully typed data with camelCase field names
- Build-time only - data embedded in static HTML

## CI/CD Pipeline

**Build process requires only the SQLite database:**

```yaml
# Example GitHub Actions workflow
steps:
  - name: Checkout code
    uses: actions/checkout@v3

  - name: Restore database
    run: |
      cd docs/.vitepress/database
      sqlite-diffable load diffable/ drizzle.db --all

  - name: Install dependencies
    run: pnpm install

  - name: Build VitePress site
    run: pnpm build

  - name: Deploy
    run: # ... deploy docs/.vitepress/dist/
```

## Why This Architecture?

### Content Management
- **CLI** handles content CRUD operations
- **SQLite** provides full relational database features
- **Drizzle ORM** provides type-safe queries with relation expansion
- **No server required** - database is just a file

### Version Control
- **sqlite-diffable** converts binary DB to text-based NDJSON
- **One JSON record per line** (git-friendly, easy diffs)
- **Separate schema + data files** (.metadata.json + .ndjson)
- **No merge conflicts** (JSONL is line-based)

### Static Site Generation
- **VitePress** excels at documentation sites (search, nav, sidebar)
- **Data loaders** query SQLite directly at build time
- **No runtime overhead** (all data pre-loaded at build)
- **Vue 3** provides reactive filtering/search on static data

### Single Source of Truth
- **Database is authoritative** (not YAML, not JSON exports)
- **No duplicate data** (no YAML + DB to keep in sync)
- **FK expansion automatic** (via Drizzle relations)
- **Relational integrity** enforced at database level

## Production Deployment

**What gets deployed:**
- Static HTML/CSS/JS (from `docs/.vitepress/dist/`)
- No database, no server runtime

**What does NOT get deployed:**
- SQLite database (build-time only)
- Data loader code (build-time only)
- CLI (development only)

**Hosting options:**
- Netlify, Vercel, GitHub Pages, Cloudflare Pages
- Any static hosting (no server required)
- Database queries happen ONLY at build time

## Current Data

- **82+ content items** with FK relationships
- **52 tags**, 16 organizations, 8 technologies, 18 standards
- **26 targets**, 7 categories, 4 teams, 7 tools, 5 capabilities

All data managed via CLI and version-controlled in git.
