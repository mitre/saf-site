<template>
  <div class="metadata-strip">
    <MetadataPill
      v-for="item in visibleItems"
      :key="item.label"
      :label="item.label"
      :value="item.value"
      :href="item.href"
      :truncate="truncateValues ? 25 : undefined"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MetadataPill from './MetadataPill.vue'
import type { MetadataItem } from '@/lib/metadata'

// Re-export for consumers
export type { MetadataItem }

const props = defineProps<{
  items: MetadataItem[]
  truncateValues?: boolean
}>()

// Filter out items with empty values
const visibleItems = computed(() =>
  props.items.filter(item => item.value && item.value.trim() !== '')
)
</script>

<style scoped>
.metadata-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 640px) {
  .metadata-strip {
    gap: 0.375rem;
  }
}
</style>
