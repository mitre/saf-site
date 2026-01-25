# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note:** This project's CLAUDE.md is version-controlled and should be committed with changes. Update it as architectural decisions are made.

## Context Restoration (Start Here After Compact/New Session)

This project uses **beads** for task tracking and context preservation. After a `/compact` or starting a new session:

```bash
# 1. Load architecture overview (READ FIRST)
bd show saf-site-ga0

# 2. Load database workflow reference
bd show saf-site-35u

# 3. Check for session recovery card
bd list --status=open | grep -i recovery

# 4. See available work
bd ready
```

**Key Cards (Hub & Spoke Pattern):**
- **HUB:** `saf-site-ga0` - Architecture overview, tech stack, key directories
- **SPOKE:** `saf-site-35u` - Database & Pocketbase workflow details

**Related Documentation:**
- [README.md](README.md) - Setup, commands, workflows
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow, PR process
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed technical architecture
- [AGENT.md](AGENT.md) - AI agent-specific guidance
- [Components CLAUDE.md](docs/.vitepress/theme/components/CLAUDE.md) - Component patterns, testing, Histoire stories
- [Components STYLE-GUIDE.md](docs/.vitepress/theme/components/STYLE-GUIDE.md) - Documentation conventions

## Critical Development Principles

**NEVER USE HACKS. ALWAYS FIX ROOT CAUSE.**

- When encountering bugs, CSS conflicts, or unexpected behavior: investigate and fix the actual cause
- Do not use `!important` hacks, inline style overrides, or workarounds that mask problems
- If a fix requires `!important`, it belongs in the component definition with a comment explaining WHY (e.g., framework conflict), not in a separate CSS file
- Understand the cascade, specificity, and architecture before proposing solutions
- Quick fixes create technical debt - take the time to understand and fix properly
- Document architectural decisions so future sessions understand the reasoning

**Example - VitePress + shadcn-vue conflict:**
- BAD: Add `!important` overrides in custom.css
- GOOD: Add Tailwind's `!` modifier in button/index.ts with comment explaining VitePress `.vp-doc a` conflict

## Project Overview

MITRE SAF documentation site built with VitePress. Static site with content managed in Pocketbase, queried at build time.

**Tech Stack:**
- VitePress 2.0.0-alpha.15 (static site generator)
- Vue 3.5 with Composition API
- Tailwind CSS 4 (utility-first styling)
- shadcn-vue (component library)
- Reka UI (headless primitives, via shadcn-vue)
- Pocketbase 0.36 (content database)
- Vitest 4 (testing)
- pnpm 10.x (package manager)
- TypeScript

## Quick Reference

```bash
# Setup (first-time or after git pull)
pnpm dev:setup

# Development
cd .pocketbase && ./pocketbase serve  # Terminal 1
pnpm dev                               # Terminal 2

# After editing in Pocketbase
pnpm db:export                         # Export to git
pnpm reload-data                       # Refresh dev server

# Testing & Linting
pnpm test:run                          # Run tests
pnpm lint:fix                          # Auto-fix code style (ESLint)
pnpm ci:check                          # Full CI check (typecheck + lint + test + docs)

# Component development (Histoire)
pnpm story:dev     # Start Histoire on :6006
pnpm story:docs    # Generate docs from component JSDoc
```

**URLs:**
- Dev site: http://localhost:5173
- Pocketbase Admin: http://localhost:8090/_/
- Histoire: http://localhost:6006/
- Login: `admin@localhost.com` / `testpassword123`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                │
├─────────────────────────────────────────────────────────────────┤
│  Pocketbase API  →  Data Loaders  →  VitePress  →  Static HTML  │
│  (localhost:8090)   (*.data.ts)      (build)       (dist/)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        RUNTIME (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  Static Data  →  Vue Components  →  Client-side filtering/UI    │
│  (embedded)      (*.vue)            (reactive, no server)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        VERSION CONTROL                           │
├─────────────────────────────────────────────────────────────────┤
│  Pocketbase UI  →  data.db  →  sqlite-diffable  →  diffable/   │
│  (edit here)       (local)     (export)            (git tracked)│
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
docs/
├── .vitepress/
│   ├── config.ts                 # VitePress config, nav, sidebar
│   ├── database/
│   │   ├── schema.ts             # Drizzle schema (source of truth)
│   │   ├── schema.zod.ts         # drizzle-zod generated validation
│   │   ├── validation.ts         # Convention-aware validators
│   │   └── schemas.ts            # Pocketbase API response schemas
│   ├── loaders/
│   │   └── profiles.data.ts      # Build-time Pocketbase queries
│   └── theme/
│       ├── index.ts              # Theme setup, component registration
│       ├── custom.css            # MITRE branding
│       ├── components/           # Vue components
│       │   ├── ui/               # shadcn-vue components
│       │   │   ├── badge/
│       │   │   ├── button/
│       │   │   ├── card/
│       │   │   └── input/
│       │   ├── ProfileCard.vue
│       │   ├── ProfileFilters.vue
│       │   ├── ContentDetail.vue
│       │   └── *.spec.ts         # Component tests
│       ├── lib/utils.ts          # cn() utility for class merging
│       └── composables/          # Logic extraction
│           ├── useContentDetail.ts
│           └── *.spec.ts         # Unit tests
├── index.md                      # Home page
└── validate/
    ├── index.md                  # Browse page
    ├── [slug].md                 # Detail page template
    └── [slug].paths.ts           # Dynamic route generator

.pocketbase/
├── pocketbase                    # Binary (macOS ARM64)
├── pb_data/
│   ├── data.db                   # SQLite database (gitignored)
│   └── diffable/                 # Git-tracked NDJSON export
└── pb_migrations/                # Auto-generated (clear for fresh setup)

scripts/
├── setup.sh                      # Idempotent setup script
├── export-db.sh                  # Export database to diffable/
└── *.ts                          # Various migration/import scripts
```

## Content Management

### Database Workflow

1. **Edit content:** Pocketbase Admin UI (http://localhost:8090/_/)
2. **Export to git:** `pnpm db:export`
3. **Commit:** `git add .pocketbase/pb_data/diffable/ && git commit`
4. **Others restore:** `pnpm dev:setup` (restores from diffable/)

### Current Collections

**Core Content:**
| Collection | Records | Purpose |
|------------|---------|---------|
| content | 82 | Unified profiles (validation + hardening) |
| content_tags | 117 | Content-tag junction |
| content_relationships | 4 | Links between content items |

**Reference Data:**
| Collection | Records | Purpose |
|------------|---------|---------|
| organizations | 16 | MITRE, CIS, DISA, AWS, etc. |
| standards | 18 | STIG, CIS Benchmark, etc. |
| technologies | 8 | InSpec, Ansible, Chef, etc. |
| targets | 26 | What gets secured (RHEL 8, MySQL, etc.) |
| categories | 7 | Target groupings (OS, Database, etc.) |
| teams | 4 | Maintainer groups |
| tags | 52 | Categorization tags |
| tools | 7 | SAF CLI, Heimdall, etc. |
| capabilities | 5 | SAF pillars (validate, harden, etc.) |

**Schema source of truth:** `docs/.vitepress/database/schema.ts` (Drizzle) → `schema.zod.ts` (drizzle-zod validation)

### Schema Architecture (Single Source of Truth)

```
schema.ts (Drizzle)     →  schema.zod.ts (drizzle-zod)  →  CLI + VitePress
(table definitions)        (Zod validation schemas)        (shared imports)
```

**Key files:**
- `schema.ts` - Drizzle table definitions (edit this to change schema)
- `schema.zod.ts` - Generated Zod schemas with custom refinements
- `validation.ts` - Convention-aware validation (imports from schema.zod.ts)
- `schemas.ts` - Pocketbase API response schemas (separate concern)

**CLI imports:** `@schema/schema.zod.js` (path alias in tsconfig)

### Pocketbase API Patterns

```typescript
// Query content with FK expansion
const profiles = await pb.collection('content').getFullList({
  filter: 'content_type = "validation"',
  expand: 'target,standard,technology,vendor,maintainer',
  sort: 'name'
})

// Access expanded relations
profile.expand?.vendor?.name       // "MITRE"
profile.expand?.standard?.name     // "DISA STIG"
profile.expand?.target?.name       // "Red Hat Enterprise Linux 8"
```

## Key Patterns

### Data Loaders (Build-Time)

```typescript
// docs/.vitepress/loaders/profiles.data.ts
import { defineLoader } from 'vitepress'
import PocketBase from 'pocketbase'

export default defineLoader({
  async load() {
    const pb = new PocketBase('http://localhost:8090')
    await pb.collection('_superusers').authWithPassword(email, password)
    const records = await pb.collection('content').getFullList({
      filter: 'content_type = "validation"',
      expand: 'target,standard,technology,vendor,maintainer'
    })
    return { profiles: records }
  }
})
```

### Dynamic Routes

```typescript
// docs/validate/[slug].paths.ts
export default {
  async paths() {
    const pb = new PocketBase('http://localhost:8090')
    await pb.collection('_superusers').authWithPassword(email, password)
    const records = await pb.collection('content').getFullList({
      filter: 'content_type = "validation"'
    })
    return records.map(r => ({ params: { slug: r.slug, content: r } }))
  }
}
```

### Composables Pattern

```typescript
// Logic in composable
export function useContentDetail(content: ContentItem) {
  const formattedVersion = computed(() => formatVersion(content.version))
  const actionUrls = computed(() => buildUrls(content))
  return { formattedVersion, actionUrls }
}

// Component uses composable
const { formattedVersion, actionUrls } = useContentDetail(props.content)
```

### Browse Page Layout

```yaml
---
layout: doc
aside: false
---
```

CSS override for full-width:
```css
.VPDoc .container { max-width: 1400px !important; }
.VPDoc .content { max-width: none !important; }
```

## Testing

Colocated test files with source:
- `composables/useContentDetail.ts` → `composables/useContentDetail.spec.ts`
- `components/ContentDetail.vue` → `components/ContentDetail.spec.ts`

```bash
pnpm test:run        # Run once
pnpm test:coverage   # With coverage
pnpm test            # Watch mode
```

## Component Documentation (DRY Pattern)

Component documentation is auto-generated from JSDoc comments to maintain a single source of truth:

1. **Write JSDoc in component:** Use `@component` tag with description and `@example` tags
2. **Create story file:** `ComponentName.story.vue` with variants
3. **Run doc generator:** `pnpm story:docs` injects `<docs>` block into story file
4. **View in Histoire:** Documentation appears in docs panel

**Example:**
```vue
<script setup lang="ts">
/**
 * @component LogoGrid - Display logos in responsive grid.
 *
 * @example Basic
 * <LogoGrid :items="partners" />
 */
export interface LogoGridProps {
  /** Array of logo items */
  items: LogoItem[]
}
</script>
```

This keeps component docs, props table, and examples in sync automatically. See `docs/.vitepress/theme/components/STYLE-GUIDE.md` for full conventions.

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `pnpm dev:setup` | Idempotent setup (deps, database, migrations) |
| `pnpm dev:setup:check` | Validate setup without changes |
| `pnpm dev:setup:force` | Force fresh database restore |
| `pnpm db:export` | Export Pocketbase to diffable/ |
| `pnpm reload-data` | Trigger data loader refresh |

## Task Tracking

This project uses **beads** for task management. Tasks are stored in `.beads/` and sync with git.

```bash
bd ready                    # See available work
bd list --status=open       # All open tasks
bd show <id>                # Task details
bd sync                     # Sync with remote (commit all changes first)
```

**Note:** `bd sync` performs a `git pull` internally, so commit all modified files before running it.

## Common Issues

### bd sync fails with "unstaged changes"
**IMPORTANT:** `bd sync` does a git pull internally. If ANY files are modified (not just .beads/), it will fail.

**Correct workflow:**
```bash
# 1. Commit ALL modified files first (including CLAUDE.md, any work in progress)
git add <files>
git commit -m "your message"

# 2. Push your changes
git push

# 3. NOW run bd sync (it can pull cleanly)
bd sync
```

**Never run `bd sync` with uncommitted changes.** Commit everything first.

### Pocketbase won't start (migration errors)
```bash
rm -rf .pocketbase/pb_migrations/*
```

### Data changes not appearing
```bash
pnpm reload-data
```

### Database out of sync after git pull
```bash
pnpm dev:setup  # Restores from diffable/
```

### Wrong platform binary
Download correct binary from https://pocketbase.io/docs/

## shadcn-vue + VitePress Theme Integration

The project uses [shadcn-vue](https://www.shadcn-vue.com/) for UI components, integrated with VitePress's theme system via Tailwind CSS 4.

### Architecture: VitePress → Tailwind 4 → shadcn-vue

```
VitePress CSS Variables     Tailwind @theme          Utility Classes
─────────────────────────────────────────────────────────────────────
--vp-c-bg            →    --color-card        →    bg-card
--vp-c-text-1        →    --color-foreground  →    text-foreground
--vp-c-divider       →    --color-border      →    border-border
--vp-c-brand-1       →    --color-primary     →    bg-primary
```

**Key insight**: VitePress is the single source of truth for colors. The `@theme` directive in `custom.css` bridges VitePress variables to Tailwind utilities, which shadcn components use.

**Benefits**:
- Light/dark mode works automatically (VitePress handles it)
- Consistent colors between VitePress chrome and custom components
- No duplicate color systems to maintain

### Theme Color Reference

| Tailwind Class | VitePress Variable | Use For |
|----------------|-------------------|---------|
| `bg-background` | `--vp-c-bg` | Page backgrounds |
| `bg-card` | `--vp-c-bg` | Card backgrounds |
| `bg-muted` | `--vp-c-bg-soft` | Subtle backgrounds |
| `bg-primary` | `--vp-c-brand-1` | Primary actions (MITRE blue) |
| `text-foreground` | `--vp-c-text-1` | Primary text |
| `text-muted-foreground` | `--vp-c-text-2` | Secondary text |
| `border-border` | `--vp-c-divider` | Borders, dividers |

See `custom.css` for the complete mapping table.

### Adding Components

```bash
pnpm dlx shadcn-vue@latest add <component-name>
# Examples: dialog, select, table, dropdown-menu
```

Components are installed to `docs/.vitepress/theme/components/ui/`.

### Using Components

```vue
<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
</script>

<template>
  <!-- Use Tailwind classes that map to VitePress colors -->
  <Card class="bg-card border-border">
    <CardHeader>
      <CardTitle class="text-foreground">Title</CardTitle>
      <Badge variant="default">Status</Badge>
    </CardHeader>
    <CardContent class="text-muted-foreground">
      Content here
    </CardContent>
  </Card>
</template>
```

### Available Components

| Component | Path | Usage |
|-----------|------|-------|
| Badge | `ui/badge` | Status indicators, tags |
| Button | `ui/button` | Actions, links |
| Card | `ui/card` | Content containers |
| Input | `ui/input` | Form text inputs |
| Select | `ui/select` | Dropdown selects (filters) |

### Adding New Theme Colors

1. Find the VitePress variable in `node_modules/vitepress/.../vars.css`
2. Add mapping in `custom.css` `@theme` block:
   ```css
   @theme {
     --color-my-color: var(--vp-c-some-var);
   }
   ```
3. Use the Tailwind class in components: `bg-my-color`, `text-my-color`

**Important**: Never define separate HSL values for shadcn. Always map to VitePress variables to maintain consistency.

### VitePress Transition Override

VitePress applies slow 0.5s transitions to elements inside `.VPDoc`. This makes hover states feel sluggish. We fix this globally in `custom.css`:

```css
/* Any element with Tailwind hover classes gets fast 0.1s transitions */
.VPDoc [class*="hover:border-"],
.VPDoc [class*="hover:shadow-"],
.VPDoc [class*="hover:bg-"] {
  transition: border-color 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease;
}
```

This means you can use Tailwind hover classes normally (`hover:border-primary`, `hover:shadow-md`) and they'll respond quickly.

## Conventions

- Vue 3 Composition API with `<script setup lang="ts">`
- shadcn-vue for pre-built components (Card, Badge, Button, etc.)
- Tailwind CSS 4 for utility styling
- Logic in composables, presentation in components
- Tests colocated with source files
- Path alias `@/` maps to `docs/.vitepress/theme/`
- ESLint auto-formatting with `@antfu/eslint-config` (opinionated style, run `pnpm lint:fix` before commits)

## Icon Libraries

Two icon libraries for different purposes:

| Library | Purpose | Import |
|---------|---------|--------|
| `lucide-vue-next` | UI icons (actions, pillar badges) | `import { Shield } from 'lucide-vue-next'` |
| `vue3-simple-icons` | Brand logos (Ansible, AWS, etc.) | `import { AnsibleIcon } from 'vue3-simple-icons'` |

```vue
<script setup>
import { Shield, Hammer } from 'lucide-vue-next'
import { AnsibleIcon, RedhatIcon } from 'vue3-simple-icons'
</script>
```

## Unified Content Library (Planned Feature)

**Goal:** Replace separate `/validate/` and `/harden/` pages with unified `/content/` browse.

**Design Decisions:**
- URL: `/content/`
- Default: Show all content
- Sort: By name
- Related content: Cross-link on detail pages

**SAF Pillars (Color-Coded Badges):**

| Pillar | Tailwind | Lucide Icon | Use Case |
|--------|----------|-------------|----------|
| Validate | `blue-500` | `Shield` | InSpec profiles |
| Harden | `green-500` | `Hammer` | Ansible, Chef, Terraform |
| Plan | `purple-500` | `ClipboardList` | Vulcan, guidance |
| Normalize | `orange-500` | `RefreshCw` | CLI converters |
| Visualize | `cyan-500` | `BarChart3` | Heimdall, reports |

**Implementation Tasks:**
1. Create PillarBadge component
2. Generalize ProfileCard → ContentCard
3. Generalize ProfileFilters → ContentFilters (add Pillar filter)
4. Create `/content/` route (replaces `/validate/`)
5. Update data loader to fetch all content types
6. Add related content section to detail pages
