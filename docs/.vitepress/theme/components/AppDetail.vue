<script setup lang="ts">
import type { ToolItem } from '../../loaders/tools.data'
import { BookOpen, Github } from 'lucide-vue-next'
import { computed } from 'vue'
import AppDeploymentCard from './AppDeploymentCard.vue'
import AppFeatureSection from './AppFeatureSection.vue'
import AppResourceCard from './AppResourceCard.vue'
import BrandIcon from './icons/BrandIcon.vue'
import PillarIcon from './icons/PillarIcon.vue'
import PageSection from './PageSection.vue'
import { Button } from './ui/button'

interface Props {
  tool: ToolItem
}

const props = defineProps<Props>()

// Filter distributions to only show those marked as showOnPage
const visibleDistributions = computed(() => {
  return props.tool.distributions.filter(d => d.showOnPage)
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <PageSection
      orientation="vertical"
      headline="SAF Apps"
      :description="tool.longDescription || tool.description || ''"
    >
      <template #title>
        <span class="flex items-center gap-3">
          <BrandIcon v-if="tool.logo" :name="tool.slug" :size="40" />
          {{ tool.name }}
        </span>
      </template>

      <template #links>
        <div class="button-grid">
          <!-- Demo buttons -->
          <Button
            v-for="demo in tool.demos"
            :key="demo.url"
            as="a"
            :href="demo.url"
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            size="lg"
          >
            {{ demo.label }}
          </Button>

          <!-- GitHub -->
          <Button
            v-if="tool.github"
            as="a"
            :href="tool.github"
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            class="flex items-center gap-2 no-underline"
          >
            <Github :size="20" />
            View on GitHub
          </Button>

          <!-- Documentation -->
          <Button
            v-if="tool.documentationUrl"
            as="a"
            :href="tool.documentationUrl"
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            class="flex items-center gap-2 no-underline"
          >
            <BookOpen :size="20" />
            Documentation
          </Button>

          <!-- Primary capability link -->
          <Button
            v-if="tool.primaryCapability"
            as="a"
            :href="`/framework/${tool.primaryCapability.slug}`"
            variant="outline"
            size="lg"
            class="flex items-center gap-2 no-underline"
          >
            <PillarIcon :pillar="tool.primaryCapability.slug" :size="20" />
            {{ tool.primaryCapability.name }}
          </Button>
        </div>
      </template>
    </PageSection>

    <!-- Feature Sections -->
    <AppFeatureSection
      v-for="feature in tool.features"
      :key="feature.id"
      :feature="feature"
    />

    <!-- Deployment Options -->
    <PageSection
      v-if="visibleDistributions.length > 0"
      variant="muted"
      orientation="vertical"
      headline="Get Started"
      title="Deployment Options"
      description="Choose the deployment option that works best for your workflow."
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppDeploymentCard
          v-for="dist in visibleDistributions"
          :key="dist.id"
          :distribution="dist"
        />
      </div>
    </PageSection>

    <!-- Resources -->
    <PageSection
      v-if="tool.resources.length > 0"
      orientation="vertical"
      headline="Resources"
      :title="`Learn More About ${tool.name}`"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppResourceCard
          v-for="resource in tool.resources"
          :key="resource.id"
          :resource="resource"
        />
      </div>
    </PageSection>
  </div>
</template>

<style scoped>
.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
}

.button-grid > * {
  width: 100%;
  min-width: 0;
}

@media (min-width: 768px) {
  .button-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

.no-underline,
.no-underline:hover {
  text-decoration: none !important;
}
</style>
