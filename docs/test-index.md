---
title: Component Library
layout: doc
aside: false
---

<script setup>
import { Grid3X3, Play, Layout, Box, FileCode, Package, Layers, Code2, Filter, Eye } from 'lucide-vue-next'
</script>

# Component Library

Interactive demos and documentation for VitePress components. This page serves as the inventory and entry point for all custom and third-party components.

---

## Custom Components

Components built specifically for this project, inspired by Nuxt UI patterns.

<PageSection
  orientation="horizontal"
  headline="Layout"
  title="Page Layout Components"
  description="Two-column layouts for feature sections, CTAs, and content blocks."
  :links="[{ label: 'View Demo', href: '/test-page-section' }]"
>
  <template #body>
    <FeatureList
      :items="[
        { icon: Layout, title: 'PageSection', description: 'Two-column hero/CTA layouts with slots' },
        { icon: FileCode, title: 'FeatureItem', description: 'Icon + title + description block' },
        { icon: FileCode, title: 'FeatureList', description: 'Renders array of feature items' },
        { icon: Box, title: 'Skeleton', description: 'Animated loading placeholder' },
        { icon: Box, title: 'Placeholder', description: 'Diagonal pattern visual placeholder' }
      ]"
      gap="sm"
    />
  </template>

  <Placeholder height="200px" label="Visual Content" />
</PageSection>

---

<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="Display"
  title="Logo & Brand Components"
  description="Display partner logos, integrations, and supported tools with responsive grids and animations."
  :links="[{ label: 'View Demo', href: '/test-logos' }]"
>
  <template #body>
    <FeatureList
      :items="[
        { icon: Grid3X3, title: 'LogoGrid', description: 'Responsive grid with variants' },
        { icon: Play, title: 'LogoMarquee', description: 'Animated scrolling display' },
        { icon: Package, title: 'BrandIcon', description: 'Technology/vendor icons with fallback' }
      ]"
      gap="sm"
    />
  </template>

  <LogoMarquee
    :items="[
      { name: 'AWS' },
      { name: 'GitHub' },
      { name: 'Red Hat' },
      { name: 'Docker' },
      { name: 'Kubernetes' }
    ]"
    :size="36"
    :rows="2"
    :duration="15"
  />
</PageSection>

---

<PageSection
  orientation="horizontal"
  headline="Content"
  title="Content Library Components"
  description="Browse and display content items with filtering, search, and detail views."
  :links="[{ label: 'View Live', href: '/content/' }]"
>
  <template #body>
    <FeatureList
      :items="[
        { icon: Layers, title: 'ContentCard', description: 'Card for browse grid display' },
        { icon: Filter, title: 'ContentFilters', description: 'Filter controls with fuzzy search' },
        { icon: Eye, title: 'ContentDetail', description: 'Full detail page layout' },
        { icon: Layers, title: 'ContentHero', description: 'Hero section for detail pages' },
        { icon: Code2, title: 'PillarBadge', description: 'SAF pillar indicator badges' }
      ]"
      gap="sm"
    />
  </template>

  <Placeholder height="200px" label="Content Preview" />
</PageSection>

---

## shadcn-vue Components

Pre-built accessible components from [shadcn-vue](https://www.shadcn-vue.com/).

### Installed

Currently installed and available for use:

| Component | Import | Use Case |
|-----------|--------|----------|
| Badge | `@/components/ui/badge` | Status indicators, tags |
| Button | `@/components/ui/button` | Actions, CTAs, links |
| Card | `@/components/ui/card` | Content containers (Card, CardHeader, CardTitle, CardContent, CardFooter) |
| Input | `@/components/ui/input` | Text input fields |
| Select | `@/components/ui/select` | Dropdown selection (Select, SelectTrigger, SelectContent, SelectItem, etc.) |

### Available (Install as Needed)

Key components available via `pnpm dlx shadcn-vue@latest add <name>`:

| Component | Purpose | Priority |
|-----------|---------|----------|
| `dialog` | Modal dialogs, confirmations | High |
| `accordion` | Collapsible content sections | High |
| `tabs` | Tabbed content organization | High |
| `table` | Data tables with sorting | Medium |
| `dropdown-menu` | Context menus, action menus | Medium |
| `tooltip` | Hover information | Medium |
| `alert` | Alert messages | Medium |
| `avatar` | User/author avatars | Low |
| `breadcrumb` | Navigation breadcrumbs | Low |
| `collapsible` | Single collapsible section | Low |
| `popover` | Floating content panels | Low |
| `sheet` | Side panel overlays | Low |
| `skeleton` | Loading states (we have custom) | - |
| `toast` / `sonner` | Notifications | Low |

<details>
<summary>Full shadcn-vue Component List</summary>

accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, checkbox, collapsible, combobox, command, context-menu, data-table, dialog, drawer, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, number-field, pagination, pin-input, popover, progress, radio-group, range-calendar, resizable, scroll-area, select, separator, sheet, skeleton, slider, sonner, switch, table, tabs, tags-input, textarea, toast, toggle, toggle-group, tooltip

</details>

---

## Composables

Reusable logic extracted into composables:

| Composable | Purpose | Tests |
|------------|---------|-------|
| `useContentDetail` | Metadata formatting, URL building for detail pages | ✓ |
| `useFilterOptions` | Extract unique filter options from content | ✓ |
| `useFuzzySearch` | Fuzzy text matching with Fuse.js | ✓ |

---

## Quick Reference

### All Custom Components

| Component | Category | Demo |
|-----------|----------|------|
| PageSection | Layout | [/test-page-section](/test-page-section) |
| FeatureItem | Layout | [/test-page-section](/test-page-section) |
| FeatureList | Layout | [/test-page-section](/test-page-section) |
| Skeleton | Layout | [/test-page-section](/test-page-section) |
| Placeholder | Layout | [/test-page-section](/test-page-section) |
| LogoGrid | Display | [/test-logos](/test-logos) |
| LogoMarquee | Display | [/test-logos](/test-logos) |
| BrandIcon | Display | [/icon-test](/icon-test) |
| ContentCard | Content | [/content/](/content/) |
| ContentFilters | Content | [/content/](/content/) |
| ContentDetail | Content | [/content/](/content/) |
| ContentHero | Content | - |
| PillarBadge | Content | [/content/](/content/) |
| ActionButtons | Content | - |
| FilterSelect | Content | - |
| MetadataPill | Content | - |
| MetadataStrip | Content | - |

### Supporting Files

| File | Purpose |
|------|---------|
| `lib/utils.ts` | `cn()` class merging utility |
| `lib/metadata.ts` | Metadata building helpers |
| `lib/loader-utils.ts` | Pocketbase data loading utilities |
| `logos/types.ts` | Shared LogoItem interface |
| `logos/LogoItemRenderer.vue` | Shared logo rendering |

---

## Planned Components

Components to build (inspired by Nuxt UI):

| Component | Purpose | Status |
|-----------|---------|--------|
| BlogPost | Blog card with image, date, authors | TODO |
| BlogPosts | Grid wrapper for blog posts | TODO |
| Kbd | Keyboard shortcut display | TODO |
| User | Author avatar + name | TODO |

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}
</style>
