<script setup lang="ts">
import type { Component } from 'vue'

export interface ActionItem {
  label: string
  url: string
  primary?: boolean
  icon?: Component
}

defineProps<{
  actions: ActionItem[]
  size?: 'sm' | 'md' | 'lg'
  layout?: 'inline' | 'stack'
}>()
</script>

<template>
  <div v-if="actions.length" class="action-buttons" :class="[size, layout]">
    <a
      v-for="action in actions"
      :key="action.url"
      :href="action.url"
      target="_blank"
      rel="noopener noreferrer"
      class="action-btn"
      :class="{ primary: action.primary }"
    >
      <component :is="action.icon" v-if="action.icon" :size="16" class="btn-icon" />
      <span>{{ action.label }}</span>
    </a>
  </div>
</template>

<style scoped>
.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-buttons.stack {
  flex-direction: column;
  align-items: flex-start;
}

.action-buttons.inline {
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1.25rem;
  height: 40px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 20px;
  transition: all 0.15s ease;
  white-space: nowrap;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-btn:hover {
  border-color: var(--vp-c-text-2);
  background: var(--vp-c-bg-elv);
}

.action-btn.primary {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.action-btn.primary:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.btn-icon {
  flex-shrink: 0;
}

/* Size variants */
.action-buttons.sm .action-btn {
  height: 32px;
  padding: 0 1rem;
  font-size: 0.8125rem;
  border-radius: 16px;
}

.action-buttons.lg .action-btn {
  height: 48px;
  padding: 0 1.5rem;
  font-size: 1rem;
  border-radius: 24px;
}

/* Responsive */
@media (max-width: 480px) {
  .action-buttons:not(.inline) {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons:not(.inline) .action-btn {
    justify-content: center;
  }
}
</style>
