<template>
  <div class="content-filters">
    <!-- Row 1: Dropdown filters -->
    <div class="filter-row filter-dropdowns">
      <!-- Pillar Filter (SAF capability) - static options -->
      <FilterSelect
        v-model="selectedPillar"
        :options="pillarOptions"
        label="Pillar"
        placeholder="All Pillars"
        aria-label="Filter by SAF pillar"
      />

      <!-- Target Filter -->
      <FilterSelect
        v-model="selectedTarget"
        :options="targets"
        label="Target"
        placeholder="All Targets"
        aria-label="Filter by target platform"
      />

      <!-- Technology Filter -->
      <FilterSelect
        v-model="selectedTech"
        :options="technologies"
        label="Technology"
        placeholder="All Technologies"
        aria-label="Filter by automation technology"
      />

      <!-- Vendor Filter -->
      <FilterSelect
        v-model="selectedVendor"
        :options="vendors"
        label="Vendor"
        placeholder="All Vendors"
        aria-label="Filter by vendor or organization"
      />

      <!-- Standard Filter -->
      <FilterSelect
        v-model="selectedStandard"
        :options="standardOptions"
        label="Standard"
        placeholder="All Standards"
        aria-label="Filter by compliance standard"
      />
    </div>

    <!-- Row 2: Search + Clear -->
    <div class="filter-row filter-search-row">
      <div class="filter-item filter-search">
        <label class="filter-label">Search</label>
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search content..."
          @input="$emit('update:search', searchQuery)"
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        :disabled="!hasActiveFilters"
        @click="clearFilters"
        class="clear-button"
      >
        Clear filters
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import FilterSelect, { type FilterOption } from './FilterSelect.vue'
import { useUniqueValues, useStandardOptions } from '@/composables/useFilterOptions'

interface ContentItem {
  id: string
  content_type: 'validation' | 'hardening'
  target_name?: string
  technology_name?: string
  vendor_name?: string
  standard_name?: string
  standard_short_name?: string
}

const props = defineProps<{
  items: ContentItem[]
  initialPillar?: string
  initialTarget?: string
  initialTechnology?: string
  initialVendor?: string
  initialStandard?: string
  initialSearch?: string
}>()

const emit = defineEmits<{
  'update:pillar': [value: string]
  'update:target': [value: string]
  'update:technology': [value: string]
  'update:vendor': [value: string]
  'update:standard': [value: string]
  'update:search': [value: string]
  'clear': []
}>()

// Filter state
const selectedPillar = ref(props.initialPillar || 'all')
const selectedTarget = ref(props.initialTarget || 'all')
const selectedTech = ref(props.initialTechnology || 'all')
const selectedVendor = ref(props.initialVendor || 'all')
const selectedStandard = ref(props.initialStandard || 'all')
const searchQuery = ref(props.initialSearch || '')

// Static pillar options
const pillarOptions: FilterOption[] = [
  { value: 'validate', label: 'Validate' },
  { value: 'harden', label: 'Harden' }
]

// Dynamic filter options using composable
const itemsRef = toRef(props, 'items')
const targets = useUniqueValues(itemsRef, 'target_name')
const technologies = useUniqueValues(itemsRef, 'technology_name')
const vendors = useUniqueValues(itemsRef, 'vendor_name')
const standards = useStandardOptions(itemsRef)

// Transform standards to FilterOption format
const standardOptions = computed<FilterOption[]>(() =>
  standards.value.map(s => ({ value: s.fullName, label: s.shortName }))
)

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return selectedPillar.value !== 'all' ||
    selectedTarget.value !== 'all' ||
    selectedTech.value !== 'all' ||
    selectedVendor.value !== 'all' ||
    selectedStandard.value !== 'all' ||
    searchQuery.value !== ''
})

// Clear all filters
function clearFilters() {
  selectedPillar.value = 'all'
  selectedTarget.value = 'all'
  selectedTech.value = 'all'
  selectedVendor.value = 'all'
  selectedStandard.value = 'all'
  searchQuery.value = ''
  emit('clear')
}

// Emit changes
watch(selectedPillar, (value) => emit('update:pillar', value))
watch(selectedTarget, (value) => emit('update:target', value))
watch(selectedTech, (value) => emit('update:technology', value))
watch(selectedVendor, (value) => emit('update:vendor', value))
watch(selectedStandard, (value) => emit('update:standard', value))
</script>

<style scoped>
.content-filters {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
}

.filter-dropdowns {
  flex-wrap: wrap;
}

/* FilterSelect components in the dropdown row */
.filter-dropdowns :deep(.filter-item) {
  flex: 1;
  min-width: 140px;
}

.filter-search-row {
  align-items: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

/* Local filter-item for search (not from FilterSelect) */
.filter-item.filter-search {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-search :deep(input) {
  background: var(--vp-c-bg);
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.clear-button {
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .filter-dropdowns {
    flex-direction: column;
  }

  .filter-dropdowns :deep(.filter-item) {
    min-width: 100%;
  }

  .filter-search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .clear-button {
    align-self: flex-start;
  }
}
</style>
