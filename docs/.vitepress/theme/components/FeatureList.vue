<script setup lang="ts">
/**
 * FeatureList - Renders a list of FeatureItems
 *
 * Pass an array of feature objects or use the default slot for custom items.
 * Good for benefit lists, feature highlights, capability descriptions.
 */
import type { Component } from 'vue'
import FeatureItem from './FeatureItem.vue'

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

withDefaults(defineProps<FeatureListProps>(), {
  orientation: 'horizontal',
  gap: 'md',
  direction: 'column',
})
</script>

<template>
  <div
    class="feature-list"
    :class="[
      `feature-list--gap-${gap}`,
      `feature-list--${direction}`,
    ]"
  >
    <slot>
      <FeatureItem
        v-for="(item, index) in items"
        :key="index"
        :icon="item.icon"
        :title="item.title"
        :description="item.description"
        :href="item.href"
        :orientation="orientation"
      />
    </slot>
  </div>
</template>

<style scoped>
.feature-list {
  display: flex;
}

.feature-list--column {
  flex-direction: column;
}

.feature-list--row {
  flex-direction: row;
  flex-wrap: wrap;
}

/* Gap sizes */
.feature-list--gap-sm {
  gap: 0.5rem;
}

.feature-list--gap-md {
  gap: 1rem;
}

.feature-list--gap-lg {
  gap: 1.5rem;
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .feature-list--gap-sm {
    gap: 0.75rem;
  }

  .feature-list--gap-md {
    gap: 1.25rem;
  }

  .feature-list--gap-lg {
    gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .feature-list--gap-lg {
    gap: 2.5rem;
  }
}
</style>
