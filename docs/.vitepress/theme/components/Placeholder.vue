<script setup lang="ts">
/**
 * Placeholder - Visual placeholder with diagonal line pattern
 *
 * Inspired by Nuxt UI. Use for visual placeholders in layouts,
 * mockups, and documentation. Shows where content will go.
 */
import { computed } from 'vue'

export interface PlaceholderProps {
  /** Width (CSS value) */
  width?: string
  /** Height (CSS value) */
  height?: string
  /** Aspect ratio (e.g., '16/9', '4/3', '1/1') */
  aspectRatio?: string
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Show label text */
  label?: string
}

const props = withDefaults(defineProps<PlaceholderProps>(), {
  rounded: 'lg'
})

// Generate unique ID for pattern to avoid conflicts
const patternId = computed(() => `placeholder-pattern-${Math.random().toString(36).slice(2, 11)}`)

const style = computed(() => ({
  width: props.width,
  height: props.height,
  aspectRatio: props.aspectRatio
}))
</script>

<template>
  <div
    class="placeholder"
    :class="[`placeholder--rounded-${rounded}`]"
    :style="style"
  >
    <svg class="placeholder-pattern" fill="none">
      <defs>
        <pattern
          :id="patternId"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3" />
        </pattern>
      </defs>
      <rect
        stroke="none"
        :fill="`url(#${patternId})`"
        width="100%"
        height="100%"
      />
    </svg>

    <span v-if="label" class="placeholder-label">{{ label }}</span>
    <slot />
  </div>
</template>

<style scoped>
.placeholder {
  position: relative;
  overflow: hidden;
  border: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.placeholder-pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  stroke: var(--vp-c-text-3);
  opacity: 0.15;
}

.placeholder-label {
  position: relative;
  z-index: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Border radius variants */
.placeholder--rounded-none {
  border-radius: 0;
}

.placeholder--rounded-sm {
  border-radius: 4px;
}

.placeholder--rounded-md {
  border-radius: 8px;
}

.placeholder--rounded-lg {
  border-radius: 12px;
}

.placeholder--rounded-xl {
  border-radius: 16px;
}

.placeholder--rounded-full {
  border-radius: 9999px;
}
</style>
