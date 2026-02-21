<script setup lang="ts">
import type { ToolDistribution } from '../../loaders/tools.data'
import { computed } from 'vue'
import BrandIcon from './icons/BrandIcon.vue'

interface Props {
  distribution: ToolDistribution
}

const props = defineProps<Props>()

// Map distribution type slug to BrandIcon name
const distTypeIconMap: Record<string, string> = {
  docker_image: 'docker',
  npm_package: 'npm',
  ruby_gem: 'rubygems',
  helm_chart: 'helm',
  pypi_package: 'pypi',
  github_release: 'github',
}

// Determine icon to use (override, then dist type mapping)
const iconName = computed(() => {
  if (props.distribution.iconOverride)
    return props.distribution.iconOverride
  return distTypeIconMap[props.distribution.distributionType?.slug || ''] || ''
})

// Display name (override or use name)
const displayName = computed(() => {
  return props.distribution.displayName || props.distribution.name
})
</script>

<template>
  <div class="deployment-card">
    <div class="card-header">
      <BrandIcon v-if="iconName" :name="iconName" :size="32" />
      <h3>{{ displayName }}</h3>
    </div>
    <p
      v-if="distribution.deploymentDescription || distribution.description"
      class="text-sm text-[--vp-c-text-2] mb-4"
    >
      {{ distribution.deploymentDescription || distribution.description }}
    </p>
    <div
      v-if="distribution.links && distribution.links.length > 0"
      class="flex flex-wrap gap-3"
    >
      <a
        v-for="link in distribution.links"
        :key="link.href"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-[--vp-c-brand-1] hover:underline"
      >
        {{ link.label }} →
      </a>
    </div>
  </div>
</template>

<style scoped>
.deployment-card {
  display: block;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  transition: border-color 0.2s ease;
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

.dark .deployment-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
