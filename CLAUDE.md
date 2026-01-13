# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VitePress proof-of-concept for MITRE SAF documentation site. This evaluates VitePress as a replacement for Nuxt to create a distinct visual identity for the open source project (separate from commercial products).

**Tech Stack**:
- VitePress 1.6.4 with Vue 3
- @vue/theme 2.3.0 (official Vue.js documentation theme)
- Reka UI 2.7.0 (headless component library)
- pnpm 10.26.2 (package manager)
- TypeScript for config and data loaders

**Repository**: `/Users/alippold/github/mitre/saf-site-vitepress`

## Development Commands

```bash
# Install dependencies
pnpm install

# Start dev server (default: http://localhost:5173)
pnpm dev

# Build for production (outputs to docs/.vitepress/dist)
pnpm build

# Preview production build
pnpm preview
```

## Architecture

### Directory Structure

```
docs/
├── .vitepress/
│   ├── config.ts              # VitePress configuration, nav, sidebar
│   ├── loaders/
│   │   └── profiles.data.ts   # Build-time data loaders (YAML → TypeScript)
│   └── theme/
│       ├── index.ts           # Theme setup, global component registration
│       ├── custom.css         # MITRE branding + layout overrides
│       └── components/        # Global Vue 3 components
│           ├── ProfileCard.vue
│           └── ProfileFilters.vue
├── index.md                   # Home page
└── validate/
    └── index.md               # Browse page with filters
```

### Key Architectural Patterns

#### 1. VitePress Data Loaders (Build-Time Data)

VitePress data loaders run at build time to load YAML/JSON and make it available as static imports:

**Location**: `docs/.vitepress/loaders/*.data.ts`

```typescript
// profiles.data.ts
import { defineLoader } from 'vitepress'

export default defineLoader({
  watch: ['../../content/data/profiles/*.yml'],
  async load(): Promise<ProfileData> {
    // Read YAML files, process, return typed data
    return { profiles }
  }
})
```

**Usage in pages**:
```vue
<script setup>
import { data } from '../.vitepress/loaders/profiles.data'
const allProfiles = data.profiles  // Available at build time
</script>
```

**Key Points**:
- Data loaded once at build time (not runtime)
- Hot-reloads when watched files change
- Returns fully typed TypeScript objects
- Client-side Vue handles filtering/interactivity on this static data

#### 2. Browse Page Pattern (Full-Width Interactive Lists)

**Problem**: VitePress has two layouts:
- `layout: page` - Blank canvas with NO typography (h1/p unstyled)
- `layout: doc` - Proper typography but narrow (688px)

**Solution**: Use `layout: doc` + CSS overrides for full width

**Frontmatter**:
```yaml
---
title: Validation Profiles
layout: doc      # Gets proper typography
aside: false     # Disables TOC sidebar
---
```

**CSS Overrides** (in `docs/.vitepress/theme/custom.css`):
```css
/* Full-width doc layout for browse pages */
.VPDoc .container { max-width: 1400px !important; }
.VPDoc .content { max-width: none !important; }
.VPDoc .content-container { max-width: none !important; }
```

**Browse Page Structure**:
```vue
<script setup>
import { ref, computed } from 'vue'
import { data } from '../.vitepress/loaders/profiles.data'

// Client-side reactive filtering
const selectedCategory = ref('all')
const filteredProfiles = computed(() => {
  // Filter loaded data based on user input
})
</script>

<ProfileFilters @update:category="selectedCategory = $event" />
<ProfileCard v-for="profile in filteredProfiles" :key="profile.id" :profile="profile" />
```

**When to use**:
- Listing pages with filters (validation profiles, hardening guides, apps)
- Browse/catalog pages with search
- Full-width card grids

**Reference**: See beads card `saf-site-vitepress-npl` for full pattern details.

#### 3. Global Component Registration

Components registered in `docs/.vitepress/theme/index.ts` are available globally in all markdown files:

```typescript
import DefaultTheme from 'vitepress/theme'
import ProfileCard from './components/ProfileCard.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ProfileCard', ProfileCard)
  }
}
```

**Usage in markdown**:
```vue
<ProfileCard :profile="profileData" />
```

No imports needed - components are globally available.

#### 4. VitePress Config Structure

**File**: `docs/.vitepress/config.ts`

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MITRE SAF',
  description: '...',

  themeConfig: {
    logo: '/img/logos/mitre-saf.png',
    search: { provider: 'local' },  // Built-in search
    nav: [...],      // Top navigation
    sidebar: {...},  // Left sidebar (per-section)
    socialLinks: [...],
    footer: {...}
  }
})
```

**Navigation**:
- `nav` - Top navbar (global)
- `sidebar` - Left sidebar (per-section, key = path prefix)
- Sidebar only shows on pages with `layout: doc`

#### 5. Theme Customization

**Base Theme**: Extends VitePress default theme (NOT @vue/theme currently)

**Customization** (`docs/.vitepress/theme/custom.css`):
```css
:root {
  /* MITRE brand colors */
  --vp-c-brand-1: #005288;
  --vp-c-brand-2: #0066a8;
  --vp-c-brand-3: #0080cc;
}
```

VitePress uses CSS custom properties for theming. Override these for brand colors, spacing, fonts, etc.

## VitePress Features & Best Practices

### Data Loading (Build-Time)

**Use extensively** - Already implemented for validation profiles, expand for all content types.

**Pattern:**
```typescript
// docs/.vitepress/loaders/profiles.data.ts
import { defineLoader } from 'vitepress'

export default defineLoader({
  watch: ['../../content/data/profiles/*.yml'],  // Hot-reload on changes
  async load(): Promise<ProfileData> {
    // Load YAML, transform, return typed data
    // Runs at BUILD TIME only (Node.js APIs available)
  }
})
```

**Benefits:**
- Data transformation at build time (no client-side YAML parsing)
- Type-safe data imports
- Hot-reload during development
- Works with any data source (files, APIs, databases)

**Use cases:**
- ✅ Loading validation profiles from YAML
- ✅ Loading hardening guides from YAML
- ✅ Loading standards/frameworks from YAML
- ✅ Generating navigation from file structure

### Dynamic Routes (Programmatic Page Generation)

**Critical for scaling** - Generate hundreds of pages from templates instead of manual markdown files.

**Pattern:**
```typescript
// docs/validate/profiles/[slug].paths.ts
export default {
  paths() {
    const profiles = loadAllProfiles()  // From YAML or API
    return profiles.map(profile => ({
      params: {
        slug: profile.slug,
        ...profile  // All profile data available in template
      }
    }))
  }
}
```

```vue
<!-- docs/validate/profiles/[slug].md -->
---
layout: doc
---
<script setup>
import { useData } from 'vitepress'
const { params } = useData()
</script>

# {{ params.name }}

{{ params.description }}

**Category:** {{ params.category }}
**Version:** {{ params.version }}
```

**Use cases:**
- ✅ Generate detail pages for 100+ validation profiles
- ✅ Generate detail pages for hardening guides
- ✅ Generate pages for standards/frameworks
- ✅ Generate API documentation from OpenAPI specs

**Don't do this:**
- ❌ Manually creating `rhel8-stig.md`, `ubuntu-20-cis.md`, etc.
- ❌ Copy-pasting templates for each item

### Asset Handling

**Structure:**
```
docs/public/
├── img/
│   ├── logos/
│   │   └── mitre-saf.png
│   ├── icons/
│   │   ├── linux.svg
│   │   └── windows.svg
│   └── badges/
│       └── version-badge.svg
└── downloads/
    └── guides.pdf
```

**Referencing assets:**
```vue
<!-- In markdown or components -->
<img src="/img/logos/mitre-saf.png" alt="MITRE SAF">

<!-- In config -->
themeConfig: {
  logo: '/img/logos/mitre-saf.png'
}
```

**Key points:**
- Use root-absolute paths: `/img/logo.png`
- Don't include `/public/` in paths
- Assets are hashed in production builds
- Images <4KB are base64 inlined automatically

### File-Based Routing

**How it works:**
```
docs/index.md → /
docs/validate/index.md → /validate/
docs/validate/rhel8-stig.md → /validate/rhel8-stig.html
```

**Linking between pages:**
```markdown
[Getting Started](./getting-started)  <!-- ✅ Recommended -->
[Getting Started](./getting-started.md)  <!-- ❌ Don't use extensions -->
```

### MPA Mode - DON'T USE

**Skip this feature** - VitePress MPA mode disables JavaScript by default.

**Why not:**
- ❌ Interactive filters require JavaScript
- ❌ Client-side search requires JavaScript
- ❌ SPA navigation is better for docs sites
- ❌ Trade-off not worth it for this project

**Decision:** Stick with default SPA mode.

## Content Organization

**Markdown Files** (`docs/**/*.md`):
- Each `.md` file becomes a page
- Frontmatter controls layout, sidebar, title
- Can include Vue components inline with `<script setup>`

**Static Assets** (`docs/public/`):
- Images, fonts, static files
- Referenced as `/img/logo.png` (not `/public/img/logo.png`)

**Data Files** (future: `docs/content/data/*.yml`):
- YAML data for profiles, guides, standards
- Loaded via data loaders in `docs/.vitepress/loaders/`

## Beads Task Tracking

This project uses beads (bd) for task management:

```bash
bd ready                        # See available work
bd show saf-site-vitepress-33i  # Project context
bd show saf-site-vitepress-cei  # Session recovery
bd list --status=open           # All open tasks
```

**Critical**: Always check beads cards for architectural decisions and patterns before creating new pages/components.

## Important Notes

### Layout Patterns
- **Home page**: TBD (hero layout pending)
- **Browse pages**: `layout: doc` + `aside: false` + CSS overrides
- **Framework pages**: TBD (content pages with sidebars)
- **Documentation pages**: Standard `layout: doc` with sidebar

### Component Library: Reka UI

**Decision:** Reka UI 2.7.0 (APPROVED - see beads card `saf-site-vitepress-uw8`)

**Why Reka UI:**
- Vue-native optimization (smaller bundle, better DX)
- Works seamlessly with VitePress CSS variables
- Transparency/visibility issues already solved
- No additional dependencies (Tailwind not required)

**Styling Pattern:**
```vue
<script setup lang="ts">
import { SelectRoot, SelectTrigger, SelectValue } from 'reka-ui'
</script>

<template>
  <SelectRoot v-model="selected">
    <SelectTrigger class="select-trigger">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
  </SelectRoot>
</template>

<style scoped>
.select-trigger {
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}

.select-trigger:hover {
  border-color: var(--vp-c-brand-1);
}
</style>
```

**Reference:** See `ProfileFilters.vue` for complete example with dropdowns and styling.

**Rejected Alternatives:**
- Shadcn Vue (requires Tailwind, conflicts with VitePress theme)
- Headless UI (smaller component set, Vue is secondary)
- Ark UI (framework-agnostic = larger bundle)

### Vue 3 Composition API
All components use `<script setup>` syntax:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

### TypeScript
- Config files: TypeScript (`.ts`)
- Data loaders: TypeScript with typed interfaces
- Components: `<script setup lang="ts">` with TypeScript

### Build Output
- Output directory: `docs/.vitepress/dist/`
- Static site generation (SSG)
- All pages pre-rendered at build time
- Client-side hydration for interactivity

## Migration Context

This is a POC to evaluate VitePress as replacement for existing Nuxt site at `/Users/alippold/github/mitre/saf-site-v4`.

**Success Criteria**:
1. Handle complex YAML data (profiles, guides, standards)
2. Interactive browse pages with filters/search
3. Production-quality components and UX
4. Fast builds and good bundle size
5. Same UX as Nuxt but simpler stack

**Current Phase**: Core infrastructure (layouts, patterns, component library)
