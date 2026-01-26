---
title: Content Library
layout: doc
aside: false
---

<script setup>
import { ref } from 'vue'
import { data } from '../.vitepress/loaders/content.data'
import { inBrowser } from 'vitepress'
import { useContentFiltering } from '../.vitepress/theme/composables/useContentFiltering'

const allItems = data.items

// Read URL query params (only in browser)
function getUrlParam(name) {
  if (!inBrowser) return null
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

// Filter state - initialize from URL params if present
const selectedPillar = ref(getUrlParam('pillar') || 'all')
const selectedTarget = ref(getUrlParam('target') || 'all')
const selectedTech = ref(getUrlParam('technology') || 'all')
const selectedVendor = ref(getUrlParam('vendor') || 'all')
const selectedStandard = ref(getUrlParam('standard') || 'all')
const searchQuery = ref(getUrlParam('search') || '')

// Use filtering composable
const { filteredItems, validationCount, hardeningCount } = useContentFiltering(allItems, {
  pillar: selectedPillar,
  target: selectedTarget,
  technology: selectedTech,
  vendor: selectedVendor,
  standard: selectedStandard,
  search: searchQuery,
})

// Clear all filters and URL params
function clearAllFilters() {
  selectedPillar.value = 'all'
  selectedTarget.value = 'all'
  selectedTech.value = 'all'
  selectedVendor.value = 'all'
  selectedStandard.value = 'all'
  searchQuery.value = ''
  // Clear URL params
  if (inBrowser) {
    window.history.replaceState({}, '', window.location.pathname)
  }
}
</script>

# Content Library

Security content for validation and hardening across platforms and compliance standards.

<div class="library-stats">
  <span class="stat">{{ allItems.length }} items</span>
  <span class="stat-divider">•</span>
  <span class="stat">{{ validationCount }} validation</span>
  <span class="stat-divider">•</span>
  <span class="stat">{{ hardeningCount }} hardening</span>
</div>

<ContentFilters
  :items="allItems"
  :initial-pillar="selectedPillar"
  :initial-target="selectedTarget"
  :initial-technology="selectedTech"
  :initial-vendor="selectedVendor"
  :initial-standard="selectedStandard"
  :initial-search="searchQuery"
  @update:pillar="selectedPillar = $event"
  @update:target="selectedTarget = $event"
  @update:technology="selectedTech = $event"
  @update:vendor="selectedVendor = $event"
  @update:standard="selectedStandard = $event"
  @update:search="searchQuery = $event"
  @clear="clearAllFilters"
/>

<div v-if="filteredItems.length > 0" class="results-count">
  Showing {{ filteredItems.length }} of {{ allItems.length }} items
</div>

<div v-if="filteredItems.length === 0" class="no-results">
  No content found matching your filters. Try adjusting your search criteria.
</div>

<div v-else class="content-grid">
  <ContentCard
    v-for="item in filteredItems"
    :key="item.id"
    :content="item"
  />
</div>

<style scoped>
.library-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: -0.5rem 0 1.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.stat-divider {
  color: var(--vp-c-text-3);
}

.results-count {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.no-results {
  margin: 2rem 0;
  padding: 2rem;
  text-align: center;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
