# SAF Site VitePress Architecture

## Core Principle

**Single source of truth:** Pocketbase relational database manages all content with FK constraints, version-controlled via sqlite-diffable. VitePress queries Pocketbase API at build time for static site generation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT MANAGEMENT LAYER                 │
│                                                             │
│  Pocketbase Admin UI (localhost:8090/_/)                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Visual Table Editor with FK Relations               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  Profiles   │  │  Standards  │  │   Teams     │   │ │
│  │  │ (FK pickers)│  │ (Edit rows) │  │  (Forms)    │   │ │
│  │  │ Searchable  │  │ Validation  │  │  Inline     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Pocketbase (SQLite with REST API)                   │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  data.db (SQLite binary)                        │ │ │
│  │  │  - 12 collections (base + FKs + junctions)     │ │ │
│  │  │  - FK constraints enforced                      │ │ │
│  │  │  - Automatic FK expansion via API               │ │ │
│  │  │  - REST API on :8090/api/collections/...       │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  sqlite-diffable export (version control)            │ │
│  │  .pocketbase/pb_data/diffable/                       │ │
│  │    - *.metadata.json (table schemas)                 │ │
│  │    - *.ndjson (data, one record per line)           │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ (git commits)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    VITEPRESS BUILD LAYER                    │
│                                                             │
│  VitePress Data Loaders (build time)                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  profiles.data.ts                                     │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  Query Pocketbase REST API                      │ │ │
│  │  │  const pb = new PocketBase('http://localhost')  │ │ │
│  │  │  const profiles = await pb.collection('profiles')│ │ │
│  │  │    .getFullList({                               │ │ │
│  │  │      expand: 'org,team,tech,standard'          │ │ │
│  │  │    })                                           │ │ │
│  │  │  return { profiles }  // Fully typed data      │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                                                       │ │
│  │  hardening.data.ts, standards.data.ts, etc.         │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Vue 3 Components                                     │ │
│  │  - ProfileCard, ProfileFilters                       │ │
│  │  - Browse pages with client-side filtering          │ │
│  │  - Detail pages (dynamic routes)                     │ │
│  │  - Reka UI components                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│              Static Site (docs/.vitepress/dist/)           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Content Management | Pocketbase 0.23.9 (visual admin UI) |
| Database | SQLite (via Pocketbase) |
| API | Pocketbase REST API |
| Version Control | sqlite-diffable (NDJSON exports) |
| Static Site | VitePress 1.6.4 |
| UI Framework | Vue 3 |
| Components | Reka UI 2.7.0 |
| Data Loading | VitePress Data Loaders (query Pocketbase) |
| Source of Truth | Pocketbase database |

## Data Flow

### Content Editing (Development)
```
Pocketbase Admin UI → SQLite Database → sqlite-diffable export → Git commit → Push
```

### Production Build (CI/CD)
```
Git clone → sqlite-diffable restore → Start Pocketbase → VitePress queries API → Build static site → Deploy
```

### Local Development
```
Start Pocketbase → VitePress dev (queries Pocketbase) → Hot reload on data changes
```

## Collections (12 Total)

### Base Collections (No Foreign Keys)
- **tags** - Content tags (ansible, cloud, security, etc.)
- **organizations** - Organizations (MITRE, DISA, CIS, etc.)
- **technologies** - Technologies (InSpec, Ansible, Terraform, etc.)
- **standards** - Standards (STIG, CIS, NIST, PCI-DSS, etc.)
- **capabilities** - Capabilities (validate, harden, plan, etc.)

### Collections with Foreign Keys
- **teams** - Teams (FK: organization)
- **profiles** - Validation profiles (FKs: technology, organization, team, standard)
- **hardening_profiles** - Hardening profiles (FKs: technology, organization, team, standard)
- **tools** - Tools (FKs: technology, organization)

### Junction Tables (Many-to-Many)
- **profiles_tags** - Links profiles to tags
- **hardening_profiles_tags** - Links hardening profiles to tags
- **validation_to_hardening** - Links validation profiles to hardening profiles

## Key Differences from PGlite/Drizzle Architecture

### What Changed
- ❌ No PGlite (replaced with Pocketbase SQLite)
- ❌ No Drizzle Studio (replaced with Pocketbase admin UI)
- ❌ No YAML exports (database is source of truth)
- ❌ No Drizzle ORM (Pocketbase provides REST API)

### What We Gained
- ✅ Single source of truth (no YAML duplication)
- ✅ Automatic FK expansion via REST API (`?expand=org,team,tech`)
- ✅ Better content editing UX (searchable FK pickers, inline editing)
- ✅ Git-friendly version control (NDJSON format)
- ✅ Self-contained deployment (single Pocketbase binary)
- ✅ No intermediate export step (direct API queries)

### What We Kept
- ✅ SQLite backend (via Pocketbase)
- ✅ Relational data with FK constraints
- ✅ VitePress for static site generation
- ✅ Vue 3 components
- ✅ TypeScript throughout

## Directory Structure

```
saf-site-vitepress/
├── .pocketbase/
│   ├── pocketbase              # Single binary (not in git)
│   └── pb_data/
│       ├── data.db             # SQLite binary (not in git)
│       ├── data.db-wal         # Write-ahead log (not in git)
│       ├── data.db-shm         # Shared memory (not in git)
│       └── diffable/           # Git-tracked exports
│           ├── *.metadata.json # Table schemas
│           └── *.ndjson        # Table data
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts           # VitePress config
│   │   ├── loaders/
│   │   │   ├── profiles.data.ts      # Query Pocketbase API
│   │   │   ├── hardening.data.ts     # Query Pocketbase API
│   │   │   └── standards.data.ts     # Query Pocketbase API
│   │   ├── theme/
│   │   │   ├── index.ts
│   │   │   ├── custom.css
│   │   │   └── components/
│   │   │       ├── ProfileCard.vue
│   │   │       └── ProfileFilters.vue
│   │   └── database/
│   │       └── schema.ts       # Legacy Drizzle schema (reference only)
│   ├── public/
│   │   └── img/                # Logos, icons, badges
│   ├── index.md                # Home page
│   ├── validate/
│   │   ├── index.md            # Browse validation profiles
│   │   └── profiles/
│   │       └── [slug].md       # Dynamic profile pages
│   └── harden/
│       ├── index.md            # Browse hardening guides
│       └── guides/
│           └── [slug].md       # Dynamic guide pages
└── scripts/
    ├── create-all-collections.ts   # Create Pocketbase collections
    ├── import-yaml-data.ts         # One-time YAML → Pocketbase import
    ├── verify-collections.ts       # Validate collection structure
    └── verify-import.ts            # Validate imported data
```

## Content Editing Workflow

### 1. Initial Setup (First Time)
```bash
# Clone repository
git clone <repo>
cd saf-site-vitepress

# Restore database from git
cd .pocketbase/pb_data
sqlite-diffable load diffable/ data.db --all
cd ../..

# Start Pocketbase
cd .pocketbase && ./pocketbase serve
# Opens admin UI: http://localhost:8090/_/
```

### 2. Edit Content
- Open Pocketbase admin UI: http://localhost:8090/_/
- Login: admin@localhost.com / test1234567
- Click collection (e.g., "profiles")
- Click row to edit or "New record"
- Foreign keys show as searchable dropdowns with names (not IDs)
- Save → Updates database immediately

### 3. Export Changes
```bash
# Export database to git-friendly format
cd .pocketbase/pb_data
sqlite-diffable dump data.db diffable/ --all

# Commit changes
git add .pocketbase/pb_data/diffable/
git commit -m "content: update profiles"
git push
```

### 4. Build & Deploy
```bash
# VitePress queries Pocketbase API → builds static site
pnpm build

# Deploy dist/ to hosting
```

## VitePress Data Loader Pattern

**All data loaders query Pocketbase REST API at build time:**

```typescript
// docs/.vitepress/loaders/profiles.data.ts
import { defineLoader } from 'vitepress'
import PocketBase from 'pocketbase'

export interface ProfileData {
  profiles: Profile[]
}

export default defineLoader({
  async load(): Promise<ProfileData> {
    const pb = new PocketBase(
      process.env.POCKETBASE_URL || 'http://localhost:8090'
    )

    // Query with automatic FK expansion
    const profiles = await pb.collection('profiles').getFullList({
      expand: 'organization,team,technology,standard',
      sort: '-created',
      fields: '*,expand.organization.name,expand.team.name,expand.technology.name,expand.standard.name'
    })

    return { profiles }
  }
})
```

**Key features:**
- No `watch` pattern needed (for APIs, watch is only for local files)
- Automatic FK expansion via `expand` parameter
- Pocketbase must be running during build
- Returns fully typed data with expanded relations

## CI/CD Pipeline

**Build process requires Pocketbase running:**

```yaml
# Example GitHub Actions workflow
steps:
  - name: Checkout code
    uses: actions/checkout@v3

  - name: Restore Pocketbase database
    run: |
      cd .pocketbase/pb_data
      sqlite-diffable load diffable/ data.db --all

  - name: Start Pocketbase (background)
    run: |
      cd .pocketbase
      ./pocketbase serve &
      sleep 5  # Wait for startup

  - name: Install dependencies
    run: pnpm install

  - name: Build VitePress site
    run: pnpm build
    env:
      POCKETBASE_URL: http://localhost:8090

  - name: Stop Pocketbase
    run: pkill pocketbase

  - name: Deploy
    run: # ... deploy docs/.vitepress/dist/
```

## Why This Architecture?

### Content Management
- **Pocketbase** handles complex editing (FK relationships, validation, searchable pickers)
- **SQLite** provides full relational database features
- **REST API** exposes data for build-time queries
- **Admin UI** included (no custom code needed)

### Version Control
- **sqlite-diffable** converts binary DB to text-based NDJSON
- **One JSON record per line** (git-friendly, easy diffs)
- **Separate schema + data files** (.metadata.json + .ndjson)
- **No merge conflicts** (JSONL is line-based)

### Static Site Generation
- **VitePress** excels at documentation sites (search, nav, sidebar)
- **Data loaders** query Pocketbase API at build time
- **No runtime overhead** (all data pre-loaded at build)
- **Vue 3** provides reactive filtering/search on static data

### Single Source of Truth
- **Database is authoritative** (not YAML, not JSON exports)
- **No duplicate data** (no YAML + DB to keep in sync)
- **FK expansion automatic** (via API `?expand=` parameter)
- **Relational integrity** enforced at database level

## Production Deployment

**What gets deployed:**
- Static HTML/CSS/JS (from `docs/.vitepress/dist/`)
- No database, no Pocketbase runtime

**What does NOT get deployed:**
- Pocketbase binary (build-time only)
- SQLite database (build-time only)
- Data loader code (build-time only)

**Hosting options:**
- Netlify, Vercel, GitHub Pages, Cloudflare Pages
- Any static hosting (no server required)
- Database queries happen ONLY at build time

## Current Data (Session 015)

- **78 validation profiles** with FK relationships
- **5 hardening profiles**
- **52 tags**, 16 organizations, 8 technologies, 18 standards
- **4 teams**, 7 tools, 5 capabilities
- **92 profile-tag links**, 25 hardening-tag links, 4 validation-hardening links

All data imported from YAML files (one-time migration) and now managed in Pocketbase.
