# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note:** This project's CLAUDE.md is version-controlled and should be committed with changes. Update it as architectural decisions are made.

## Project Overview

MITRE SAF documentation site built with VitePress. Static site with content managed in Pocketbase, queried at build time.

**Tech Stack:** VitePress 2.0.0-alpha.15, Vue 3.5 (Composition API), Tailwind CSS 4, shadcn-vue + Reka UI, Pocketbase (content database), Vitest 4, pnpm 10.x, TypeScript.

## Quick Reference

```bash
# Setup (first-time or after git pull)
pnpm dev:setup

# Development (requires two terminals)
cd .pocketbase && ./pocketbase serve  # Terminal 1
pnpm dev                               # Terminal 2

# After editing in Pocketbase
pnpm db:export                         # Export to git
pnpm reload-data                       # Refresh dev server

# Testing & Linting
pnpm test:run                          # Run all tests once
pnpm vitest run path/to/file.spec.ts   # Run single test file
pnpm test                              # Watch mode
pnpm test:coverage                     # With coverage
pnpm lint:fix                          # Auto-fix code style
pnpm typecheck                         # TypeScript checking (vue-tsc)
pnpm ci:check                          # Full CI: typecheck + lint + test + docs check

# Component development (Histoire)
pnpm story:dev                         # Start Histoire on :6006
pnpm story:docs                        # Generate docs from component JSDoc
```

**URLs:**
- Dev site: http://localhost:5173
- Pocketbase Admin: http://localhost:8090/_/ (login: `admin@localhost.com` / `testpassword123`)
- Histoire: http://localhost:6006/

## Architecture

```
BUILD TIME:   Pocketbase API  ->  Data Loaders (*.data.ts)  ->  VitePress  ->  Static HTML
RUNTIME:      Static Data (embedded)  ->  Vue Components  ->  Client-side filtering/UI
VERSION CTRL: Pocketbase UI  ->  data.db  ->  db-diffable (export)  ->  diffable/ (git tracked)
```

Pocketbase must be running during `pnpm dev` and `pnpm build`. The deployed site is fully static -- no database at runtime.

## Directory Structure

```
docs/
  .vitepress/
    config.ts                    # VitePress config, nav, sidebar
    lib/loader-utils.ts          # Shared PB init + FK extraction helpers
    loaders/
      content.data.ts            # Main content loader (validation + hardening)
      tools.data.ts              # SAF tools
      training.data.ts           # Training courses
      organizations.data.ts      # Partner organizations
    database/schema.ts           # Drizzle schema (source of truth for DB structure)
    theme/
      index.ts                   # Theme setup, global component registration
      Layout.vue                 # Custom layout wrapper
      custom.css                 # MITRE branding, VitePress->Tailwind color bridge
      components/                # Vue components (+ colocated .spec.ts and .story.vue)
        ui/                      # shadcn-vue primitives (badge/, button/, card/, input/, select/)
        icons/                   # Custom SVG icons (pillars/, tools/, BrandIcon.vue)
      composables/               # Logic extraction (useContentDetail, useFuzzySearch, useFilterOptions)
      lib/utils.ts               # cn() utility for class merging
  content/                       # Content library (unified validation + hardening)
    index.md                     # Browse page
    [slug].md                    # Detail page template
    [slug].paths.ts              # Dynamic route generator
  apps/                          # SAF tools/applications
    index.md                     # Browse page
    [slug].md + [slug].paths.ts  # Dynamic app detail pages
  framework/                     # SAF framework pillar pages (static)
    index.md, validate.md, harden.md, plan.md, normalize.md, visualize.md
  training/index.md              # Training courses
  resources/                     # Resources, media, schema viewer
  index.md                       # Home page

.pocketbase/
  pocketbase                     # Binary (platform-specific, not in git)
  pb_data/
    data.db                      # SQLite database (gitignored)
    diffable/                    # Git-tracked NDJSON export

scripts/
  setup.sh                       # Idempotent setup script
  export-db.sh                   # Export database to diffable/
  inject-story-docs.ts           # Generate component docs for Histoire
  fetch-readmes.ts               # Populate content from GitHub READMEs
  db-diffable.ts                 # Database dump/load tool

cli/                             # Separate pnpm workspace: SAF Site CLI tool
```

## Critical Development Principles

**NEVER USE HACKS. ALWAYS FIX ROOT CAUSE.**

- Do not use `!important` hacks, inline style overrides, or workarounds that mask problems
- If a fix requires `!important`, it belongs in the component definition with a comment explaining WHY (e.g., framework conflict), not in a separate CSS file
- Understand the cascade, specificity, and architecture before proposing solutions

**Example - VitePress + shadcn-vue conflict:**
- BAD: Add `!important` overrides in custom.css
- GOOD: Add Tailwind's `!` modifier in `button/index.ts` with comment explaining VitePress `.vp-doc a` conflict

**MOBILE-FIRST RESPONSIVE DESIGN**

- Write mobile styles first, add desktop enhancements with breakpoint prefixes
- Grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (stack on mobile)
- Flex: `flex-col` on mobile, `md:flex-row` on desktop
- Breakpoints: Mobile `< 640px`, Tablet `md:` (640-1023px), Desktop `lg:` (1024px+)
- Test at 320px, 375px, 768px, 1024px+ viewports

## Vue in Markdown Best Practices

**CRITICAL:** VitePress processes markdown through markdown-it BEFORE Vue compilation. When you wrap Vue components in HTML tags (`<div>`, `<section>`, etc.), markdown-it treats everything inside as raw HTML, not Vue.

```vue
<!-- BAD: Components inside HTML tags render as raw text -->
<div class="wrapper">
  <VueComponent :prop="data" />
</div>

<!-- GOOD: Use components directly, pass layout via props -->
<VueComponent :prop="data" title="Section Title" />

<!-- GOOD: For complex layouts, create a wrapper component -->
<WrapperComponent :data1="data1" :data2="data2" />
```

Rules: Never wrap Vue components in HTML tags. Use PascalCase or hyphen-case for component names. Use `<script setup>` directly in markdown after frontmatter. Import locally for one-off use; register globally in `theme/index.ts` for frequent use.

## Key Patterns

### Data Loaders (Build-Time)

All loaders use shared utilities from `docs/.vitepress/lib/loader-utils.ts`:

```typescript
import { initPocketBase, extractFK, extractStandardFK } from '../lib/loader-utils'

export default defineLoader({
  async load() {
    const pb = await initPocketBase()
    const records = await pb.collection('content').getFullList({
      expand: 'target,standard,technology,vendor,maintainer',
      sort: 'name',
    })
    // Transform PB records to flattened format for VitePress
    return { items: records.map(r => ({ ... })) }
  },
})
```

`initPocketBase()` handles auth using env vars (`POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`) with localhost defaults.

### Dynamic Routes

```typescript
// docs/content/[slug].paths.ts
export default {
  async paths() {
    const pb = await initPocketBase()
    const records = await pb.collection('content').getFullList({ expand: '...' })
    return records.map(r => ({ params: { slug: r.slug, content: transformedRecord } }))
  }
}
```

### Composables

- `useContentDetail(content)` - Format versions, build action URLs, compute metadata for detail pages
- `useFuzzySearch(items, keys)` - Fuse.js-powered fuzzy text search
- `useFilterOptions(items)` - Extract unique filter values from content items

### Global Components

These are registered globally in `theme/index.ts` and available in any markdown page without imports:
`ContentCard`, `ContentFilters`, `ContentDetail`, `PillarBadge`, `LogoGrid`, `LogoMarquee`, `CardGrid`, `MediaCard`, `PageSection`, `FeatureItem`, `FeatureList`, `Skeleton`, `Placeholder`, `SchemaViewer`

### Browse Page Layout

```yaml
---
layout: doc
aside: false
---
```

## Content Management

### Database Workflow

1. **Edit content:** Pocketbase Admin UI (http://localhost:8090/_/)
2. **Refresh dev:** `pnpm reload-data`
3. **Export to git:** `pnpm db:export`
4. **Commit:** `git add .pocketbase/pb_data/diffable/ && git commit`
5. **Others restore:** `pnpm dev:setup` (restores from diffable/)

### Key Collections

| Collection | Purpose |
|------------|---------|
| `content` | Unified profiles (validation + hardening) |
| `content_tags` | Content-tag junction table |
| `content_relationships` | Links between content items |
| `organizations` | MITRE, CIS, DISA, AWS, etc. |
| `standards` | STIG, CIS Benchmark, etc. |
| `technologies` | InSpec, Ansible, Chef, etc. |
| `targets` | What gets secured (RHEL 8, MySQL, etc.) |
| `categories` | Target groupings (OS, Database, etc.) |
| `teams` | Maintainer groups |
| `tags` | Categorization tags |
| `tools` | SAF CLI, Heimdall, etc. |
| `capabilities` | SAF pillars (validate, harden, etc.) |

**Schema source of truth:** `docs/.vitepress/database/schema.ts` (Drizzle)

### Pocketbase API Patterns

```typescript
// Query content with FK expansion
const records = await pb.collection('content').getFullList({
  filter: 'content_type = "validation"',
  expand: 'target,standard,technology,vendor,maintainer',
  sort: 'name'
})

// Access expanded relations
record.expand?.vendor?.name       // "MITRE"
record.expand?.standard?.name     // "DISA STIG"
```

## shadcn-vue + VitePress Theme Integration

VitePress is the single source of truth for colors. The `@theme` directive in `custom.css` bridges VitePress CSS variables to Tailwind utilities, which shadcn components use. Light/dark mode works automatically.

```
VitePress CSS Variables     Tailwind @theme          Utility Classes
--vp-c-bg            ->    --color-card        ->    bg-card
--vp-c-text-1        ->    --color-foreground  ->    text-foreground
--vp-c-divider       ->    --color-border      ->    border-border
--vp-c-brand-1       ->    --color-primary     ->    bg-primary
```

| Tailwind Class | VitePress Variable | Use For |
|----------------|-------------------|---------|
| `bg-background` / `bg-card` | `--vp-c-bg` | Page/card backgrounds |
| `bg-muted` | `--vp-c-bg-soft` | Subtle backgrounds |
| `bg-primary` | `--vp-c-brand-1` | Primary actions (MITRE blue) |
| `text-foreground` | `--vp-c-text-1` | Primary text |
| `text-muted-foreground` | `--vp-c-text-2` | Secondary text |
| `border-border` | `--vp-c-divider` | Borders, dividers |

**Adding new shadcn components:** `pnpm dlx shadcn-vue@latest add <component-name>` (installs to `components/ui/`)

**Adding theme colors:** Map VitePress variables in `custom.css` `@theme` block. Never define separate HSL values.

**VitePress transition fix:** VitePress applies slow 0.5s transitions inside `.VPDoc`. This is overridden in `custom.css` to 0.1s for elements with Tailwind hover classes.

## Git Conventions

- **Do NOT add `Co-Authored-By` lines to commit messages.** This is a company policy.
- **Do NOT modify git config** (user.name, user.email, etc.)

## Conventions

- Vue 3 Composition API with `<script setup lang="ts">`
- Logic in composables, presentation in components
- Tests colocated with source: `Foo.vue` / `Foo.spec.ts` / `Foo.story.vue`
- Path aliases: `@/` -> `docs/.vitepress/theme/`, `@theme`, `@composables`, `@components`
- ESLint via `@antfu/eslint-config`: 2-space indent, single quotes, no semicolons, no Prettier
- CVA (class-variance-authority) for component variant styling
- Pre-commit hooks (husky + lint-staged): ESLint auto-fix, typecheck, story docs validation

### Icon Libraries

| Library | Purpose | Import |
|---------|---------|--------|
| `lucide-vue-next` | UI icons (actions, pillar badges) | `import { Shield } from 'lucide-vue-next'` |
| `vue3-simple-icons` | Brand logos (Ansible, AWS, etc.) | `import { AnsibleIcon } from 'vue3-simple-icons'` |
| Custom `icons/pillars/` | SAF pillar icons | `<PillarIcon pillar="validate" />` |
| `BrandIcon.vue` | Dynamic brand icon resolver | `<BrandIcon name="aws" :size="32" />` |

### SAF Pillars (Color-Coded)

| Pillar | Tailwind | Lucide Icon | Use Case |
|--------|----------|-------------|----------|
| Validate | `blue-500` | `Shield` | InSpec profiles |
| Harden | `green-500` | `Hammer` | Ansible, Chef, Terraform |
| Plan | `purple-500` | `ClipboardList` | Vulcan, guidance |
| Normalize | `orange-500` | `RefreshCw` | CLI converters |
| Visualize | `cyan-500` | `BarChart3` | Heimdall, reports |

## Component Documentation (DRY Pattern)

Documentation is auto-generated from JSDoc comments into Histoire story files:

1. Write `@component` and `@example` tags in component JSDoc
2. Create `ComponentName.story.vue` with variants
3. Run `pnpm story:docs` to inject `<docs>` block into story file
4. See `docs/.vitepress/theme/components/STYLE-GUIDE.md` for full conventions

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `pnpm dev:setup` | Idempotent setup (deps, database, migrations) |
| `pnpm dev:setup:force` | Force fresh database restore |
| `pnpm db:export` | Export Pocketbase to diffable/ |
| `pnpm db:populate` | Fetch README content from GitHub repos |
| `pnpm reload-data` | Trigger data loader refresh |
| `pnpm story:docs` | Generate component docs for Histoire |
| `pnpm cli --help` | SAF Site CLI (content management) |

## Task Tracking (Beads)

This project uses **beads** for task management. Tasks are stored in `.beads/` and sync with git.

```bash
bd ready                    # See available work
bd list --status=open       # All open tasks
bd show <id>                # Task details
bd sync                     # Sync with remote (commit ALL files first)
```

**Never run `bd sync` with uncommitted changes.** It does a `git pull` internally.

## Common Issues

| Problem | Fix |
|---------|-----|
| Pocketbase won't start (migration errors) | `rm -rf .pocketbase/pb_migrations/*` |
| Data changes not appearing | `pnpm reload-data` |
| Database out of sync after git pull | `pnpm dev:setup` |
| Wrong platform binary | Download from https://pocketbase.io/docs/ |

## Related Documentation

- [README.md](README.md) - Setup, commands, workflows
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow, PR process
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed technical architecture
- [Components CLAUDE.md](docs/.vitepress/theme/components/CLAUDE.md) - Component patterns, testing, Histoire stories
- [Components STYLE-GUIDE.md](docs/.vitepress/theme/components/STYLE-GUIDE.md) - Documentation conventions
