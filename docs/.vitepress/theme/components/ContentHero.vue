<template>
  <header class="content-hero">
    <!-- Title Row -->
    <div class="hero-title-row">
      <h1 class="hero-title">{{ title }}</h1>
      <PillarBadge v-if="pillar" :pillar="pillar" size="md" />
    </div>

    <!-- Description -->
    <p v-if="description" class="hero-description">{{ description }}</p>

    <!-- Action Buttons -->
    <ActionButtons
      v-if="actions.length"
      :actions="actions"
      size="md"
      layout="inline"
      class="hero-actions"
    />

    <!-- Metadata Card -->
    <div v-if="metadata.length" class="hero-metadata-card">
        <div class="metadata-list">
          <component
            :is="item.href ? 'a' : 'div'"
            v-for="item in metadata"
            :key="item.label"
            :href="item.href"
            class="metadata-item"
            :class="{ clickable: !!item.href }"
          >
            <span class="metadata-label">{{ item.label }}</span>
            <span class="metadata-value">
              <!-- Status indicator dot for Status field -->
              <span
                v-if="item.label === 'Status'"
                :class="['status-dot', `status-${item.value.toLowerCase()}`]"
              ></span>
              <!-- Icon for non-status fields -->
              <BrandIcon v-else :name="item.value" :size="28" />
              <span class="metadata-text">{{ item.value }}</span>
            </span>
          </component>
        </div>
      </div>
  </header>
</template>

<script setup lang="ts">
import PillarBadge, { type PillarType } from './PillarBadge.vue'
import ActionButtons, { type ActionItem } from './ActionButtons.vue'
import BrandIcon from './icons/BrandIcon.vue'
import type { MetadataItem } from '@/lib/metadata'

// Re-export for consumers
export type { MetadataItem }

defineProps<{
  title: string
  description?: string
  pillar?: PillarType
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

/* Description */
.hero-description {
  margin: 0 0 1.25rem;
  font-size: 1.0625rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* Actions */
.hero-actions {
  margin-bottom: 1.5rem;
}

/* Metadata Card */
.hero-metadata-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.25rem;
}

.metadata-list {
  display: grid;
  grid-template-columns: max-content max-content;
  gap: 1rem 3rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-decoration: none;
  color: inherit;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.metadata-item.clickable:hover {
  background: var(--vp-c-bg-elv);
}

.metadata-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--vp-c-text-3);
}

.metadata-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metadata-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

/* Status indicator dot */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-active { background: #10b981; }
.status-beta { background: #f59e0b; }
.status-deprecated { background: #ef4444; }
.status-draft { background: #6b7280; }

/* Responsive */
@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-title-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .metadata-list {
    grid-template-columns: 1fr;
  }
}
</style>
