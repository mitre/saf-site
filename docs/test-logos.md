---
title: Logo Components
layout: doc
aside: false
---

<script setup>
import { Grid3X3, Rows3, Settings, Palette, ArrowRight } from 'lucide-vue-next'

const techPartners = [
  { name: 'Oracle', href: 'https://oracle.com' },
  { name: 'GitHub', href: 'https://github.com' },
  { name: 'AWS', href: 'https://aws.amazon.com' },
  { name: 'Red Hat', href: 'https://redhat.com' },
  { name: 'VMware', href: 'https://vmware.com' },
  { name: 'Microsoft', href: 'https://microsoft.com' },
  { name: 'Docker', href: 'https://docker.com' },
  { name: 'Kubernetes', href: 'https://kubernetes.io' }
]

const projectPartners = [
  { name: 'MITRE', href: 'https://mitre.org' },
  { name: 'DISA', href: 'https://disa.mil' },
  { name: 'CIS', href: 'https://cisecurity.org' }
]

const ohdfFormats = [
  { name: 'SonarQube', href: 'https://sonarqube.org' },
  { name: 'Burp Suite', href: 'https://portswigger.net/burp' },
  { name: 'OWASP ZAP', href: 'https://zaproxy.org' },
  { name: 'Nessus', href: 'https://tenable.com/products/nessus' },
  { name: 'Qualys', href: 'https://qualys.com' },
  { name: 'Snyk', href: 'https://snyk.io' },
  { name: 'Veracode', href: 'https://veracode.com' },
  { name: 'Checkmarx', href: 'https://checkmarx.com' },
  { name: 'Fortify', href: 'https://microfocus.com/fortify' },
  { name: 'Prisma Cloud', href: 'https://paloaltonetworks.com/prisma/cloud' },
  { name: 'AWS', href: 'https://aws.amazon.com' },
  { name: 'Azure', href: 'https://azure.microsoft.com' },
  { name: 'Anchore', href: 'https://anchore.com' },
  { name: 'Trivy', href: 'https://trivy.dev' },
  { name: 'Grype', href: 'https://github.com/anchore/grype' },
  { name: 'Twistlock', href: 'https://paloaltonetworks.com/prisma/cloud' },
  { name: 'JFrog Xray', href: 'https://jfrog.com/xray' },
  { name: 'Tenable', href: 'https://tenable.com' },
  { name: 'Rapid7', href: 'https://rapid7.com' },
  { name: 'CrowdStrike', href: 'https://crowdstrike.com' },
  { name: 'Splunk', href: 'https://splunk.com' },
  { name: 'Datadog', href: 'https://datadoghq.com' },
  { name: 'New Relic', href: 'https://newrelic.com' },
  { name: 'Dynatrace', href: 'https://dynatrace.com' },
  { name: 'AppDynamics', href: 'https://appdynamics.com' },
  { name: 'Elastic', href: 'https://elastic.co' },
  { name: 'Sumo Logic', href: 'https://sumologic.com' },
  { name: 'LogRhythm', href: 'https://logrhythm.com' },
  { name: 'IBM QRadar', href: 'https://ibm.com/qradar' },
  { name: 'McAfee', href: 'https://mcafee.com' },
  { name: 'Symantec', href: 'https://symantec.com' },
  { name: 'Trend Micro', href: 'https://trendmicro.com' },
  { name: 'Palo Alto', href: 'https://paloaltonetworks.com' },
  { name: 'Cisco', href: 'https://cisco.com' },
  { name: 'Juniper', href: 'https://juniper.net' }
]
</script>

# Logo Components

Components for displaying partner logos, integrations, and supported tools.

---

<PageSection
  orientation="horizontal"
  headline="LogoGrid"
  title="Responsive Grid Layout"
  description="Display logos in a responsive grid. Adapts from 4 columns on desktop to 1 on mobile. Supports multiple variants and alignment options."
>
  <template #body>
    <FeatureList
      :items="[
        { icon: Grid3X3, title: 'Responsive', description: 'Auto-adapts: 4 → 3 → 1 columns' },
        { icon: Rows3, title: 'Flexible Layout', description: 'Grid or horizontal row modes' },
        { icon: Settings, title: 'Configurable', description: 'Variants, alignment, custom columns' }
      ]"
      gap="sm"
    />
  </template>

  <LogoGrid :items="techPartners" :size="48" />
</PageSection>

## LogoGrid Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `LogoItem[]` | **required** | Array of logo items |
| `title` | `string` | - | Optional section title |
| `size` | `number` | `48` | Logo size in pixels |
| `showNames` | `boolean` | `false` | Show name labels |
| `columns` | `number` | - | Fixed columns (overrides responsive) |
| `variant` | `'default' \| 'compact' \| 'card'` | `'default'` | Visual style |
| `fluid` | `boolean` | `false` | Use auto-fit |
| `layout` | `'grid' \| 'row'` | `'grid'` | Layout mode |
| `mobileLayout` | `'grid' \| 'row'` | - | Mobile override |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Item alignment |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around'` | `'start'` | Row justify |

### LogoItem Interface

```ts
interface LogoItem {
  name: string       // Brand name (for BrandIcon)
  href?: string      // Link URL
  image?: string     // Custom image path
  description?: string
}
```

---

## LogoGrid Examples

### With Names

<LogoGrid :items="techPartners" :size="40" :showNames="true" class="my-6" />

### Card Variant

<LogoGrid :items="projectPartners" :size="56" :showNames="true" variant="card" :columns="3" class="my-6" />

### Compact Variant

<LogoGrid :items="techPartners" :size="32" variant="compact" class="my-6" />

### Row Layout (Horizontal Scroll)

<LogoGrid :items="ohdfFormats.slice(0, 15)" :size="40" layout="row" class="my-6" />

### Fluid (Auto-fit)

<LogoGrid :items="techPartners" :size="40" :fluid="true" class="my-6" />

### Single Column

<LogoGrid :items="projectPartners" :size="48" :showNames="true" :columns="1" class="my-6" />

### Mobile Row, Desktop Grid

Resize your browser to see different layouts:

<LogoGrid :items="techPartners" :size="40" :showNames="true" mobileLayout="row" class="my-6" />

---

<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="LogoMarquee"
  title="Animated Scrolling Display"
  description="Create visual interest with continuously scrolling logos. Perfect for showcasing many integrations or partners."
>
  <template #body>
    <FeatureList
      :items="[
        { icon: Rows3, title: 'Multi-Row', description: 'Split items across rows with alternating directions' },
        { icon: Settings, title: 'Customizable', description: 'Speed, direction, size, overlay' },
        { icon: Palette, title: 'Accessible', description: 'Respects reduced motion preferences' }
      ]"
      gap="sm"
    />
  </template>

  <LogoMarquee :items="ohdfFormats" :rows="3" :size="32" :duration="25" />
</PageSection>

## LogoMarquee Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `LogoItem[]` | **required** | Array of logo items |
| `duration` | `number` | `30` | Animation seconds |
| `pauseOnHover` | `boolean` | `true` | Pause on hover |
| `reverse` | `boolean` | `false` | Reverse direction |
| `size` | `number` | `40` | Logo size in pixels |
| `repeat` | `number` | `2` | Repeats for seamless loop |
| `overlay` | `boolean` | `true` | Gradient fade at edges |
| `rows` | `number` | `1` | Number of rows |
| `alternateDirection` | `boolean` | `true` | Alternate per row |
| `verticalAlign` | `'start' \| 'center' \| 'end'` | `'center'` | Vertical alignment |

---

## LogoMarquee Examples

### Single Row

<LogoMarquee :items="techPartners" :size="40" :duration="20" class="my-6" />

### Reversed Direction

<LogoMarquee :items="techPartners" :size="40" :duration="20" :reverse="true" class="my-6" />

### Multi-Row (2 Rows)

<LogoMarquee :items="ohdfFormats" :rows="2" :size="36" :duration="25" class="my-6" />

### Multi-Row (4 Rows)

<LogoMarquee :items="ohdfFormats" :rows="4" :size="32" :duration="30" class="my-6" />

### No Overlay

<LogoMarquee :items="techPartners" :size="40" :duration="20" :overlay="false" class="my-6" />

### Same Direction (No Alternating)

<LogoMarquee :items="ohdfFormats" :rows="2" :size="36" :alternateDirection="false" class="my-6" />

---

## Real-World Examples

### Partners Section

<div class="text-center py-8 bg-[--vp-c-bg-soft] rounded-lg my-6">
  <h3 class="text-lg font-semibold text-[--vp-c-text-2] mb-4">Trusted by Industry Leaders</h3>
  <LogoMarquee :items="techPartners" :size="48" :duration="35" />
</div>

### Horizontal PageSection Example

<PageSection
  orientation="horizontal"
  title="PageSection with LogoMarquee"
  description="Demonstrates using LogoMarquee as the visual element in a two-column layout."
  :links="[{ label: 'Learn More', href: '#' }]"
>
  <LogoMarquee :items="ohdfFormats" :rows="3" :size="28" :duration="20" verticalAlign="center" />
</PageSection>

### Key Partners (Card Grid)

<LogoGrid
  title="Project Partners"
  :items="projectPartners"
  :size="64"
  :showNames="true"
  variant="card"
  :columns="3"
  class="my-6"
/>

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}
</style>
