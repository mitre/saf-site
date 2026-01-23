# VitePress DRY Analysis

> Generated: 2026-01-23 | Session 054
> Total potential savings: 400+ lines

## Overview

This document tracks DRY (Don't Repeat Yourself) violations identified in the VitePress site codebase.
Work on these items should be done incrementally across sessions.

## Priority 1: Card Component Duplication (121 lines)

**Files:**
- `theme/components/ProfileCard.vue` (96 lines)
- `theme/components/ContentCard.vue` (110 lines)

**Problem:** These components are nearly identical with only minor differences:
- Profile vs content terminology
- Pillar badge presence
- URL generation

**Shared code (~80 lines):**
- Card structure (lines 33-80 vs 46-94)
- statusVariant function (lines 22-30 vs 35-43)
- Scoped CSS (lines 82-95 vs 96-109)

**Solution:**
1. Keep ContentCard.vue as the primary component
2. Delete ProfileCard.vue
3. Update all imports to use ContentCard
4. ContentCard already handles both content types via `content_type` field

**Effort:** 1 hour | **Lines saved:** 96 (delete ProfileCard)

---

## Priority 2: Filter Component Duplication (60+ lines)

**Files:**
- `theme/components/ProfileFilters.vue` (257 lines)
- `theme/components/ContentFilters.vue` (356 lines)

**Problem:** Nearly identical filter extraction and watcher logic:
```typescript
// Both have identical computed properties:
const targets = computed(() => {
  const unique = new Set<string>()
  props.profiles.forEach(profile => {  // or props.items
    if (profile.target_name) unique.add(profile.target_name)
  })
  return Array.from(unique).sort()
})
```

**Solution:** Extract `useFilterExtraction` composable:
```typescript
// composables/useFilterExtraction.ts
export function useFilterExtraction<T>(
  items: Ref<T[]>,
  fieldName: keyof T
): ComputedRef<string[]> {
  return computed(() => {
    const unique = new Set<string>()
    items.value.forEach(item => {
      const value = item[fieldName]
      if (value) unique.add(String(value))
    })
    return Array.from(unique).sort()
  })
}
```

**Effort:** 1.5 hours | **Lines saved:** ~60

---

## Priority 3: Data Loader Transformation (50+ lines)

**Files:**
- `loaders/profiles.data.ts` (163 lines)
- `loaders/content.data.ts` (196 lines)

**Problem:** Identical Pocketbase transformation logic:
```typescript
// Both do identical field mapping:
target: record.expand?.target?.id,
target_name: record.expand?.target?.name,
target_slug: record.expand?.target?.slug,
// ... repeats for standard, technology, vendor, maintainer
```

Also duplicated authentication (~10 lines each).

**Solution:** Create shared utility:
```typescript
// lib/loader-utils.ts
export async function initPocketBase() {
  const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090')
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com',
    process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123'
  )
  return pb
}

export function transformExpandedFK(expand: any, fieldName: string) {
  const field = expand?.[fieldName]
  return {
    id: field?.id,
    name: field?.name,
    slug: field?.slug
  }
}
```

**Effort:** 1 hour | **Lines saved:** ~50

---

## Priority 4: Status Variant Logic (16 lines)

**Files:**
- `theme/components/ProfileCard.vue` (lines 22-30)
- `theme/components/ContentCard.vue` (lines 35-43)

**Problem:** Identical function in both:
```typescript
const statusVariant = (status?: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'beta': return 'warning'
    case 'deprecated': return 'destructive'
    case 'draft': return 'secondary'
    default: return 'default'
  }
}
```

**Solution:** Add to `lib/utils.ts`:
```typescript
export function getStatusVariant(status?: string): string {
  const variantMap: Record<string, string> = {
    'active': 'success',
    'beta': 'warning',
    'deprecated': 'destructive',
    'draft': 'secondary'
  }
  return variantMap[status?.toLowerCase() ?? ''] ?? 'default'
}
```

**Effort:** 15 min | **Lines saved:** 16

---

## Priority 5: Filter Select Template (60+ lines)

**Files:**
- `theme/components/ProfileFilters.vue` (lines 5-90)
- `theme/components/ContentFilters.vue` (lines 4-112)

**Problem:** Same SelectItem template pattern repeated 5 times in each:
```vue
<Select v-model="selectedTarget">
  <SelectTrigger aria-label="Filter by target platform">
    <SelectValue placeholder="All Targets" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">
      <SelectItemText>All Targets</SelectItemText>
    </SelectItem>
    <SelectItem v-for="target in targets" :key="target" :value="target">
      <SelectItemText>{{ target }}</SelectItemText>
    </SelectItem>
  </SelectContent>
</Select>
```

**Solution:** Create `FilterSelect.vue` component:
```vue
<script setup lang="ts">
defineProps<{
  modelValue: string
  options: string[]
  placeholder: string
  ariaLabel: string
}>()
defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <Select :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <SelectTrigger :aria-label="ariaLabel">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">
        <SelectItemText>{{ placeholder }}</SelectItemText>
      </SelectItem>
      <SelectItem v-for="option in options" :key="option" :value="option">
        <SelectItemText>{{ option }}</SelectItemText>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
```

**Effort:** 1 hour | **Lines saved:** ~60

---

## Priority 6: Metadata Display Logic (40+ lines)

**Files:**
- `theme/components/ContentHero.vue` (lines 22-45)
- `theme/components/ContentDetail.vue` (lines 175-251)
- `theme/components/MetadataStrip.vue` (lines 1-11)

**Problem:** Each component handles metadata differently despite shared concepts.

**Solution:** Standardize metadata building in a composable or use ContentHero's approach consistently.

**Effort:** 1.5 hours | **Lines saved:** ~40

---

## Priority 7: Pocketbase Types (25+ lines)

**Files:**
- `loaders/profiles.data.ts` (lines 5-30)
- `loaders/content.data.ts` (lines 5-46)

**Problem:** Identical PBContent interface definitions.

**Solution:** Extract to `lib/pocketbase-types.ts` and import.

**Effort:** 30 min | **Lines saved:** ~25

---

## Summary

| Priority | Issue | Lines Saved | Effort | Status |
|----------|-------|-------------|--------|--------|
| P1 | Card component duplication | 96 | 1h | ⬜ Todo |
| P2 | Filter component duplication | 60+ | 1.5h | ⬜ Todo |
| P3 | Data loader transformation | 50+ | 1h | ⬜ Todo |
| P4 | Status variant logic | 16 | 15m | ⬜ Todo |
| P5 | Filter select template | 60+ | 1h | ⬜ Todo |
| P6 | Metadata display logic | 40+ | 1.5h | ⬜ Todo |
| P7 | Pocketbase types | 25+ | 30m | ⬜ Todo |
| **Total** | | **347+** | **~7h** | |

## Quick Wins (Do First)

1. **P4: Status variant** - Simple extraction, 15 min
2. **P1: Delete ProfileCard** - Just delete and update imports, 1h
3. **P7: Extract PB types** - Simple move, 30 min

## Session Planning

- **Session A:** P4 + P7 (~45 min, ~40 lines) - Quick wins
- **Session B:** P1 + P3 (~2h, ~145 lines) - Card + loader consolidation
- **Session C:** P2 + P5 (~2.5h, ~120 lines) - Filter consolidation
- **Session D:** P6 (~1.5h, ~40 lines) - Metadata cleanup
