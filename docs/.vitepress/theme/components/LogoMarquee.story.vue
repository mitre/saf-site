<script setup lang="ts">
import LogoMarquee from './LogoMarquee.vue'

const tools = [
  { name: 'SonarQube' },
  { name: 'Burp Suite' },
  { name: 'OWASP ZAP' },
  { name: 'Nessus' },
  { name: 'Qualys' },
  { name: 'Snyk' },
  { name: 'Veracode' },
  { name: 'Checkmarx' },
  { name: 'Fortify' },
  { name: 'Prisma Cloud' },
  { name: 'AWS' },
  { name: 'Trivy' },
  { name: 'Grype' },
  { name: 'Anchore' },
  { name: 'Splunk' },
]

const techPartners = [
  { name: 'AWS' },
  { name: 'GitHub' },
  { name: 'Red Hat' },
  { name: 'Docker' },
  { name: 'Kubernetes' },
]
</script>

<template>
  <Story title="Display/LogoMarquee" :layout="{ type: 'single', iframe: true }">
    <Variant title="Default (Single Row)">
      <div style="width: 100%; min-width: 600px;">
        <LogoMarquee :items="techPartners" />
      </div>
    </Variant>

    <Variant title="Multi-Row (2)">
      <LogoMarquee :items="tools" :rows="2" :duration="25" />
    </Variant>

    <Variant title="Multi-Row (3)">
      <LogoMarquee :items="tools" :rows="3" :size="32" :duration="20" />
    </Variant>

    <Variant title="Reversed Direction">
      <LogoMarquee :items="techPartners" :reverse="true" />
    </Variant>

    <Variant title="No Overlay">
      <LogoMarquee :items="techPartners" :overlay="false" />
    </Variant>

    <Variant title="Same Direction (No Alternating)">
      <LogoMarquee :items="tools" :rows="2" :alternate-direction="false" />
    </Variant>

    <Variant title="Fast (10s)">
      <LogoMarquee :items="techPartners" :duration="10" />
    </Variant>

    <Variant title="Slow (60s)">
      <LogoMarquee :items="techPartners" :duration="60" />
    </Variant>
  </Story>
</template>

<docs lang="md">
# LogoMarquee

LogoMarquee - Animated infinite-scrolling logo display. Creates a smooth horizontal scroll of logos for visual interest. Supports multiple rows with alternating directions for large logo sets.

## Usage

```vue
Basic single-row marquee
<LogoMarquee
:items="[
{ name: 'AWS' },
{ name: 'GitHub' },
{ name: 'Docker' }
]"
:duration="20"
/>
```

```vue
Multi-row with alternating directions
<LogoMarquee
:items="allPartners"
:rows="3"
:size="32"
:duration="25"
/>
```

```vue
Reversed direction, no overlay
<LogoMarquee
:items="tools"
:reverse="true"
:overlay="false"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `-` |  **(required)** |
| `duration` | `number` | `30` | Animation duration in seconds |
| `pauseOnHover` | `boolean` | `true` | Pause animation on hover |
| `reverse` | `boolean` | `false` | Reverse scroll direction (first row if using rows) |
| `size` | `number` | `40` | Logo size in pixels |
| `repeat` | `number` | `2` | Number of times to repeat items (for seamless loop) |
| `overlay` | `boolean` | `true` | Show gradient overlay at edges |
| `rows` | `number` | `1` | Number of rows to split items into (alternates direction) |
| `alternateDirection` | `boolean` | `true` | Alternate scroll direction per row |
| `verticalAlign` | `union` | `'center'` | Vertical alignment within parent container |

## Types

```typescript
export interface LogoMarqueeProps {
  items: LogoItem[]
  /** Animation duration in seconds */
  duration?: number
  /** Pause animation on hover */
  pauseOnHover?: boolean
  /** Reverse scroll direction (first row if using rows) */
  reverse?: boolean
  /** Logo size in pixels */
  size?: number
  /** Number of times to repeat items (for seamless loop) */
  repeat?: number
  /** Show gradient overlay at edges */
  overlay?: boolean
  /** Number of rows to split items into (alternates direction) */
  rows?: number
  /** Alternate scroll direction per row */
  alternateDirection?: boolean
  /** Vertical alignment within parent container */
  verticalAlign?: 'start' | 'center' | 'end'
}
```

</docs>
