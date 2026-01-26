---
layout: doc
aside: false
---

<script setup>
import { Shield, Hammer, FileCode, CheckCircle, Zap, Users, ArrowRight } from 'lucide-vue-next'

// Sample feature items (generic demo content)
const exampleFeatures = [
  { icon: Shield, title: 'Feature One', description: 'Description of the first feature goes here' },
  { icon: FileCode, title: 'Feature Two', description: 'Description of the second feature goes here' },
  { icon: CheckCircle, title: 'Feature Three', description: 'Description of the third feature goes here' }
]

const ohdfFormats = [
  { name: 'AWS Security Hub' },
  { name: 'Nessus' },
  { name: 'Fortify' },
  { name: 'Burp Suite' },
  { name: 'OWASP ZAP' },
  { name: 'Trivy' },
  { name: 'Grype' },
  { name: 'Snyk' },
  { name: 'Twistlock' },
  { name: 'JUnit' },
  { name: 'Splunk' },
  { name: 'SARIF' }
]

const links = [
  { label: 'Get Started', href: '/docs/', variant: 'default' },
  { label: 'View on GitHub', href: 'https://github.com/mitre/saf', variant: 'outline', external: true }
]
</script>

# PageSection & Feature Components

Layout components for building feature sections, CTAs, and content blocks.

## PageSection

Two-column layout with slots for content and visuals. Inspired by Nuxt UI PageHero/PageCTA.

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string` | `'section'` | HTML element to render |
| `headline` | `string` | - | Small text above title |
| `title` | `string` | - | Main section title |
| `description` | `string` | - | Section description text |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction |
| `reverse` | `boolean` | `false` | Swap content/visual order |
| `variant` | `'default' \| 'muted' \| 'dark'` | `'default'` | Background style |
| `links` | `PageSectionLink[]` | - | CTA buttons |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Vertical alignment |
| `contained` | `boolean` | `true` | Constrain max-width |

### Slots

| Slot | Description |
|------|-------------|
| `top` | Content above the main container |
| `header` | Override headline + title + description |
| `headline` | Custom headline content |
| `title` | Custom title content |
| `description` | Custom description content |
| `body` | Content between description and footer |
| `footer` | Override links area |
| `links` | Custom link buttons |
| `default` | Visual side content (images, marquees, etc.) |
| `bottom` | Content below the main container |

---

### Basic Vertical Layout

<PageSection
  headline="Component Demo"
  title="Vertical Layout Example"
  description="This is a basic vertical layout. Content stacks in a single column."
  :links="[{ label: 'Learn More', href: '#' }]"
/>

### Horizontal Layout with Visual

<PageSection
  orientation="horizontal"
  headline="Horizontal"
  title="Two-Column Layout"
  description="On desktop, content appears side-by-side. On mobile, it stacks vertically."
  :links="[{ label: 'View Example', href: '#' }]"
>
  <LogoMarquee :items="ohdfFormats" :rows="3" :size="32" :duration="25" />
</PageSection>

### Horizontal Reversed with Feature List

<PageSection
  orientation="horizontal"
  :reverse="true"
  title="Reversed Layout Example"
  description="The reverse prop swaps the order of content and visual columns."
>
  <template #body>
    <FeatureList :items="exampleFeatures" gap="md" />
  </template>
  <template #links>
    <a href="#" class="inline-flex items-center gap-2 text-[--vp-c-brand-1] font-medium hover:underline">
      Link Example <ArrowRight :size="16" />
    </a>
  </template>

  <Placeholder height="300px" label="Image or Video" />
</PageSection>

### Muted Background Variant

<PageSection
  variant="muted"
  orientation="horizontal"
  title="Muted Background"
  description="The muted variant adds a subtle background color to the section."
  :links="links"
>
  <LogoGrid
    :items="[
      { name: 'AWS', href: 'https://aws.amazon.com' },
      { name: 'GitHub', href: 'https://github.com' },
      { name: 'GitLab', href: 'https://gitlab.com' },
      { name: 'Jenkins', href: 'https://jenkins.io' }
    ]"
    :size="40"
    variant="compact"
  />
</PageSection>

---

## FeatureItem

Individual feature block with icon, title, and description.

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `Component` | - | Lucide icon component |
| `title` | `string` | **required** | Feature title |
| `description` | `string` | - | Feature description |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `href` | `string` | - | Link destination |
| `target` | `string` | - | Link target |

### Slots

| Slot | Description |
|------|-------------|
| `icon` | Custom icon content |
| `title` | Custom title content |
| `description` | Custom description content |

---

### Horizontal (Default)

<div class="space-y-4 my-6">
  <FeatureItem
    :icon="Shield"
    title="First Feature"
    description="Description text for the first feature item"
  />
  <FeatureItem
    :icon="Hammer"
    title="Second Feature"
    description="Description text for the second feature item"
  />
  <FeatureItem
    :icon="FileCode"
    title="Third Feature"
    description="Description text for the third feature item"
  />
</div>

### Vertical Orientation

<div class="grid grid-cols-3 gap-6 my-6">
  <FeatureItem
    :icon="Zap"
    title="Fast"
    description="Parallel execution"
    orientation="vertical"
  />
  <FeatureItem
    :icon="Shield"
    title="Secure"
    description="Air-gapped support"
    orientation="vertical"
  />
  <FeatureItem
    :icon="Users"
    title="Team Ready"
    description="Multi-user workflows"
    orientation="vertical"
  />
</div>

### As Links

<div class="space-y-4 my-6">
  <FeatureItem
    :icon="Shield"
    title="Internal Link Example"
    description="Feature items can link to internal pages"
    href="/content/"
  />
  <FeatureItem
    :icon="FileCode"
    title="External Link Example"
    description="Or link to external URLs (opens in new tab)"
    href="https://example.com"
  />
</div>

---

## FeatureList

Renders an array of FeatureItems with consistent spacing.

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `FeatureItemData[]` | - | Array of feature objects |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Item layout |
| `gap` | `'sm' \| 'md' \| 'lg'` | `'md'` | Space between items |
| `direction` | `'column' \| 'row'` | `'column'` | List stack direction |

### FeatureItemData

```ts
interface FeatureItemData {
  icon?: Component    // Lucide icon
  title: string       // Required
  description?: string
  href?: string
}
```

---

### Column Layout (Default)

<FeatureList :items="exampleFeatures" gap="lg" class="my-6" />

### Small Gap

<FeatureList :items="exampleFeatures" gap="sm" class="my-6" />

---

## Skeleton

Animated loading placeholder for development and loading states.

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string` | `'div'` | HTML element to render |
| `width` | `string` | - | CSS width value |
| `height` | `string` | - | CSS height value |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Border radius |
| `static` | `boolean` | `false` | Disable animation |

---

### Basic Skeletons

<div class="space-y-4 my-6">
  <Skeleton width="100%" height="20px" />
  <Skeleton width="80%" height="20px" />
  <Skeleton width="60%" height="20px" />
</div>

### Card Placeholder

<div class="p-4 border border-[--vp-c-divider] rounded-lg my-6">
  <div class="flex gap-4">
    <Skeleton width="80px" height="80px" rounded="lg" />
    <div class="flex-1 space-y-2">
      <Skeleton width="60%" height="24px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="40%" height="16px" />
    </div>
  </div>
</div>

### Different Rounded Styles

<div class="flex gap-4 my-6">
  <Skeleton width="60px" height="60px" rounded="none" />
  <Skeleton width="60px" height="60px" rounded="sm" />
  <Skeleton width="60px" height="60px" rounded="md" />
  <Skeleton width="60px" height="60px" rounded="lg" />
  <Skeleton width="60px" height="60px" rounded="full" />
</div>

### Static (No Animation)

<Skeleton width="200px" height="100px" :static="true" class="my-6" />

---

## Placeholder

Visual placeholder with diagonal line pattern. Inspired by Nuxt UI. Use for layout mockups and where content will be added.

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `string` | - | CSS width value |
| `height` | `string` | - | CSS height value |
| `aspectRatio` | `string` | - | CSS aspect-ratio (e.g., '16/9') |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'` | Border radius |
| `label` | `string` | - | Optional label text |

---

### Basic Placeholders

<div class="grid grid-cols-2 gap-4 my-6">
  <Placeholder height="150px" />
  <Placeholder height="150px" label="Image" />
</div>

### With Aspect Ratio

<div class="grid grid-cols-3 gap-4 my-6">
  <Placeholder aspectRatio="1/1" label="Square" />
  <Placeholder aspectRatio="4/3" label="4:3" />
  <Placeholder aspectRatio="16/9" label="16:9" />
</div>

### Different Rounded Styles

<div class="flex gap-4 my-6">
  <Placeholder width="100px" height="100px" rounded="none" />
  <Placeholder width="100px" height="100px" rounded="sm" />
  <Placeholder width="100px" height="100px" rounded="md" />
  <Placeholder width="100px" height="100px" rounded="lg" />
  <Placeholder width="100px" height="100px" rounded="xl" />
</div>

### In PageSection

<PageSection
  orientation="horizontal"
  title="Placeholder Example"
  description="The visual side uses a Placeholder component to show where content will go."
>
  <Placeholder height="250px" label="Video or Screenshot" />
</PageSection>

---

## Complete Example

A full-featured section combining multiple elements:

<PageSection
  variant="muted"
  orientation="horizontal"
  headline="Example"
  title="Complete Section Layout"
  description="This example shows all the features: headline, title, description, feature list, custom link, and a visual element."
>
  <template #body>
    <FeatureList
      :items="[
        { icon: FileCode, title: 'Body Slot', description: 'Content placed in the body slot' },
        { icon: CheckCircle, title: 'Custom Links', description: 'Using the links slot for custom buttons' },
        { icon: Zap, title: 'Visual Side', description: 'LogoMarquee in the default slot' }
      ]"
      gap="md"
    />
  </template>
  <template #links>
    <a href="#" class="inline-flex items-center gap-2 px-4 py-2 bg-[--vp-c-brand-1] text-white rounded-lg font-medium hover:bg-[--vp-c-brand-2] transition-colors">
      Call to Action <ArrowRight :size="16" />
    </a>
  </template>

  <LogoMarquee :items="ohdfFormats" :rows="4" :size="28" :duration="20" />
</PageSection>

<style>
/* Full-width layout */
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}
</style>
