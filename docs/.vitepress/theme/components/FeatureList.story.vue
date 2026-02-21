<script setup lang="ts">
import { BarChart3, ClipboardList, Hammer, RefreshCw, Shield } from 'lucide-vue-next'
import FeatureList from './FeatureList.vue'

const features = [
  {
    icon: Shield,
    title: 'Security Validation',
    description: 'Automated security testing with InSpec profiles for STIGs, CIS Benchmarks, and custom requirements.',
  },
  {
    icon: Hammer,
    title: 'System Hardening',
    description: 'Infrastructure-as-code hardening with Ansible, Chef, and Terraform to implement security controls.',
  },
  {
    icon: BarChart3,
    title: 'Results Visualization',
    description: 'Interactive dashboards and reports with Heimdall for security posture insights.',
  },
]

const simpleFeatures = [
  {
    title: 'Fast and Repeatable',
    description: 'Automated tests run in seconds, providing instant feedback on security compliance.',
  },
  {
    title: 'Continuous Integration',
    description: 'Integrate security testing into CI/CD pipelines to catch issues early.',
  },
  {
    title: 'Standardized Results',
    description: 'Heimdall Data Format (HDF) enables consistent reporting across tools.',
  },
]

const linkedFeatures = [
  {
    icon: ClipboardList,
    title: 'Plan Your Security',
    description: 'Identify applicable security guidance and create documentation.',
    href: '/framework/plan',
  },
  {
    icon: Shield,
    title: 'Validate Compliance',
    description: 'Test systems against security requirements automatically.',
    href: '/framework/validate',
  },
  {
    icon: RefreshCw,
    title: 'Normalize Data',
    description: 'Convert security tool outputs to standardized format.',
    href: '/framework/normalize',
  },
]
</script>

<template>
  <Story title="Content/FeatureList">
    <Variant title="Horizontal with Icons">
      <FeatureList :items="features" orientation="horizontal" />
    </Variant>

    <Variant title="Vertical with Icons">
      <FeatureList :items="features" orientation="vertical" />
    </Variant>

    <Variant title="Without Icons">
      <FeatureList :items="simpleFeatures" orientation="horizontal" />
    </Variant>

    <Variant title="With Links">
      <FeatureList :items="linkedFeatures" orientation="horizontal" />
    </Variant>

    <Variant title="Custom Gap (large)">
      <FeatureList :items="features" gap="lg" />
    </Variant>

    <Variant title="Custom Gap (small)">
      <FeatureList :items="features" gap="sm" />
    </Variant>
  </Story>
</template>

<docs lang="md">
# FeatureList

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `-` | Array of feature items |
| `orientation` | `union` | `'horizontal'` | Layout orientation for all items |
| `gap` | `union` | `'md'` | Gap between items |
| `direction` | `union` | `'column'` | Stack direction |

## Slots

| Slot | Description |
|------|-------------|
| `default` |  |

## Types

```typescript
export interface FeatureItemData {
  /** Lucide icon component */
  icon?: Component
  /** Feature title */
  title: string
  /** Feature description */
  description?: string
  /** Link destination */
  href?: string
}

export interface FeatureListProps {
  /** Array of feature items */
  items?: FeatureItemData[]
  /** Layout orientation for all items */
  orientation?: 'horizontal' | 'vertical'
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg'
  /** Stack direction */
  direction?: 'column' | 'row'
}
```
</docs>
