<template>
  <div class="content-filters">
    <div class="filter-group">
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

      <!-- Search Input -->
      <div class="filter-item filter-search">
        <label class="filter-label">Search</label>
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search content..."
          @input="$emit('update:search', searchQuery)"
        />
      </div>
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
}>()

const emit = defineEmits<{
  'update:pillar': [value: string]
  'update:target': [value: string]
  'update:technology': [value: string]
  'update:vendor': [value: string]
  'update:standard': [value: string]
  'update:search': [value: string]
}>()

const selectedPillar = ref('all')
const selectedTarget = ref('all')
const selectedTech = ref('all')
const selectedVendor = ref('all')
const selectedStandard = ref('all')
const searchQuery = ref('')

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
}

.filter-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

@media (max-width: 768px) {
  .filter-group {
    grid-template-columns: 1fr;
  }

  .filter-search {
    grid-column: span 1;
  }
}
</style>
