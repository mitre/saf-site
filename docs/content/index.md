---
title: Content Library
layout: doc
aside: false
---

<script setup>
import { ref, computed } from 'vue'
import { data } from '../.vitepress/loaders/content.data'

const allItems = data.items

// Filter state
const selectedPillar = ref('all')
const selectedTarget = ref('all')
const selectedTech = ref('all')
const selectedVendor = ref('all')
const selectedStandard = ref('all')
const searchQuery = ref('')

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

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
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
  @update:pillar="selectedPillar = $event"
  @update:target="selectedTarget = $event"
  @update:technology="selectedTech = $event"
  @update:vendor="selectedVendor = $event"
  @update:standard="selectedStandard = $event"
  @update:search="searchQuery = $event"
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
