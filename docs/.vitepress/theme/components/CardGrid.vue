<script setup lang="ts">
import type { VNode } from 'vue'
import { Comment, computed, Fragment, Text, useSlots } from 'vue'

withDefaults(defineProps<{
  /** Number of columns at tablet+ breakpoint */
  columns?: 2 | 3
}>(), {
  columns: 2,
})

const slots = useSlots()

// Each slotted card is wrapped in an <li> so the grid is exposed as a list to
// assistive tech (WCAG 1.3.1). The <li> uses `display: contents` (see styles),
// so the card itself remains the grid item and the layout is unchanged.
const items = computed<VNode[]>(() => {
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
    role="list" is intentional: the `list-style: none` needed for the grid layout
    makes Safari/VoiceOver drop the implicit list semantics, so it must be
    restated. The "redundancy" the linter flags is the actual accessibility fix.
  -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-redundant-roles -->
  <ul class="card-grid" :class="`card-grid--cols-${columns}`" role="list">
    <li v-for="(node, index) in items" :key="index" class="card-grid__item">
      <component :is="node" />
    </li>
  </ul>
</template>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* The <li> is a semantics-only wrapper; `display: contents` lets the card it
   contains act as the grid item directly, so the visual layout is identical to
   a plain grid of cards. */
.card-grid__item {
  display: contents;
}

@media (min-width: 640px) {
  .card-grid--cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-grid--cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
