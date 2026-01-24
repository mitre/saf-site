<script setup lang="ts">
/**
 * FeatureItem - Icon + title + description feature block
 *
 * Inspired by Nuxt UI PageFeature. Use individually or within FeatureList.
 * Supports horizontal (icon left) and vertical (icon top) orientations.
 */
import { computed } from 'vue'

export interface FeatureItemProps {
  /** Lucide icon name */
  icon?: string
  /** Feature title */
  title: string
  /** Feature description */
  description?: string
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Link destination */
  href?: string
  /** Link target */
  target?: string
}

const props = withDefaults(defineProps<FeatureItemProps>(), {
  orientation: 'horizontal',
})

const isLink = computed(() => !!props.href)
const isExternal = computed(() => props.href?.startsWith('http'))
</script>

<template>
  <component
    :is="isLink ? 'a' : 'div'"
    :href="href"
    :target="isExternal ? '_blank' : target"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
    class="feature-item"
    :class="[
      `feature-item--${orientation}`,
      { 'feature-item--link': isLink },
    ]"
  >
    <div v-if="icon || $slots.icon" class="feature-item-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" class="feature-icon" />
      </slot>
    </div>

    <div class="feature-item-content">
      <div class="feature-item-title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div v-if="description || $slots.description" class="feature-item-description">
        <slot name="description">
          {{ description }}
        </slot>
      </div>
    </div>
  </component>
</template>

<style scoped>
.feature-item {
  display: flex;
  text-decoration: none;
  color: inherit;
}

.feature-item--horizontal {
  flex-direction: row;
  align-items: flex-start;
  gap: 0.75rem;
}

.feature-item--vertical {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.feature-item--link {
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.feature-item--link:hover {
  opacity: 0.8;
}

.feature-item-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--vp-c-brand-1);
}

.feature-item--vertical .feature-item-icon {
  width: 2.5rem;
  height: 2.5rem;
}

.feature-icon {
  width: 100%;
  height: 100%;
}

.feature-item-content {
  flex: 1;
  min-width: 0;
}

.feature-item-title {
  font-weight: 500;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.feature-item-description {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .feature-item--horizontal {
    gap: 1rem;
  }

  .feature-item-icon {
    width: 1.75rem;
    height: 1.75rem;
  }

  .feature-item--vertical .feature-item-icon {
    width: 3rem;
    height: 3rem;
  }

  .feature-item-title {
    font-size: 1rem;
  }
}
</style>
