<script setup lang="ts">
import LogoGrid from './LogoGrid.vue'

const techPartners = [
  { name: 'AWS', href: 'https://aws.amazon.com' },
  { name: 'GitHub', href: 'https://github.com' },
  { name: 'Red Hat', href: 'https://redhat.com' },
  { name: 'Docker', href: 'https://docker.com' },
  { name: 'Kubernetes', href: 'https://kubernetes.io' },
  { name: 'VMware', href: 'https://vmware.com' },
  { name: 'Microsoft', href: 'https://microsoft.com' },
  { name: 'Oracle', href: 'https://oracle.com' },
]

const projectPartners = [
  { name: 'MITRE', href: 'https://mitre.org' },
  { name: 'DISA', href: 'https://disa.mil' },
  { name: 'CIS', href: 'https://cisecurity.org' },
]
</script>

<template>
  <Story title="Display/LogoGrid" :layout="{ type: 'grid', width: 500 }">
    <Variant title="Default">
      <LogoGrid :items="techPartners" />
    </Variant>

    <Variant title="With Names">
      <LogoGrid :items="techPartners" :show-names="true" />
    </Variant>

    <Variant title="Card Variant">
      <LogoGrid :items="projectPartners" variant="card" :show-names="true" />
    </Variant>

    <Variant title="Compact Variant">
      <LogoGrid :items="techPartners" variant="compact" :size="32" />
    </Variant>

    <Variant title="Row Layout">
      <LogoGrid :items="techPartners" layout="row" />
    </Variant>

    <Variant title="Fixed Columns (3)">
      <LogoGrid :items="projectPartners" :columns="3" :show-names="true" />
    </Variant>

    <Variant title="Large Size">
      <LogoGrid :items="projectPartners" :size="64" :show-names="true" />
    </Variant>

    <Variant title="Fluid (Auto-fit)">
      <LogoGrid :items="techPartners" :fluid="true" />
    </Variant>
  </Story>
</template>

<docs lang="md">
# LogoGrid

LogoGrid - Display partner/sponsor logos in a responsive grid. Supports multiple variants (default, compact, card), layouts (grid, row), and automatic logo resolution via SimpleIcons or custom icons.

## Usage

```vue
Basic usage with auto-resolved logos
<LogoGrid
:items="[
{ name: 'AWS', href: 'https://aws.amazon.com' },
{ name: 'GitHub', href: 'https://github.com' },
{ name: 'Red Hat', href: 'https://redhat.com' }
]"
:showNames="true"
/>
```

```vue
Card variant for partners section
<LogoGrid
:items="partners"
variant="card"
:showNames="true"
:size="64"
/>
```

```vue
Horizontal scrolling row
<LogoGrid
:items="tools"
layout="row"
:size="32"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `-` | Array of logo items to display **(required)** |
| `title` | `string` | `-` | Optional section title |
| `size` | `number` | `48` | Logo size in pixels |
| `showNames` | `boolean` | `false` | Show name labels below logos |
| `columns` | `number` | `-` | Fixed columns override (uses responsive defaults if not set) |
| `variant` | `union` | `'default'` | Variant styling |
| `fluid` | `boolean` | `false` | Use fluid auto-fit instead of fixed responsive columns |
| `layout` | `union` | `'grid'` | Layout mode: grid (default) or row (horizontal scrolling single row) |
| `mobileLayout` | `union` | `-` | Override layout on mobile (useful for row on mobile, grid on desktop) |
| `align` | `union` | `'center'` | Horizontal alignment of items within container |
| `justify` | `union` | `'start'` | Justify content for row layout |

## Types

```typescript
export interface LogoGridProps {
  /** Array of logo items to display */
  items: LogoItem[]
  /** Optional section title */
  title?: string
  /** Logo size in pixels */
  size?: number
  /** Show name labels below logos */
  showNames?: boolean
  /** Fixed columns override (uses responsive defaults if not set) */
  columns?: number
  /** Variant styling */
  variant?: 'default' | 'compact' | 'card'
  /** Use fluid auto-fit instead of fixed responsive columns */
  fluid?: boolean
  /** Layout mode: grid (default) or row (horizontal scrolling single row) */
  layout?: 'grid' | 'row'
  /** Override layout on mobile (useful for row on mobile, grid on desktop) */
  mobileLayout?: 'grid' | 'row'
  /** Horizontal alignment of items within container */
  align?: 'start' | 'center' | 'end'
  /** Justify content for row layout */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}
```
</docs>
