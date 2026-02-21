<script setup lang="ts">
import type { Component } from 'vue'
import { Download, FileText, Presentation, Video } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Link URL */
  href: string
  /** Card title */
  title: string
  /** Card description */
  description: string
  /** Icon type */
  icon?: 'document' | 'presentation' | 'video'
  /** Subtitle meta text */
  meta?: string
  /** Action text (e.g., "Download PDF") */
  action?: string
  /** Whether the link triggers a download */
  download?: boolean
  /** Whether the link is external */
  external?: boolean
  /** Card styling variant */
  variant?: 'default' | 'compact'
}>(), {
  variant: 'default',
  download: false,
  external: false,
})

const iconComponents: Record<string, Component> = {
  document: FileText,
  presentation: Presentation,
  video: Video,
}

const iconComponent = computed(() => props.icon ? iconComponents[props.icon] : null)
</script>

<template>
  <a
    :href="href"
    :download="download ? '' : undefined"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    class="media-card"
    :class="`media-card--${variant}`"
  >
    <template v-if="variant === 'default'">
      <div class="media-card-header">
        <component :is="iconComponent" v-if="iconComponent" :size="32" class="media-card-icon" />
        <div>
          <h3 class="media-card-title">{{ title }}</h3>
          <p v-if="meta" class="media-card-meta">{{ meta }}</p>
        </div>
      </div>
      <p class="media-card-description">{{ description }}</p>
      <div v-if="action" class="media-card-action">
        <Download v-if="download" :size="16" />
        <span>{{ action }}</span>
      </div>
    </template>
    <template v-else>
      <h3 class="media-card-title">{{ title }}</h3>
      <p class="media-card-description">{{ description }}</p>
    </template>
  </a>
</template>

<style scoped>
.media-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease;
}

.media-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dark .media-card {
  background-color: var(--vp-c-bg-soft);
}

.media-card--compact {
  padding: 1.25rem;
}

.media-card--compact:hover {
  box-shadow: none;
  transform: none;
}

.media-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.media-card-icon {
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.media-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  line-height: 1.3;
}

.media-card--compact .media-card-title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.media-card-meta {
  font-size: 0.8125rem;
  color: var(--vp-c-text-3);
  margin: 0.25rem 0 0;
}

.media-card-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0 0 1rem;
  flex: 1;
}

.media-card--compact .media-card-description {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.media-card-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  margin-top: auto;
}
</style>
