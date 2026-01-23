<template>
  <div class="content-filters">
    <!-- Row 1: Dropdown filters -->
    <div class="filter-row filter-dropdowns">
      <!-- Pillar Filter (SAF capability) -->
      <div class="filter-item">
        <label class="filter-label">Pillar</label>
        <Select v-model="selectedPillar">
          <SelectTrigger aria-label="Filter by SAF pillar">
            <SelectValue placeholder="All Pillars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <SelectItemText>All Pillars</SelectItemText>
            </SelectItem>
            <SelectItem value="validate">
              <SelectItemText>Validate</SelectItemText>
            </SelectItem>
            <SelectItem value="harden">
              <SelectItemText>Harden</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Target Filter (what the content secures) -->
      <div class="filter-item">
        <label class="filter-label">Target</label>
        <Select v-model="selectedTarget">
          <SelectTrigger aria-label="Filter by target platform">
            <SelectValue placeholder="All Targets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <SelectItemText>All Targets</SelectItemText>
            </SelectItem>
            <SelectItem
              v-for="target in targets"
              :key="target"
              :value="target"
            >
              <SelectItemText>{{ target }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Technology Filter -->
      <div class="filter-item">
        <label class="filter-label">Technology</label>
        <Select v-model="selectedTech">
          <SelectTrigger aria-label="Filter by automation technology">
            <SelectValue placeholder="All Technologies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <SelectItemText>All Technologies</SelectItemText>
            </SelectItem>
            <SelectItem
              v-for="tech in technologies"
              :key="tech"
              :value="tech"
            >
              <SelectItemText>{{ tech }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Vendor Filter -->
      <div class="filter-item">
        <label class="filter-label">Vendor</label>
        <Select v-model="selectedVendor">
          <SelectTrigger aria-label="Filter by vendor or organization">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <SelectItemText>All Vendors</SelectItemText>
            </SelectItem>
            <SelectItem
              v-for="vendor in vendors"
              :key="vendor"
              :value="vendor"
            >
              <SelectItemText>{{ vendor }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Standard Filter -->
      <div class="filter-item">
        <label class="filter-label">Standard</label>
        <Select v-model="selectedStandard">
          <SelectTrigger aria-label="Filter by compliance standard">
            <SelectValue placeholder="All Standards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <SelectItemText>All Standards</SelectItemText>
            </SelectItem>
            <SelectItem
              v-for="standard in standards"
              :key="standard.fullName"
              :value="standard.fullName"
            >
              <SelectItemText>{{ standard.shortName }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
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
import { ref, computed, watch } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

const selectedPillar = ref(props.initialPillar || 'all')
const selectedTarget = ref(props.initialTarget || 'all')
const selectedTech = ref(props.initialTechnology || 'all')
const selectedVendor = ref(props.initialVendor || 'all')
const selectedStandard = ref(props.initialStandard || 'all')
const searchQuery = ref(props.initialSearch || '')

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

// Extract unique targets from items
const targets = computed(() => {
  const unique = new Set<string>()
  props.items.forEach(item => {
    if (item.target_name) {
      unique.add(item.target_name)
    }
  })
  return Array.from(unique).sort()
})

// Extract unique technologies from items
const technologies = computed(() => {
  const unique = new Set<string>()
  props.items.forEach(item => {
    if (item.technology_name) {
      unique.add(item.technology_name)
    }
  })
  return Array.from(unique).sort()
})

// Extract unique vendors from items
const vendors = computed(() => {
  const unique = new Set<string>()
  props.items.forEach(item => {
    if (item.vendor_name) {
      unique.add(item.vendor_name)
    }
  })
  return Array.from(unique).sort()
})

// Extract unique standards with both full and short names
const standards = computed(() => {
  const standardsMap = new Map<string, string>()
  props.items.forEach(item => {
    if (item.standard_name) {
      standardsMap.set(
        item.standard_name,
        item.standard_short_name || item.standard_name
      )
    }
  })
  return Array.from(standardsMap.entries())
    .map(([fullName, shortName]) => ({ fullName, shortName }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName))
})

watch(selectedPillar, (value) => {
  emit('update:pillar', value)
})

watch(selectedTarget, (value) => {
  emit('update:target', value)
})

watch(selectedTech, (value) => {
  emit('update:technology', value)
})

watch(selectedVendor, (value) => {
  emit('update:vendor', value)
})

watch(selectedStandard, (value) => {
  emit('update:standard', value)
})
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

.filter-dropdowns .filter-item {
  flex: 1;
  min-width: 140px;
}

.filter-search-row {
  align-items: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.filter-search {
  flex: 1;
}

.filter-search :deep(input) {
  background: var(--vp-c-bg);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

  .filter-dropdowns .filter-item {
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
