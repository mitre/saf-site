---
title: Content Library
layout: doc
aside: false
---

<script setup>
import { ref, computed, onMounted } from 'vue'
import { data } from '../.vitepress/loaders/content.data'
import { inBrowser } from 'vitepress'
import { createFuzzyMatcher } from '../.vitepress/theme/composables/useFuzzySearch'

const allItems = data.items

// Create fuzzy matcher for search (handles "redhat" → "Red Hat" etc.)
const fuzzyMatch = createFuzzyMatcher(allItems)

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

// Computed filtered items
const filteredItems = computed(() => {
  let result = allItems

  // Filter by pillar (content_type)
  if (selectedPillar.value !== 'all') {
    const contentType = selectedPillar.value === 'validate' ? 'validation' : 'hardening'
    result = result.filter(item => item.content_type === contentType)
  }

  // Filter by target (what the content secures)
  if (selectedTarget.value !== 'all') {
    result = result.filter(item => item.target_name === selectedTarget.value)
  }

  // Filter by technology (InSpec, Ansible, etc.)
  if (selectedTech.value !== 'all') {
    result = result.filter(item => item.technology_name === selectedTech.value)
  }

  // Filter by vendor (who made it)
  if (selectedVendor.value !== 'all') {
    result = result.filter(item => item.vendor_name === selectedVendor.value)
  }

  // Filter by standard (STIG, CIS, etc.)
  if (selectedStandard.value !== 'all') {
    result = result.filter(item => item.standard_name === selectedStandard.value)
  }

  // Filter by search query using fuzzy matching
  // Handles variations like "redhat" → "Red Hat", "rhel" → "RHEL 8"
  if (searchQuery.value) {
    const matchingItems = fuzzyMatch(searchQuery.value)
    result = result.filter(item => matchingItems.has(item))
  }

  return result
})

// Stats for header
const validationCount = computed(() => allItems.filter(i => i.content_type === 'validation').length)
const hardeningCount = computed(() => allItems.filter(i => i.content_type === 'hardening').length)
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
