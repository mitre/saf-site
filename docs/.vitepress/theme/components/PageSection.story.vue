<script setup lang="ts">
import { CheckCircle, FileCode, Shield } from 'lucide-vue-next'
import FeatureList from './FeatureList.vue'
import PageSection from './PageSection.vue'
import Placeholder from './Placeholder.vue'

const features = [
  { icon: Shield, title: 'Feature One', description: 'Description of the first feature' },
  { icon: FileCode, title: 'Feature Two', description: 'Description of the second feature' },
  { icon: CheckCircle, title: 'Feature Three', description: 'Description of the third feature' },
]

const links = [
  { label: 'Get Started', href: '#' },
  { label: 'Learn More', href: '#', variant: 'outline' as const },
]
</script>

<template>
  <Story title="Layout/PageSection" :layout="{ type: 'single', iframe: true }">
    <Variant title="Vertical (Default)">
      <PageSection
        headline="Headline"
        title="Vertical Layout"
        description="This is a basic vertical layout. Content stacks in a single column."
        :links="[{ label: 'Action', href: '#' }]"
      />
    </Variant>

    <Variant title="Horizontal">
      <PageSection
        orientation="horizontal"
        headline="Horizontal"
        title="Two-Column Layout"
        description="Content appears side-by-side on desktop, stacks on mobile."
        :links="links"
      >
        <Placeholder height="200px" label="Visual Content" />
      </PageSection>
    </Variant>

    <Variant title="Horizontal Reversed">
      <PageSection
        orientation="horizontal"
        :reverse="true"
        title="Reversed Layout"
        description="The reverse prop swaps the order of content and visual columns."
        :links="[{ label: 'Learn More', href: '#' }]"
      >
        <Placeholder height="200px" label="Image or Video" />
      </PageSection>
    </Variant>

    <Variant title="Muted Background">
      <PageSection
        variant="muted"
        orientation="horizontal"
        title="Muted Variant"
        description="The muted variant adds a subtle background color."
        :links="links"
      >
        <Placeholder height="200px" label="Content" />
      </PageSection>
    </Variant>

    <Variant title="With Feature List">
      <PageSection
        orientation="horizontal"
        :reverse="true"
        title="With Body Slot"
        description="Use the body slot to add content like feature lists."
      >
        <template #body>
          <FeatureList :items="features" gap="sm" />
        </template>
        <Placeholder height="250px" label="Visual" />
      </PageSection>
    </Variant>

    <Variant title="Align Start">
      <PageSection
        orientation="horizontal"
        align="start"
        title="Top Aligned"
        description="Content aligns to the top."
        :links="[{ label: 'Action', href: '#' }]"
      >
        <Placeholder height="300px" label="Tall Visual" />
      </PageSection>
    </Variant>
  </Story>
</template>

<docs lang="md">
# PageSection

PageSection - Flexible two-column layout for feature/CTA sections. Supports vertical (stacked) and horizontal (side-by-side) orientations, with slots for content (text, links) and visuals (images, components).

## Usage

```vue
Vertical hero section
<PageSection
headline="Security Automation"
title="Validate your systems with InSpec"
description="Run compliance checks against industry standards."
:links="[{ label: 'Get Started', href: '/start' }]"
/>
```

```vue
Horizontal with visual slot
<PageSection
orientation="horizontal"
title="Supported Platforms"
description="InSpec runs on any platform."
>
<LogoGrid :items="platforms" />
</PageSection>
```

```vue
Reversed layout with muted background
<PageSection
orientation="horizontal"
:reverse="true"
variant="muted"
title="Enterprise Ready"
>
<img src="/enterprise.png" alt="Enterprise" />
</PageSection>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string` | `'section'` | Render as different element |
| `headline` | `string` | `-` | Small text above title |
| `title` | `string` | `-` | Main section title |
| `description` | `string` | `-` | Section description |
| `orientation` | `union` | `'vertical'` | Layout orientation |
| `reverse` | `boolean` | `false` | Reverse content and visual order |
| `variant` | `union` | `'default'` | Background variant |
| `links` | `Array` | `-` | Array of link buttons |
| `align` | `union` | `'center'` | Vertical alignment of content and visual |
| `contained` | `boolean` | `true` | Constrain width |

## Slots

| Slot | Description |
|------|-------------|
| `top` |  |
| `header` |  |
| `headline` |  |
| `title` |  |
| `description` |  |
| `body` |  |
| `footer` |  |
| `links` |  |
| `default` |  |
| `bottom` |  |

## Types

```typescript
export interface PageSectionLink {
  label: string
  href: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  external?: boolean
}

export interface PageSectionProps {
  /** Render as different element */
  as?: string
  /** Small text above title */
  headline?: string
  /** Main section title */
  title?: string
  /** Section description */
  description?: string
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal'
  /** Reverse content and visual order */
  reverse?: boolean
  /** Background variant */
  variant?: 'default' | 'muted' | 'dark'
  /** Array of link buttons */
  links?: PageSectionLink[]
  /** Vertical alignment of content and visual */
  align?: 'start' | 'center' | 'end'
  /** Constrain width */
  contained?: boolean
}
```

</docs>
