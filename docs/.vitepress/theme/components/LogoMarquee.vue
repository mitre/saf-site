<script setup lang="ts">
/**
 * LogoMarquee - Animated scrolling logo display
 *
 * Creates an infinite horizontal scroll of logos.
 * Good for partner/sponsor sections that need visual interest.
 *
 * For large sets (35+ items), use the `rows` prop to split into multiple
 * rows with alternating scroll directions.
 */
import { computed } from 'vue'
import BrandIcon from './icons/BrandIcon.vue'

export interface LogoItem {
  name: string
  href?: string
  image?: string
}

export interface LogoMarqueeProps {
  items: LogoItem[]
  /** Animation duration in seconds */
  duration?: number
  /** Pause animation on hover */
  pauseOnHover?: boolean
  /** Reverse scroll direction (first row if using rows) */
  reverse?: boolean
  /** Logo size in pixels */
  size?: number
  /** Number of times to repeat items (for seamless loop) */
  repeat?: number
  /** Show gradient overlay at edges */
  overlay?: boolean
  /** Number of rows to split items into (alternates direction) */
  rows?: number
  /** Alternate scroll direction per row */
  alternateDirection?: boolean
}

const props = withDefaults(defineProps<LogoMarqueeProps>(), {
  duration: 30,
  pauseOnHover: true,
  reverse: false,
  size: 40,
  repeat: 2,
  overlay: true,
  rows: 1,
  alternateDirection: true
})

// Split items into rows
const itemRows = computed(() => {
  if (props.rows <= 1) {
    return [props.items]
  }

  const rowCount = props.rows
  const itemsPerRow = Math.ceil(props.items.length / rowCount)
  const rows: LogoItem[][] = []

  for (let i = 0; i < rowCount; i++) {
    const start = i * itemsPerRow
    const end = start + itemsPerRow
    const rowItems = props.items.slice(start, end)
    if (rowItems.length > 0) {
      rows.push(rowItems)
    }
  }

  return rows
})

// Determine if a row should be reversed
const isRowReversed = (rowIndex: number): boolean => {
  if (!props.alternateDirection) {
    return props.reverse
  }
  // Alternate: even rows follow `reverse` prop, odd rows are opposite
  return rowIndex % 2 === 0 ? props.reverse : !props.reverse
}
</script>

<template>
  <div
    class="logo-marquee-container"
    :class="{
      'logo-marquee--pause-hover': pauseOnHover,
      'logo-marquee--overlay': overlay,
      'logo-marquee--multi-row': rows > 1
    }"
  >
    <!-- Each row -->
    <div
      v-for="(rowItems, rowIndex) in itemRows"
      :key="rowIndex"
      class="logo-marquee"
      :class="{ 'logo-marquee--reverse': isRowReversed(rowIndex) }"
      :style="{ '--marquee-duration': `${duration}s` }"
    >
      <div class="logo-marquee-track">
        <!-- Repeat content for seamless loop -->
        <div
          v-for="i in repeat"
          :key="i"
          class="logo-marquee-content"
        >
          <component
            :is="item.href ? 'a' : 'span'"
            v-for="item in rowItems"
            :key="`${rowIndex}-${i}-${item.name}`"
            :href="item.href"
            :target="item.href?.startsWith('http') ? '_blank' : undefined"
            :rel="item.href?.startsWith('http') ? 'noopener noreferrer' : undefined"
            class="logo-marquee-item"
            :title="item.name"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
              :width="size"
              :height="size"
              class="logo-image"
            />
            <BrandIcon
              v-else
              :name="item.name"
              :size="size"
            />
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===========================================
   MOBILE-FIRST RESPONSIVE STYLES
   Base styles are mobile, min-width for larger
   =========================================== */

.logo-marquee-container {
  position: relative;
}

/* Mobile: compact, tight spacing */
.logo-marquee {
  overflow: hidden;
  padding: 0.5rem 0;
}

.logo-marquee-container:not(.logo-marquee--multi-row) .logo-marquee {
  padding: 0.625rem 0;
}

.logo-marquee-track {
  display: flex;
  width: max-content;
  animation: marquee var(--marquee-duration, 30s) linear infinite;
}

.logo-marquee--reverse .logo-marquee-track {
  animation-direction: reverse;
}

.logo-marquee--pause-hover:hover .logo-marquee-track {
  animation-play-state: paused;
}

.logo-marquee-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 0.75rem;
}

.logo-marquee-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.logo-marquee-item:hover {
  opacity: 1;
}

.logo-image {
  object-fit: contain;
}

/* Gradient overlay - smaller on mobile */
.logo-marquee--overlay::before,
.logo-marquee--overlay::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  z-index: 1;
  pointer-events: none;
}

.logo-marquee--overlay::before {
  left: 0;
  background: linear-gradient(to right, var(--vp-c-bg), transparent);
}

.logo-marquee--overlay::after {
  right: 0;
  background: linear-gradient(to left, var(--vp-c-bg), transparent);
}

/* Multi-row - tight on mobile */
.logo-marquee--multi-row {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* Tablet: medium spacing */
@media (min-width: 640px) {
  .logo-marquee {
    padding: 0.625rem 0;
  }

  .logo-marquee-container:not(.logo-marquee--multi-row) .logo-marquee {
    padding: 0.75rem 0;
  }

  .logo-marquee-content {
    gap: 2rem;
    padding: 0 1rem;
  }

  .logo-marquee--overlay::before,
  .logo-marquee--overlay::after {
    width: 60px;
  }

  .logo-marquee--multi-row {
    gap: 0.1875rem;
  }
}

/* Small desktop: comfortable spacing */
@media (min-width: 768px) {
  .logo-marquee {
    padding: 0.75rem 0;
  }

  .logo-marquee-container:not(.logo-marquee--multi-row) .logo-marquee {
    padding: 0.875rem 0;
  }

  .logo-marquee-content {
    gap: 2.5rem;
    padding: 0 1.25rem;
  }

  .logo-marquee--overlay::before,
  .logo-marquee--overlay::after {
    width: 80px;
  }

  .logo-marquee--multi-row {
    gap: 0.25rem;
  }
}

/* Desktop: full spacing */
@media (min-width: 1024px) {
  .logo-marquee-container:not(.logo-marquee--multi-row) .logo-marquee {
    padding: 1rem 0;
  }

  .logo-marquee-content {
    gap: 3rem;
    padding: 0 1.5rem;
  }

  .logo-marquee--overlay::before,
  .logo-marquee--overlay::after {
    width: 100px;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .logo-marquee-track {
    animation: none;
  }
}
</style>
