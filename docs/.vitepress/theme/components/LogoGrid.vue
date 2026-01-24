<script setup lang="ts">
/**
 * LogoGrid - Display partner/sponsor logos in a responsive grid
 *
 * Use cases:
 * - Partners page (Oracle, GitHub, AWS, etc.)
 * - Project partners (Navy, Army, etc.)
 * - Normalization tool integrations
 */
import BrandIcon from './icons/BrandIcon.vue'

export interface LogoItem {
  /** Display name (used for BrandIcon lookup and alt text) */
  name: string
  /** Optional URL to link to */
  href?: string
  /** Optional custom image URL (overrides BrandIcon) */
  image?: string
  /** Optional description shown on hover */
  description?: string
}

export interface LogoGridProps {
  /** Array of logo items to display */
  items: LogoItem[]
  /** Optional section title */
  title?: string
  /** Logo size in pixels */
  size?: number
  /** Show name labels below logos */
  showNames?: boolean
  /** Grid columns (auto-fit by default) */
  columns?: number
  /** Variant styling */
  variant?: 'default' | 'compact' | 'card'
}

const props = withDefaults(defineProps<LogoGridProps>(), {
  size: 48,
  showNames: false,
  variant: 'default'
})
</script>

<template>
  <div class="logo-grid" :class="[`logo-grid--${variant}`]">
    <h3 v-if="title" class="logo-grid-title">{{ title }}</h3>

    <div
      class="logo-grid-items"
      :style="columns ? `grid-template-columns: repeat(${columns}, 1fr)` : undefined"
    >
      <component
        :is="item.href ? 'a' : 'div'"
        v-for="item in items"
        :key="item.name"
        :href="item.href"
        :target="item.href?.startsWith('http') ? '_blank' : undefined"
        :rel="item.href?.startsWith('http') ? 'noopener noreferrer' : undefined"
        class="logo-item"
        :title="item.description || item.name"
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
        <span v-if="showNames" class="logo-name">{{ item.name }}</span>
      </component>
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

/* Mobile: 3-4 columns, tight spacing */
.logo-grid-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.75rem;
  align-items: center;
  justify-items: center;
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

/* Tablet: larger items, more spacing */
@media (min-width: 640px) {
  .logo-grid {
    margin: 1.25rem 0;
  }

  .logo-grid-title {
    font-size: 1.05rem;
    margin-bottom: 1rem;
  }

  .logo-grid-items {
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
    gap: 1rem;
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

/* Desktop: full spacing, hover effects */
@media (min-width: 1024px) {
  .logo-grid {
    margin: 1.5rem 0;
  }

  .logo-grid-title {
    font-size: 1.1rem;
  }

  .logo-grid-items {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 1.5rem;
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
</style>
