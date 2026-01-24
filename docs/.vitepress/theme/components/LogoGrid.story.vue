<script setup lang="ts">
import LogoGrid from './LogoGrid.vue'

/**
 * @docs
 * LogoGrid displays a responsive grid of brand/partner logos.
 *
 * ## Props
 * | Prop | Type | Default | Description |
 * |------|------|---------|-------------|
 * | `items` | `LogoItem[]` | required | Array of logo items |
 * | `size` | `number` | `48` | Logo size in pixels |
 * | `showNames` | `boolean` | `false` | Show name labels |
 * | `columns` | `number` | - | Fixed columns (overrides responsive) |
 * | `variant` | `'default' \| 'compact' \| 'card'` | `'default'` | Visual style |
 * | `fluid` | `boolean` | `false` | Use auto-fit grid |
 * | `layout` | `'grid' \| 'row'` | `'grid'` | Layout mode |
 * | `align` | `'start' \| 'center' \| 'end'` | `'center'` | Item alignment |
 *
 * ## LogoItem Interface
 * ```ts
 * interface LogoItem {
 *   name: string       // Brand name (for BrandIcon)
 *   href?: string      // Link URL
 *   image?: string     // Custom image path
 * }
 * ```
 */

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
      <LogoGrid :items="techPartners" :showNames="true" />
    </Variant>

    <Variant title="Card Variant">
      <LogoGrid :items="projectPartners" variant="card" :showNames="true" />
    </Variant>

    <Variant title="Compact Variant">
      <LogoGrid :items="techPartners" variant="compact" :size="32" />
    </Variant>

    <Variant title="Row Layout">
      <LogoGrid :items="techPartners" layout="row" />
    </Variant>

    <Variant title="Fixed Columns (3)">
      <LogoGrid :items="projectPartners" :columns="3" :showNames="true" />
    </Variant>

    <Variant title="Large Size">
      <LogoGrid :items="projectPartners" :size="64" :showNames="true" />
    </Variant>

    <Variant title="Fluid (Auto-fit)">
      <LogoGrid :items="techPartners" :fluid="true" />
    </Variant>
  </Story>
</template>
