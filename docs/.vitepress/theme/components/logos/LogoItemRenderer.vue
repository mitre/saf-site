<script setup lang="ts">
import type { LogoItem } from './types'
/**
 * Shared logo item renderer
 * Handles: custom image vs BrandIcon, link wrapping, accessibility
 */
import BrandIcon from '../icons/BrandIcon.vue'

const props = defineProps<{
  item: LogoItem
  size: number
  class?: string
  /** Element to use for non-link items (default: div) */
  tag?: string
}>()
</script>

<template>
  <component
    :is="item.href ? 'a' : (tag || 'div')"
    :href="item.href"
    :target="item.href?.startsWith('http') ? '_blank' : undefined"
    :rel="item.href?.startsWith('http') ? 'noopener noreferrer' : undefined"
    :title="item.description || item.name"
    :class="props.class"
  >
    <img
      v-if="item.image"
      :src="item.image"
      :alt="item.name"
      :width="size"
      :height="size"
      class="logo-image"
    >
    <BrandIcon
      v-else
      :name="item.name"
      :size="size"
    />
    <slot />
  </component>
</template>

<style scoped>
.logo-image {
  object-fit: contain;
}
</style>
