# SAF Site VitePress Architecture

## Core Principle

**Self-sufficient content management:** VitePress site manages its own content using Drizzle Studio + PGlite for editing, with YAML files as source of truth for production builds.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT EDITING LAYER                    │
│                                                             │
│  Drizzle Studio (localhost:4983)                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Visual Table Editor                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  Profiles   │  │  Standards  │  │   Teams     │   │ │
│  │  │  (FK pickers)│  │  (Edit rows)│  │  (Forms)   │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  PGlite + Drizzle ORM                                 │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  IndexedDB (persistent in browser)              │ │ │
│  │  │  - Drizzle schema (relationships)               │ │ │
│  │  │  - Referential integrity                        │ │ │
│  │  │  - Survives browser refresh                     │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Export Script → PGlite → YAML → content/data/       │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    VITEPRESS BUILD LAYER                    │
│                                                             │
│  content/data/*.yml (source of truth)                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  profiles/stig.yml, cis.yml, pci-dss.yml             │ │
│  │  hardening/ansible.yml, chef.yml, terraform.yml      │ │
│  │  standards/, organizations/, teams/, tools/          │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  VitePress Data Loaders (build time)                 │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  profiles.data.ts                               │ │ │
│  │  │    - Load YAML files                            │ │ │
│  │  │    - Validate with Zod schemas                  │ │ │
│  │  │    - Return typed JSON                          │ │ │
│  │  │                                                  │ │ │
│  │  │  hardening.data.ts, standards.data.ts, etc.    │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Composables (filters, search, counts)               │ │
│  │  - useProfiles, useHardeningProfiles, useStandards  │ │
│  │  - Ported from saf-site-v4                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Vue 3 Components                                     │ │
│  │  - ProfileCard, ProfileFilters                       │ │
│  │  - Browse pages, detail pages                        │ │
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
| Content Editing | Drizzle Studio (visual table editor) |
| Database (dev) | PGlite (Postgres in WASM, IndexedDB) |
| ORM | Drizzle ORM |
| Validation | Zod (via drizzle-zod) |
| Static Site | VitePress 1.6.4 |
| UI Framework | Vue 3 |
| Components | Reka UI 2.7.0 |
| Data Loading | VitePress Data Loaders |
| Source of Truth | YAML files |

## Data Flow

### Content Editing (Development)
```
Drizzle Studio → PGlite (IndexedDB) → Export Script → YAML files
```

### Production Build (Static Site)
```
YAML files → Data Loaders (Zod validation) → Typed JSON → Vue Components → Static HTML
```

## Key Differences from saf-site-v4

### What We Kept
- ✅ Drizzle + Zod schema (exact same schema.ts)
- ✅ PGlite for local editing
- ✅ YAML as source of truth
- ✅ Composables for filters/search/counts
- ✅ TypeScript types from schema

### What We Changed
- ❌ No Nuxt (replaced with VitePress)
- ❌ No Nuxt Content (replaced with VitePress data loaders)
- ❌ No custom admin UI (using Drizzle Studio instead)
- ❌ No Nuxt UI v4 (using Reka UI instead)

### What We Gained
- ✅ Simpler stack (VitePress vs Nuxt)
- ✅ Better docs site features (built-in search, sidebar, nav)
- ✅ No custom admin code to maintain (Drizzle Studio handles it)
- ✅ Same data management power as v4

## Directory Structure

```
saf-site-vitepress/
├── content/
│   └── data/               # YAML source of truth
│       ├── profiles/
│       ├── hardening/
│       ├── standards/
│       ├── organizations/
│       ├── teams/
│       └── tools/
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts       # VitePress config
│   │   ├── database/
│   │   │   └── schema.ts   # Drizzle + Zod schema (from v4)
│   │   ├── loaders/
│   │   │   ├── profiles.data.ts
│   │   │   ├── hardening.data.ts
│   │   │   └── standards.data.ts
│   │   ├── composables/
│   │   │   ├── useProfiles.ts
│   │   │   ├── useHardeningProfiles.ts
│   │   │   └── useStandards.ts
│   │   ├── theme/
│   │   │   ├── index.ts
│   │   │   ├── custom.css
│   │   │   └── components/
│   │   └── utils/
│   │       └── yaml.ts     # YAML import/export
│   ├── public/
│   │   └── img/            # Logos, icons, badges
│   ├── index.md            # Home page
│   ├── validate/
│   │   ├── index.md        # Browse validation profiles
│   │   └── profiles/
│   │       └── [slug].md   # Dynamic profile pages
│   └── harden/
│       ├── index.md        # Browse hardening guides
│       └── guides/
│           └── [slug].md   # Dynamic guide pages
└── scripts/
    ├── import-yaml.ts      # Import YAML → PGlite
    └── export-yaml.ts      # Export PGlite → YAML
```

## Content Editing Workflow

### 1. Initial Setup (First Time)
```bash
# Port schema from saf-site-v4
cp ../saf-site-v4/app/database/schema.ts docs/.vitepress/database/

# Import existing YAML data
pnpm run import-yaml

# Start Drizzle Studio
npx drizzle-kit studio
# Opens http://localhost:4983
```

### 2. Edit Content
- Open Drizzle Studio (localhost:4983)
- Click "profiles" table → See all profiles as rows
- Click row → Edit form appears
- Foreign keys show as dropdowns (organizations, teams, standards)
- Save → Updates PGlite (persists in IndexedDB)

### 3. Export Changes
```bash
# Export PGlite → YAML
pnpm run export-yaml

# Commit YAML files
git add content/data/
git commit -m "feat: add new profiles"
```

### 4. Build & Deploy
```bash
# VitePress reads YAML → static site
pnpm build

# Deploy dist/ to hosting
```

## Why This Architecture?

### Content Management
- **Drizzle Studio** handles complex editing (FK relationships, validation)
- **YAML files** remain simple, git-friendly, contributor-accessible
- **PGlite** provides full Postgres features for dev (relationships, integrity)

### Static Site Generation
- **VitePress** excels at documentation sites (search, nav, sidebar)
- **Data loaders** transform YAML at build time (no runtime overhead)
- **Vue 3** provides reactive filtering/search on loaded data

### Type Safety
- **Drizzle schema** defines structure once
- **Zod schemas** validate YAML on import/build
- **TypeScript types** auto-generated from schema
- **Same types** everywhere (editing → build → components)

## Migration from saf-site-v4

### What to Copy
1. ✅ `app/database/schema.ts` → `docs/.vitepress/database/schema.ts`
2. ✅ `content/data/**/*.yml` → `content/data/**/*.yml`
3. ✅ `app/composables/*.ts` → `docs/.vitepress/composables/*.ts` (adapt)

### What NOT to Copy
- ❌ Nuxt-specific code (pages, server, api)
- ❌ Nuxt Content queries
- ❌ Custom admin UI
- ❌ Repository pattern

### Adaptation Required
- Composables: Replace `queryCollection()` with data loader imports
- Remove loading states (data available at build time)
- Update imports to VitePress paths

## Production Deployment

**What gets deployed:**
- Static HTML/CSS/JS (from `docs/.vitepress/dist/`)
- YAML files are NOT deployed (converted to JSON at build)

**What does NOT get deployed:**
- PGlite database (dev-only)
- Drizzle Studio (dev-only)
- schema.ts (used at build time only)

**Hosting options:**
- Netlify, Vercel, GitHub Pages, Cloudflare Pages
- Any static hosting (no server required)

## Important Limitation: Drizzle Studio + PGlite

**Update (January 2026):** Drizzle Studio does not currently support PGlite ([Issue #2823](https://github.com/drizzle-team/drizzle-orm/issues/2823)).

**Current workarounds:**
1. **Direct YAML editing** - Edit YAML files manually, Zod validates on build
2. **Local PostgreSQL** - Use real Postgres for Drizzle Studio demo, export to YAML
3. **Custom admin UI** - Build Option A (integrated admin) sooner

For POC, **direct YAML editing** is recommended until PGlite support is added.

## Future: Integrated Admin (Option A)

When Drizzle Studio adds PGlite support, OR if we build a custom admin UI:

```
VitePress Site
├── /                    # Public documentation
├── /validate            # Browse profiles
└── /admin               # PGlite admin UI (auth required)
    ├── /profiles        # CRUD UI
    ├── /standards       # CRUD UI
    └── /export          # Export YAML
```

This would follow saf-site-v4's architecture but embedded in VitePress.

**For now:** Drizzle Studio is sufficient (Option B approach).
