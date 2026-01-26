import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import { createFuzzyMatcher } from './useFuzzySearch'

/**
 * Minimal content item interface for filtering
 * Components can extend this with additional fields
 */
export interface FilterableContentItem {
  id: string
  name: string
  description?: string
  contentType: 'validation' | 'hardening'
  targetName?: string
  technologyName?: string
  vendorName?: string
  standardName?: string
}

/**
 * Filter state refs
 */
export interface ContentFilters {
  pillar: Ref<string>
  target: Ref<string>
  technology: Ref<string>
  vendor: Ref<string>
  standard: Ref<string>
  search: Ref<string>
}

/**
 * Return type for useContentFiltering
 */
export interface ContentFilteringReturn<T extends FilterableContentItem> {
  /** Filtered items based on current filter state */
  filteredItems: ComputedRef<T[]>
  /** Total validation items count (unfiltered) */
  validationCount: ComputedRef<number>
  /** Total hardening items count (unfiltered) */
  hardeningCount: ComputedRef<number>
}

/**
 * Content filtering composable
 *
 * Extracts filtering logic from browse pages into a reusable, testable composable.
 * Supports filtering by pillar (validate/harden), target, technology, vendor,
 * standard, and fuzzy text search.
 *
 * @param items - Array of content items to filter
 * @param filters - Reactive filter state refs
 * @returns Computed filtered items and stats
 *
 * @example
 * ```ts
 * const items = data.items
 * const filters = {
 *   pillar: ref('all'),
 *   target: ref('all'),
 *   technology: ref('all'),
 *   vendor: ref('all'),
 *   standard: ref('all'),
 *   search: ref(''),
 * }
 * const { filteredItems, validationCount, hardeningCount } = useContentFiltering(items, filters)
 * ```
 */
export function useContentFiltering<T extends FilterableContentItem>(
  items: T[],
  filters: ContentFilters,
): ContentFilteringReturn<T> {
  // Type assertion for Fuse.js compatibility:
  // Fuse.js requires Record<string, unknown> because it accesses properties dynamically by name
  // (e.g., item[keyName]). Our FilterableContentItem has specific typed properties but no index
  // signature. Rather than weaken the interface for all consumers, we assert at this boundary.
  // This is the recommended pattern - isolate the looseness to the library integration point.
  const fuzzyMatch = createFuzzyMatcher(items as (T & Record<string, unknown>)[])

  const filteredItems = computed(() => {
    let result = items

    // Filter by pillar (contentType)
    if (filters.pillar.value !== 'all') {
      const contentType = filters.pillar.value === 'validate' ? 'validation' : 'hardening'
      result = result.filter(item => item.contentType === contentType)
    }

    // Filter by target
    if (filters.target.value !== 'all') {
      result = result.filter(item => item.targetName === filters.target.value)
    }

    // Filter by technology
    if (filters.technology.value !== 'all') {
      result = result.filter(item => item.technologyName === filters.technology.value)
    }

    // Filter by vendor
    if (filters.vendor.value !== 'all') {
      result = result.filter(item => item.vendorName === filters.vendor.value)
    }

    // Filter by standard
    if (filters.standard.value !== 'all') {
      result = result.filter(item => item.standardName === filters.standard.value)
    }

    // Filter by search query using fuzzy matching
    if (filters.search.value) {
      const matchingItems = fuzzyMatch(filters.search.value)
      // Same type assertion as above - Set returned by fuzzyMatch uses the widened type
      result = result.filter(item => matchingItems.has(item as T & Record<string, unknown>))
    }

    return result
  })

  // Stats (based on unfiltered items)
  const validationCount = computed(() =>
    items.filter(i => i.contentType === 'validation').length,
  )

  const hardeningCount = computed(() =>
    items.filter(i => i.contentType === 'hardening').length,
  )

  return {
    filteredItems,
    validationCount,
    hardeningCount,
  }
}
