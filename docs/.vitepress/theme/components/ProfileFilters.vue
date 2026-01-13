<template>
  <div class="profile-filters">
    <div class="filter-group">
      <!-- Category Filter -->
      <div class="filter-item">
        <label class="filter-label">Category</label>
        <SelectRoot v-model="selectedCategory">
          <SelectTrigger class="select-trigger" aria-label="Select category">
            <SelectValue placeholder="All Categories" />
            <SelectIcon class="select-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M4 6L7.5 9.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent class="select-content" :side-offset="5">
              <SelectViewport class="select-viewport">
                <SelectItem value="all" class="select-item">
                  <SelectItemText>All Categories</SelectItemText>
                </SelectItem>
                <SelectItem
                  v-for="category in categories"
                  :key="category"
                  :value="category"
                  class="select-item"
                >
                  <SelectItemText>{{ category }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>

      <!-- Technology Filter -->
      <div class="filter-item">
        <label class="filter-label">Technology</label>
        <SelectRoot v-model="selectedTech">
          <SelectTrigger class="select-trigger" aria-label="Select technology">
            <SelectValue placeholder="All Technologies" />
            <SelectIcon class="select-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M4 6L7.5 9.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent class="select-content" :side-offset="5">
              <SelectViewport class="select-viewport">
                <SelectItem value="all" class="select-item">
                  <SelectItemText>All Technologies</SelectItemText>
                </SelectItem>
                <SelectItem
                  v-for="tech in technologies"
                  :key="tech"
                  :value="tech"
                  class="select-item"
                >
                  <SelectItemText>{{ tech }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>

      <!-- Platform Filter -->
      <div class="filter-item">
        <label class="filter-label">Platform</label>
        <SelectRoot v-model="selectedPlatform">
          <SelectTrigger class="select-trigger" aria-label="Select platform">
            <SelectValue placeholder="All Platforms" />
            <SelectIcon class="select-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M4 6L7.5 9.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent class="select-content" :side-offset="5">
              <SelectViewport class="select-viewport">
                <SelectItem value="all" class="select-item">
                  <SelectItemText>All Platforms</SelectItemText>
                </SelectItem>
                <SelectItem
                  v-for="platform in platforms"
                  :key="platform"
                  :value="platform"
                  class="select-item"
                >
                  <SelectItemText>{{ platform }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>

      <!-- Vendor Filter -->
      <div class="filter-item">
        <label class="filter-label">Vendor</label>
        <SelectRoot v-model="selectedVendor">
          <SelectTrigger class="select-trigger" aria-label="Select vendor">
            <SelectValue placeholder="All Vendors" />
            <SelectIcon class="select-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M4 6L7.5 9.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent class="select-content" :side-offset="5">
              <SelectViewport class="select-viewport">
                <SelectItem value="all" class="select-item">
                  <SelectItemText>All Vendors</SelectItemText>
                </SelectItem>
                <SelectItem
                  v-for="vendor in vendors"
                  :key="vendor"
                  :value="vendor"
                  class="select-item"
                >
                  <SelectItemText>{{ vendor }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>

      <!-- Standard Filter -->
      <div class="filter-item">
        <label class="filter-label">Standard</label>
        <SelectRoot v-model="selectedStandard">
          <SelectTrigger class="select-trigger" aria-label="Select standard">
            <SelectValue placeholder="All Standards" />
            <SelectIcon class="select-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M4 6L7.5 9.5L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent class="select-content" :side-offset="5">
              <SelectViewport class="select-viewport">
                <SelectItem value="all" class="select-item">
                  <SelectItemText>All Standards</SelectItemText>
                </SelectItem>
                <SelectItem
                  v-for="standard in standards"
                  :key="standard"
                  :value="standard"
                  class="select-item"
                >
                  <SelectItemText>{{ standard }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
      </div>

      <!-- Search Input -->
      <div class="filter-item filter-search">
        <label class="filter-label">Search</label>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search profiles..."
          @input="$emit('update:search', searchQuery)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
} from 'reka-ui'

interface Profile {
  id: string
  category?: string
  technology?: string
  technology_name?: string
  platform?: string
  vendor?: string
  standard_name?: string
}

const props = defineProps<{
  profiles: Profile[]
}>()

const emit = defineEmits<{
  'update:category': [value: string]
  'update:technology': [value: string]
  'update:platform': [value: string]
  'update:vendor': [value: string]
  'update:standard': [value: string]
  'update:search': [value: string]
}>()

const selectedCategory = ref('all')
const selectedTech = ref('all')
const selectedPlatform = ref('all')
const selectedVendor = ref('all')
const selectedStandard = ref('all')
const searchQuery = ref('')

// Extract unique categories from profiles
const categories = computed(() => {
  const uniqueCategories = new Set<string>()
  props.profiles.forEach(profile => {
    if (profile.category) {
      uniqueCategories.add(profile.category)
    }
  })
  return Array.from(uniqueCategories).sort()
})

// Extract unique technologies from profiles
const technologies = computed(() => {
  const uniqueTech = new Set<string>()
  props.profiles.forEach(profile => {
    // Use technology_name (display name) if available, otherwise technology ID
    const techName = profile.technology_name || profile.technology
    if (techName) {
      uniqueTech.add(techName)
    }
  })
  return Array.from(uniqueTech).sort()
})

// Extract unique platforms from profiles
const platforms = computed(() => {
  const uniquePlatforms = new Set<string>()
  props.profiles.forEach(profile => {
    if (profile.platform) {
      uniquePlatforms.add(profile.platform)
    }
  })
  return Array.from(uniquePlatforms).sort()
})

// Extract unique vendors from profiles
const vendors = computed(() => {
  const uniqueVendors = new Set<string>()
  props.profiles.forEach(profile => {
    if (profile.vendor) {
      uniqueVendors.add(profile.vendor)
    }
  })
  return Array.from(uniqueVendors).sort()
})

// Extract unique standards from profiles
const standards = computed(() => {
  const uniqueStandards = new Set<string>()
  props.profiles.forEach(profile => {
    if (profile.standard_name) {
      uniqueStandards.add(profile.standard_name)
    }
  })
  return Array.from(uniqueStandards).sort()
})

watch(selectedCategory, (value) => {
  emit('update:category', value)
})

watch(selectedTech, (value) => {
  emit('update:technology', value)
})

watch(selectedPlatform, (value) => {
  emit('update:platform', value)
})

watch(selectedVendor, (value) => {
  emit('update:vendor', value)
})

watch(selectedStandard, (value) => {
  emit('update:standard', value)
})
</script>

<style scoped>
.profile-filters {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.filter-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-search {
  grid-column: span 3;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.select-trigger:hover {
  border-color: var(--vp-c-brand-1);
}

.select-trigger:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.select-icon {
  display: flex;
  color: var(--vp-c-text-3);
}

/* Portal content needs global styles (teleports outside component) */
:global(.select-content) {
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  box-shadow: var(--vp-shadow-3);
  overflow: hidden;
  z-index: 9999;
  min-width: 200px;
}

:global(.select-viewport) {
  padding: 0.5rem;
  background: var(--vp-c-bg-elv);
}

:global(.select-item) {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  outline: none;
  user-select: none;
  color: var(--vp-c-text-1);
  background: transparent;
  transition: all 0.2s;
}

:global(.select-item:hover) {
  background: var(--vp-c-bg-soft);
}

:global(.select-item[data-highlighted]) {
  background: var(--vp-c-brand-1);
  color: white;
}

.search-input {
  width: 100%;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-input:hover {
  border-color: var(--vp-c-brand-1);
}

.search-input:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .filter-group {
    grid-template-columns: 1fr;
  }

  .filter-search {
    grid-column: span 1;
  }
}
</style>
