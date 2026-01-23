<template>
  <header class="content-hero">
    <!-- Title Row -->
    <div class="hero-title-row">
      <h1 class="hero-title">{{ title }}</h1>
      <PillarBadge v-if="pillar" :pillar="pillar" size="md" />
    </div>

    <!-- Benchmark Version -->
    <span v-if="benchmarkLabel" class="hero-benchmark">
      {{ benchmarkLabel }}
    </span>

    <!-- Description -->
    <p v-if="description" class="hero-description">{{ description }}</p>

    <!-- Status Tags -->
    <div class="hero-tags">
      <span v-if="status" :class="['tag', `tag-${status}`]">
        {{ status }}
      </span>
      <span v-if="version" class="tag tag-version">
        Profile {{ version }}
      </span>
      <span v-if="controlCount" class="tag tag-controls">
        {{ controlCount }} controls
      </span>
    </div>

    <!-- Action Buttons -->
    <ActionButtons
      v-if="actions.length"
      :actions="actions"
      size="md"
      layout="inline"
      class="hero-actions"
    />

    <!-- Metadata Strip -->
    <MetadataStrip
      v-if="metadata.length"
      :items="metadata"
      :truncate-values="true"
      class="hero-metadata"
    />
  </header>
</template>

<script setup lang="ts">
import PillarBadge, { type PillarType } from './PillarBadge.vue'
import ActionButtons, { type ActionItem } from './ActionButtons.vue'
import MetadataStrip, { type MetadataItem } from './MetadataStrip.vue'

defineProps<{
  title: string
  description?: string
  pillar?: PillarType
  benchmarkLabel?: string
  status?: string
  version?: string
  controlCount?: number
  actions: ActionItem[]
  metadata: MetadataItem[]
}>()
</script>

<style scoped>
.content-hero {
  margin-bottom: 2rem;
}

/* Title Row */
.hero-title-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.hero-title {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-text-1);
}

/* Benchmark Badge */
.hero-benchmark {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

/* Description */
.hero-description {
  margin: 0 0 1rem;
  font-size: 1.0625rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* Tags */
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tag-active { background: #10b981; color: white; }
.tag-beta { background: #f59e0b; color: white; }
.tag-deprecated { background: #ef4444; color: white; }
.tag-draft { background: #6b7280; color: white; }

.tag-version {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
}

.tag-controls {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

/* Actions */
.hero-actions {
  margin-bottom: 1.5rem;
}

/* Metadata Strip */
.hero-metadata {
  padding-top: 1.25rem;
  border-top: 1px solid var(--vp-c-divider);
}

/* Responsive */
@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-title-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
