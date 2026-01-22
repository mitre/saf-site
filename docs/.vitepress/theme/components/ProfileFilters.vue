<template>
  <div class="profile-filters">
    <div class="filter-group">
      <!-- Target Filter (what the profile validates) -->
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface Profile {
  id: string
  target_name?: string
  technology_name?: string
  vendor_name?: string
  standard_name?: string
  standard_short_name?: string
}

const props = defineProps<{
  profiles: Profile[]
}>()

const emit = defineEmits<{
  'update:target': [value: string]
  'update:technology': [value: string]
  'update:vendor': [value: string]
  'update:standard': [value: string]
  'update:search': [value: string]
}>()

const selectedTarget = ref('all')
const selectedTech = ref('all')
const selectedVendor = ref('all')
const selectedStandard = ref('all')
const searchQuery = ref('')

// Extract unique targets from profiles
const targets = computed(() => {
  const unique = new Set<string>()
  props.profiles.forEach(profile => {
    if (profile.target_name) {
      unique.add(profile.target_name)
    }
  })
  return Array.from(unique).sort()
})

// Extract unique technologies from profiles
const technologies = computed(() => {
  const unique = new Set<string>()
  props.profiles.forEach(profile => {
    if (profile.technology_name) {
      unique.add(profile.technology_name)
    }
  })
  return Array.from(unique).sort()
})

// Extract unique vendors from profiles
const vendors = computed(() => {
  const unique = new Set<string>()
  props.profiles.forEach(profile => {
    if (profile.vendor_name) {
      unique.add(profile.vendor_name)
    }
  })
  return Array.from(unique).sort()
})

// Extract unique standards with both full and short names
const standards = computed(() => {
  const standardsMap = new Map<string, string>()
  props.profiles.forEach(profile => {
    if (profile.standard_name) {
      standardsMap.set(
        profile.standard_name,
        profile.standard_short_name || profile.standard_name
      )
    }
  })
  return Array.from(standardsMap.entries())
    .map(([fullName, shortName]) => ({ fullName, shortName }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName))
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

@media (max-width: 768px) {
  .filter-group {
    grid-template-columns: 1fr;
  }

  .filter-search {
    grid-column: span 1;
  }
}
</style>
