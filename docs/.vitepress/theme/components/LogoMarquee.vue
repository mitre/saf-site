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
import { LogoItemRenderer, type LogoItem } from './logos'

// Re-export for consumers
export type { LogoItem }

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
  /** Vertical alignment within parent container */
  verticalAlign?: 'start' | 'center' | 'end'
}

const props = withDefaults(defineProps<LogoMarqueeProps>(), {
  duration: 30,
  pauseOnHover: true,
  reverse: false,
  size: 40,
  repeat: 2,
  overlay: true,
  rows: 1,
  alternateDirection: true,
  verticalAlign: 'center'
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
    :class="[
      `logo-marquee--valign-${verticalAlign}`,
      {
        'logo-marquee--pause-hover': pauseOnHover,
        'logo-marquee--overlay': overlay,
        'logo-marquee--multi-row': rows > 1
      }
    ]"
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
          <LogoItemRenderer
            v-for="item in rowItems"
            :key="`${rowIndex}-${i}-${item.name}`"
            :item="item"
            :size="size"
            tag="span"
            class="logo-marquee-item"
          />
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

/* Gradient fade at edges using mask-image
   This fades the CONTENT to transparent, so it works on ANY background color */
.logo-marquee--overlay {
  mask-image: linear-gradient(
    to right,
    transparent,
    black 40px,
    black calc(100% - 40px),
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 40px,
    black calc(100% - 40px),
    transparent
  );
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

  .logo-marquee--overlay {
    mask-image: linear-gradient(
      to right,
      transparent,
      black 60px,
      black calc(100% - 60px),
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black 60px,
      black calc(100% - 60px),
      transparent
    );
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

  .logo-marquee--overlay {
    mask-image: linear-gradient(
      to right,
      transparent,
      black 80px,
      black calc(100% - 80px),
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black 80px,
      black calc(100% - 80px),
      transparent
    );
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

  .logo-marquee--overlay {
    mask-image: linear-gradient(
      to right,
      transparent,
      black 100px,
      black calc(100% - 100px),
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black 100px,
      black calc(100% - 100px),
      transparent
    );
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .logo-marquee-track {
    animation: none;
  }
}

/* ===========================================
   VERTICAL ALIGNMENT
   For use within flex/grid parent containers
   =========================================== */

.logo-marquee--valign-start {
  align-self: flex-start;
}

.logo-marquee--valign-center {
  align-self: center;
}

.logo-marquee--valign-end {
  align-self: flex-end;
}
</style>
