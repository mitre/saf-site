<script setup lang="ts">
import type { ToolResource } from '../../database/schema'
import { BookOpen, Github } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  resource: ToolResource
}

const props = defineProps<Props>()

// Map icon types to components
const iconMap: Record<string, any> = {
  'github': Github,
  'book-open': BookOpen,
}

const IconComponent = computed(() => {
  return props.resource.iconType ? iconMap[props.resource.iconType] : BookOpen
})
</script>

<template>
  <a
    :href="resource.url"
    target="_blank"
    rel="noopener noreferrer"
    class="resource-card"
  >
    <div class="card-header">
      <component :is="IconComponent" :size="32" />
      <h3>{{ resource.title }}</h3>
    </div>
    <p class="card-description">
      {{ resource.description }}
    </p>
  </a>
</template>

<style scoped>
.resource-card {
  display: block;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  transition: border-color 0.2s ease;
  cursor: pointer;
}

.resource-card:hover {
  border-color: var(--vp-c-brand-1);
}

.card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-header h3 {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  color: var(--vp-c-text-1) !important;
  line-height: 1 !important;
}

.card-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2) !important;
  margin: 0;
}

.dark .resource-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
