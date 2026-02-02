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
    <div class="logo-container" :style="{ width: `${size}px`, height: `${size}px` }">
      <img
        v-if="item.image"
        :src="item.image"
        :alt="item.name"
        :width="size"
        :height="size"
        class="logo-image" :class="[{ 'logo-image--invert-dark': item.name.toLowerCase() === 'github' }]"
      >
      <BrandIcon
        v-else
        :name="item.iconName || item.name"
        :size="size"
      />
    </div>
    <slot />
  </component>
</template>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Invert GitHub logo in dark mode for visibility */
.dark .logo-image--invert-dark {
  filter: brightness(0) invert(1);
}
</style>
