<script setup lang="ts">
import { computed } from 'vue'
import BrandIcon from './icons/BrandIcon.vue'

const props = defineProps<{
  label: string
  value: string
  href?: string
  truncate?: number
}>()

const displayValue = computed(() => {
  if (!props.truncate || props.value.length <= props.truncate) {
    return props.value
  }
  return `${props.value.slice(0, props.truncate)}...`
})
</script>

<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    class="metadata-pill"
    :class="{ clickable: !!href }"
  >
    <!-- Icon via BrandIcon - single source of truth for all brand/logo icons -->
    <BrandIcon :name="value" :size="18" />

    <!-- Label and value -->
    <span class="pill-content">
      <span class="pill-label">{{ label }}</span>
      <span class="pill-value">{{ displayValue }}</span>
    </span>
  </component>
</template>

<style scoped>
.metadata-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 100px;
  font-size: 0.8125rem;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  white-space: nowrap;
}

.metadata-pill.clickable:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-elv);
}

.pill-content {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.pill-label {
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.pill-label::after {
  content: ':';
}

.pill-value {
  color: var(--vp-c-text-1);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
