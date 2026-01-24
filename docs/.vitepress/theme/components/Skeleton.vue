<script setup lang="ts">
/**
 * Skeleton - Animated loading placeholder
 *
 * Use for loading states and layout placeholders during development.
 * Includes proper accessibility attributes for screen readers.
 */

export interface SkeletonProps {
  /** Render as different element */
  as?: string
  /** Width (CSS value) */
  width?: string
  /** Height (CSS value) */
  height?: string
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  /** Disable animation */
  static?: boolean
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  as: 'div',
  rounded: 'md',
  static: false
})

const style = {
  width: props.width,
  height: props.height
}
</script>

<template>
  <component
    :is="as"
    aria-busy="true"
    aria-label="Loading"
    aria-live="polite"
    role="status"
    class="skeleton"
    :class="[
      `skeleton--rounded-${rounded}`,
      { 'skeleton--static': static }
    ]"
    :style="style"
  >
    <slot />
  </component>
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--vp-c-bg-soft) 25%,
    var(--vp-c-bg-elv) 50%,
    var(--vp-c-bg-soft) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.skeleton--static {
  animation: none;
  background: var(--vp-c-bg-soft);
}

.skeleton--rounded-none {
  border-radius: 0;
}

.skeleton--rounded-sm {
  border-radius: 4px;
}

.skeleton--rounded-md {
  border-radius: 8px;
}

.skeleton--rounded-lg {
  border-radius: 12px;
}

.skeleton--rounded-full {
  border-radius: 9999px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--vp-c-bg-soft);
  }
}
</style>
