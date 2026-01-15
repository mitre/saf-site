# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Restoration (Start Here After Compact/New Session)

This project uses **beads** for task tracking and context preservation. After a `/compact` or starting a new session:

```bash
# 1. Load architecture overview (READ FIRST)
bd show saf-site-vitepress-ga0

# 2. Load database workflow reference
bd show saf-site-vitepress-35u

# 3. Check for session recovery card
bd list --status=open | grep -i recovery

# 4. See available work
bd ready
```

**Key Cards (Hub & Spoke Pattern):**
- **HUB:** `saf-site-vitepress-ga0` - Architecture overview, tech stack, key directories
- **SPOKE:** `saf-site-vitepress-35u` - Database & Pocketbase workflow details

**Related Documentation:**
- [README.md](README.md) - Setup, commands, workflows
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow, PR process
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed technical architecture
- [AGENT.md](AGENT.md) - AI agent-specific guidance

## Project Overview

MITRE SAF documentation site built with VitePress. Static site with content managed in Pocketbase, queried at build time.

**Tech Stack:**
- VitePress 1.6.4 (static site generator)
- Vue 3.5 with Composition API
- Reka UI 2.7.0 (headless components)
- Pocketbase 0.23 (content database)
- Vitest 4 (testing)
- pnpm 10.x (package manager)
- TypeScript

## Quick Reference

```bash
# Setup (first-time or after git pull)
pnpm setup

# Development
cd .pocketbase && ./pocketbase serve  # Terminal 1
pnpm dev                               # Terminal 2

# After editing in Pocketbase
pnpm db:export                         # Export to git
pnpm reload-data                       # Refresh dev server

# Testing
pnpm test:run
```

**URLs:**
- Dev site: http://localhost:5173
- Pocketbase Admin: http://localhost:8090/_/
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
│   ├── loaders/
│   │   └── profiles.data.ts      # Build-time Pocketbase queries
│   └── theme/
│       ├── index.ts              # Theme setup, component registration
│       ├── custom.css            # MITRE branding
│       ├── components/           # Vue components
│       │   ├── ProfileCard.vue
│       │   ├── ProfileFilters.vue
│       │   ├── ContentDetail.vue
│       │   └── *.spec.ts         # Component tests
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
4. **Others restore:** `pnpm setup` (restores from diffable/)

### Current Collections (v1 - Active)

| Collection | Records | Purpose |
|------------|---------|---------|
| profiles | 78 | Validation profiles (InSpec) |
| hardening_profiles | 5 | Hardening guides (Ansible/Chef) |
| organizations | 16 | MITRE, CIS, DISA, etc. |
| standards | 18 | STIG, CIS Benchmark, etc. |
| technologies | 8 | RHEL, Ubuntu, Windows, etc. |
| teams | 4 | SAF, Heimdall, etc. |
| tags | 52 | Categorization tags |
| tools | 7 | SAF CLI, Heimdall, etc. |
| capabilities | 5 | validate, harden, visualize, etc. |

### Pocketbase API Patterns

```typescript
// Query with FK expansion
const profiles = await pb.collection('profiles').getFullList({
  expand: 'organization,team,technology,standard',
  sort: '-created'
})

// Access expanded relations
profile.expand?.organization?.name  // "MITRE"
profile.expand?.standard?.name      // "DISA STIG"
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
    const profiles = await pb.collection('profiles').getFullList({
      expand: 'organization,team,technology,standard'
    })
    return { profiles }
  }
})
```

### Dynamic Routes

```typescript
// docs/validate/[slug].paths.ts
export default {
  async paths() {
    const pb = new PocketBase('http://localhost:8090')
    const profiles = await pb.collection('profiles').getFullList()
    return profiles.map(p => ({ params: { slug: p.slug, ...p } }))
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

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `pnpm setup` | Idempotent setup (deps, database, migrations) |
| `pnpm setup:check` | Validate setup without changes |
| `pnpm setup:force` | Force fresh database restore |
| `pnpm db:export` | Export Pocketbase to diffable/ |
| `pnpm reload-data` | Trigger data loader refresh |

## Beads Task Tracking

```bash
bd ready                    # See available work
bd list --status=open       # All open tasks
bd show <id>                # Task details
```

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
pnpm setup  # Restores from diffable/
```

### Wrong platform binary
Download correct binary from https://pocketbase.io/docs/

## Conventions

- Vue 3 Composition API with `<script setup lang="ts">`
- Reka UI for headless components (styled with VitePress CSS vars)
- Logic in composables, presentation in components
- Tests colocated with source files
- No Tailwind - use VitePress CSS custom properties
