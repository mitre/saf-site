---
title: Validation Profiles
layout: doc
aside: false
---

<script setup>
import { ref, computed } from 'vue'
import { data } from '../.vitepress/loaders/profiles.data'

const allProfiles = data.profiles

// Filter state
const selectedCategory = ref('all')
const selectedTech = ref('all')
const selectedPlatform = ref('all')
const selectedVendor = ref('all')
const selectedStandard = ref('all')
const searchQuery = ref('')

// Computed filtered profiles
const filteredProfiles = computed(() => {
  let result = allProfiles

  // Filter by category
  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category === selectedCategory.value)
  }

  // Filter by technology (match against technology_name for display)
  if (selectedTech.value !== 'all') {
    result = result.filter(p => {
      const techName = p.technology_name || p.technology
      return techName === selectedTech.value
    })
  }

  // Filter by platform
  if (selectedPlatform.value !== 'all') {
    result = result.filter(p => p.platform === selectedPlatform.value)
  }

  // Filter by vendor
  if (selectedVendor.value !== 'all') {
    result = result.filter(p => p.vendor === selectedVendor.value)
  }

  // Filter by standard
  if (selectedStandard.value !== 'all') {
    result = result.filter(p => p.standard_name === selectedStandard.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }

  return result
})
</script>

# Validation Profiles

InSpec validation profiles for security compliance testing across various platforms and standards.

<ProfileFilters
  :profiles="allProfiles"
  @update:category="selectedCategory = $event"
  @update:technology="selectedTech = $event"
  @update:platform="selectedPlatform = $event"
  @update:vendor="selectedVendor = $event"
  @update:standard="selectedStandard = $event"
  @update:search="searchQuery = $event"
/>

<div v-if="filteredProfiles.length > 0" class="results-count">
  Showing {{ filteredProfiles.length }} of {{ allProfiles.length }} profiles
</div>

<div v-if="filteredProfiles.length === 0" class="no-results">
  No profiles found matching your filters. Try adjusting your search criteria.
</div>

<div v-else class="profile-grid">
  <ProfileCard
    v-for="profile in filteredProfiles"
    :key="profile.id"
    :profile="profile"
  />
</div>

<style scoped>
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

.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

@media (max-width: 1200px) {
  .profile-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
