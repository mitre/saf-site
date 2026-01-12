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
                <SelectItem value="STIG" class="select-item">
                  <SelectItemText>STIG</SelectItemText>
                </SelectItem>
                <SelectItem value="CIS" class="select-item">
                  <SelectItemText>CIS Benchmark</SelectItemText>
                </SelectItem>
                <SelectItem value="PCI-DSS" class="select-item">
                  <SelectItemText>PCI-DSS</SelectItemText>
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
                <SelectItem value="Linux" class="select-item">
                  <SelectItemText>Linux</SelectItemText>
                </SelectItem>
                <SelectItem value="Windows" class="select-item">
                  <SelectItemText>Windows</SelectItemText>
                </SelectItem>
                <SelectItem value="Cloud" class="select-item">
                  <SelectItemText>Cloud</SelectItemText>
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
import { ref, watch } from 'vue'
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

const emit = defineEmits<{
  'update:category': [value: string]
  'update:technology': [value: string]
  'update:search': [value: string]
}>()

const selectedCategory = ref('all')
const selectedTech = ref('all')
const searchQuery = ref('')

watch(selectedCategory, (value) => {
  emit('update:category', value)
})

watch(selectedTech, (value) => {
  emit('update:technology', value)
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
  grid-column: span 2;
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

.select-content {
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 9999;
  min-width: 200px;
}

.select-viewport {
  padding: 0.5rem;
}

.select-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  outline: none;
  user-select: none;
  color: var(--vp-c-text-1);
  transition: all 0.2s;
}

.select-item:hover {
  background: var(--vp-c-default-soft);
}

.select-item[data-highlighted] {
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
