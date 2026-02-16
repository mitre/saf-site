<script setup lang="ts">
import type { ToolFeature } from '../../database/schema'
import PageSection from './PageSection.vue'

interface Props {
  feature: ToolFeature
}

defineProps<Props>()
</script>

<template>
  <PageSection
    :orientation="feature.orientation || 'horizontal'"
    :variant="feature.variant || 'default'"
    :reverse="!!feature.reverse"
    :headline="feature.headline"
    :title="feature.title"
    :description="feature.description || ''"
  >
    <img
      v-if="feature.image"
      :src="feature.image"
      :alt="feature.imageAlt || feature.title"
      class="screenshot"
    >
  </PageSection>
</template>

<style scoped>
.screenshot {
  width: 100%;
  height: auto;
}
</style>
