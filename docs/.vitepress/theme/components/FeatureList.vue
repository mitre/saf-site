<script setup lang="ts">
/**
 * FeatureList - Renders a list of FeatureItems
 *
 * Pass an array of feature objects or use the default slot for custom items.
 * Good for benefit lists, feature highlights, capability descriptions.
 */
import type { Component, VNode } from 'vue'
import { Comment, computed, Fragment, Text, useSlots } from 'vue'
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

const slots = useSlots()

// Custom slot content (if provided), flattened and filtered so each real node
// can be wrapped in an <li> for list semantics (WCAG 1.3.1).
const slotItems = computed<VNode[]>(() => {
  const flatten = (nodes: VNode[]): VNode[] =>
    nodes.flatMap(node =>
      node.type === Fragment && Array.isArray(node.children)
        ? flatten(node.children as VNode[])
        : [node],
    )

  return flatten(slots.default?.() ?? []).filter(node =>
    node.type !== Comment
    && !(node.type === Text && !String(node.children).trim()),
  )
})
</script>

<template>
  <!--
    role="list" is intentional: the `list-style: none` needed for the flex layout
    makes Safari/VoiceOver drop the implicit list semantics, so it must be
    restated. The "redundancy" the linter flags is the actual accessibility fix.
  -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-redundant-roles -->
  <ul
    class="feature-list"
    :class="[
      `feature-list--gap-${gap}`,
      `feature-list--${direction}`,
    ]"
    role="list"
  >
    <template v-if="slotItems.length">
      <li v-for="(node, index) in slotItems" :key="index" class="feature-list__item">
        <component :is="node" />
      </li>
    </template>
    <template v-else>
      <li v-for="(item, index) in items" :key="index" class="feature-list__item">
        <FeatureItem
          :icon="item.icon"
          :title="item.title"
          :description="item.description"
          :href="item.href"
          :orientation="orientation"
        />
      </li>
    </template>
  </ul>
</template>

<style scoped>
.feature-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Semantics-only wrapper: `display: contents` lets each FeatureItem remain the
   flex item, so the list markup does not change the visual layout. */
.feature-list__item {
  display: contents;
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
