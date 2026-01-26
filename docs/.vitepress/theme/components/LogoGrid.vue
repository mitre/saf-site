<script setup lang="ts">
import type { LogoItem } from './logos'
/**
 * @component LogoGrid - Display partner/sponsor logos in a responsive grid.
 * Supports multiple variants (default, compact, card), layouts (grid, row),
 * and automatic logo resolution via SimpleIcons or custom icons.
 *
 * @example Basic usage with auto-resolved logos
 * <LogoGrid
 *   :items="[
 *     { name: 'AWS', href: 'https://aws.amazon.com' },
 *     { name: 'GitHub', href: 'https://github.com' },
 *     { name: 'Red Hat', href: 'https://redhat.com' }
 *   ]"
 *   :showNames="true"
 * />
 *
 * @example Card variant for partners section
 * <LogoGrid
 *   :items="partners"
 *   variant="card"
 *   :showNames="true"
 *   :size="64"
 * />
 *
 * @example Horizontal scrolling row
 * <LogoGrid
 *   :items="tools"
 *   layout="row"
 *   :size="32"
 * />
 */
import { LogoItemRenderer } from './logos'

// Re-export for consumers
export type { LogoItem }

export interface LogoGridProps {
  /** Array of logo items to display */
  items: LogoItem[]
  /** Optional section title */
  title?: string
  /** Logo size in pixels */
  size?: number
  /** Show name labels below logos */
  showNames?: boolean
  /** Fixed columns override (uses responsive defaults if not set) */
  columns?: number
  /** Variant styling */
  variant?: 'default' | 'compact' | 'card'
  /** Use fluid auto-fit instead of fixed responsive columns */
  fluid?: boolean
  /** Layout mode: grid (default) or row (horizontal scrolling single row) */
  layout?: 'grid' | 'row'
  /** Override layout on mobile (useful for row on mobile, grid on desktop) */
  mobileLayout?: 'grid' | 'row'
  /** Horizontal alignment of items within container */
  align?: 'start' | 'center' | 'end'
  /** Justify content for row layout */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}

withDefaults(defineProps<LogoGridProps>(), {
  size: 48,
  showNames: false,
  variant: 'default',
  fluid: false,
  layout: 'grid',
  align: 'center',
  justify: 'start',
})
</script>

<template>
  <div
    class="logo-grid" :class="[
      `logo-grid--${variant}`,
      `logo-grid--${layout}`,
      `logo-grid--align-${align}`,
      `logo-grid--justify-${justify}`,
      { 'logo-grid--fluid': fluid },
      mobileLayout ? `logo-grid--mobile-${mobileLayout}` : '',
    ]"
  >
    <h3 v-if="title" class="logo-grid-title">
      {{ title }}
    </h3>

    <div
      class="logo-grid-items"
      :style="columns && layout === 'grid' ? `grid-template-columns: repeat(${columns}, 1fr)` : undefined"
    >
      <LogoItemRenderer
        v-for="item in items"
        :key="item.name"
        :item="item"
        :size="size"
        class="logo-item"
      >
        <span v-if="showNames" class="logo-name">{{ item.name }}</span>
      </LogoItemRenderer>
    </div>
  </div>
</template>

<style scoped>
/* ===========================================
   MOBILE-FIRST RESPONSIVE STYLES
   Base styles are mobile, min-width for larger
   =========================================== */

.logo-grid {
  margin: 1rem 0;
}

.logo-grid-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

/* Mobile: 1 column (clean stacked layout) */
.logo-grid-items {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  align-items: center;
  justify-items: center;
}

/* Fluid mode: auto-fit instead of fixed */
.logo-grid--fluid .logo-grid-items {
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
}

.logo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.logo-item:hover {
  background: var(--vp-c-bg-soft);
}

.logo-item[href]:hover {
  cursor: pointer;
}

.logo-image {
  object-fit: contain;
}

.logo-name {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-align: center;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Compact variant */
.logo-grid--compact .logo-grid-items {
  gap: 0.5rem;
}

.logo-grid--compact .logo-item {
  padding: 0.25rem;
}

.logo-grid--compact .logo-item:hover {
  background: transparent;
  transform: none;
}

/* Card variant */
.logo-grid--card .logo-item {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 0.75rem;
}

.logo-grid--card .logo-item:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Tablet: 3 columns fixed */
@media (min-width: 640px) {
  .logo-grid {
    margin: 1.25rem 0;
  }

  .logo-grid-title {
    font-size: 1.05rem;
    margin-bottom: 1rem;
  }

  .logo-grid-items {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .logo-grid--fluid .logo-grid-items {
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  }

  .logo-item {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .logo-name {
    font-size: 0.75rem;
    max-width: 85px;
  }

  .logo-grid--card .logo-item {
    padding: 1rem;
  }
}

/* Desktop: 4 columns fixed */
@media (min-width: 1024px) {
  .logo-grid {
    margin: 1.5rem 0;
  }

  .logo-grid-title {
    font-size: 1.1rem;
  }

  .logo-grid-items {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }

  .logo-grid--fluid .logo-grid-items {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }

  .logo-item {
    padding: 1rem;
    border-radius: 8px;
  }

  .logo-item:hover {
    transform: translateY(-2px);
  }

  .logo-name {
    max-width: 100px;
  }

  .logo-grid--compact .logo-grid-items {
    gap: 1rem;
  }

  .logo-grid--compact .logo-item {
    padding: 0.5rem;
  }

  .logo-grid--card .logo-item {
    padding: 1.25rem;
  }

  .logo-grid--card .logo-item:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

/* ===========================================
   ROW LAYOUT: Horizontal scrolling single row
   =========================================== */

.logo-grid--row .logo-grid-items {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 1rem;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.logo-grid--row .logo-item {
  flex-shrink: 0;
  scroll-snap-align: start;
}

/* Hide scrollbar but keep functionality */
.logo-grid--row .logo-grid-items::-webkit-scrollbar {
  height: 4px;
}

.logo-grid--row .logo-grid-items::-webkit-scrollbar-track {
  background: var(--vp-c-bg-soft);
  border-radius: 2px;
}

.logo-grid--row .logo-grid-items::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 2px;
}

.logo-grid--row .logo-grid-items::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}

@media (min-width: 640px) {
  .logo-grid--row .logo-grid-items {
    gap: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .logo-grid--row .logo-grid-items {
    gap: 1.5rem;
  }
}

/* ===========================================
   MOBILE LAYOUT OVERRIDE
   Switch layout only on mobile (<640px)
   =========================================== */

/* Mobile row override: use row layout on mobile only */
@media (max-width: 639px) {
  .logo-grid--mobile-row .logo-grid-items {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 1rem;
    padding-bottom: 0.5rem;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  .logo-grid--mobile-row .logo-item {
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  .logo-grid--mobile-row .logo-grid-items::-webkit-scrollbar {
    height: 4px;
  }

  .logo-grid--mobile-row .logo-grid-items::-webkit-scrollbar-track {
    background: var(--vp-c-bg-soft);
    border-radius: 2px;
  }

  .logo-grid--mobile-row .logo-grid-items::-webkit-scrollbar-thumb {
    background: var(--vp-c-divider);
    border-radius: 2px;
  }
}

/* Mobile grid override: use grid layout on mobile only */
@media (max-width: 639px) {
  .logo-grid--mobile-grid.logo-grid--row .logo-grid-items {
    display: grid;
    grid-template-columns: 1fr;
    flex-wrap: unset;
    overflow-x: visible;
    scroll-snap-type: none;
  }

  .logo-grid--mobile-grid.logo-grid--row .logo-item {
    flex-shrink: unset;
    scroll-snap-align: unset;
  }
}

/* ===========================================
   ALIGNMENT UTILITIES
   =========================================== */

/* Grid alignment (justify-items for grid) */
.logo-grid--align-start .logo-grid-items {
  justify-items: start;
}

.logo-grid--align-center .logo-grid-items {
  justify-items: center;
}

.logo-grid--align-end .logo-grid-items {
  justify-items: end;
}

/* Row layout justify-content */
.logo-grid--row.logo-grid--justify-start .logo-grid-items {
  justify-content: flex-start;
}

.logo-grid--row.logo-grid--justify-center .logo-grid-items {
  justify-content: center;
}

.logo-grid--row.logo-grid--justify-end .logo-grid-items {
  justify-content: flex-end;
}

.logo-grid--row.logo-grid--justify-between .logo-grid-items {
  justify-content: space-between;
}

.logo-grid--row.logo-grid--justify-around .logo-grid-items {
  justify-content: space-around;
}
</style>
