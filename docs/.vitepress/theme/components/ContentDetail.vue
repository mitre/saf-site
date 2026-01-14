<template>
  <div class="content-detail">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <a :href="breadcrumbUrl">{{ breadcrumbLabel }}</a>
      <span class="separator">/</span>
      <span class="current">{{ content.name }}</span>
    </nav>

    <!-- Header Section -->
    <header class="content-header">
      <h1 class="content-title">{{ content.name }}</h1>

      <span v-if="benchmarkLabel" class="benchmark-version">
        {{ benchmarkLabel }}
      </span>

      <p class="content-description">{{ content.description }}</p>

      <!-- Metadata Tags -->
      <div class="content-tags">
        <span v-if="content.status" :class="['tag', `tag-${content.status}`]">
          {{ content.status }}
        </span>
        <span v-if="formattedProfileVersion" class="tag tag-version">
          Profile {{ formattedProfileVersion }}
        </span>
        <span v-if="content.control_count" class="tag tag-controls">
          {{ content.control_count }} controls
        </span>
      </div>
    </header>

    <!-- Action Buttons -->
    <div class="content-actions" v-if="actionUrls.length">
      <a
        v-for="action in actionUrls"
        :key="action.url"
        :href="action.url"
        target="_blank"
        :class="['action-btn', action.primary ? 'brand' : 'alt']"
      >
        {{ action.label }}
      </a>
    </div>

    <!-- Feature Cards -->
    <div class="content-features" v-if="featureCards.length">
      <article
        v-for="card in featureCards"
        :key="card.title"
        class="feature-card"
      >
        <div class="feature-icon">{{ card.icon }}</div>
        <h3 class="feature-title">{{ card.title }}</h3>
        <p :class="['feature-detail', card.title === 'STIG ID' ? 'mono' : '']">
          {{ card.value }}
        </p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentDetail, type ContentItem } from '../composables/useContentDetail'

const props = defineProps<{
  content: ContentItem
}>()

// Use composable for all logic
const {
  formattedProfileVersion,
  benchmarkLabel,
  actionUrls,
  featureCards,
  isValidation
} = useContentDetail(props.content)

// Breadcrumb configuration based on content type
const breadcrumbUrl = computed(() => {
  return isValidation.value ? '/validate/' : '/harden/'
})

const breadcrumbLabel = computed(() => {
  return isValidation.value ? 'Validate' : 'Harden'
})
</script>

<style scoped>
.content-detail {
  /* Uses parent doc layout width for consistency */
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 2rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.breadcrumb a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb .separator {
  margin: 0 0.5rem;
  color: var(--vp-c-text-3);
}

.breadcrumb .current {
  color: var(--vp-c-text-1);
}

/* Header */
.content-header {
  margin-bottom: 1.5rem;
}

.content-title {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-text-1);
}

.benchmark-version {
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

.tag-version {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
}

.content-description {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* Tags */
.content-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

.tag-controls {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

/* Action Buttons */
.content-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border-radius: 20px;
  transition: all 0.25s;
}

.action-btn.brand {
  background: var(--vp-c-brand-1);
  color: white;
  border: 1px solid var(--vp-c-brand-1);
}

.action-btn.brand:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.action-btn.alt {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-btn.alt:hover {
  border-color: var(--vp-c-text-2);
}

/* Feature Cards */
.content-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.feature-card {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-bg-soft);
  transition: border-color 0.25s;
}

.feature-card:hover {
  border-color: var(--vp-c-divider);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 24px;
  background: var(--vp-c-bg-elv);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.feature-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.feature-detail {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.feature-detail.mono {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .content-title {
    font-size: 1.75rem;
  }

  .content-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-features {
    grid-template-columns: 1fr;
  }
}
</style>
