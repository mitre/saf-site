import type { IFuseOptions } from 'fuse.js'
import type { ComputedRef, Ref } from 'vue'
import Fuse from 'fuse.js'
import { computed } from 'vue'

/**
 * Default Fuse.js options for content search
 * - threshold: 0.4 allows moderate fuzziness (lower = stricter)
 * - ignoreLocation: true searches entire string, not just beginning
 * - includeScore: true for potential ranking use
 */
const DEFAULT_FUSE_OPTIONS: IFuseOptions<unknown> = {
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
  // Keys with weights - name is most important
  keys: [
    { name: 'name', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'target_name', weight: 1.5 },
    { name: 'standard_name', weight: 1 },
    { name: 'technology_name', weight: 1 },
    { name: 'vendor_name', weight: 1 },
  ],
}

/**
 * Fuzzy search composable using Fuse.js
 *
 * Handles common variations like:
 * - "redhat" matches "Red Hat Enterprise Linux"
 * - "rhel" matches "RHEL 8"
 * - "mysql" matches "MySQL 8.0"
 *
 * @param items - Reactive array of items to search
 * @param query - Reactive search query string
 * @param options - Optional Fuse.js configuration override
 * @returns Computed array of matching items (preserves original order when no query)
 */
export function useFuzzySearch<T extends Record<string, unknown>>(
  items: Ref<T[]> | T[],
  query: Ref<string> | string,
  options?: Partial<IFuseOptions<T>>,
): ComputedRef<T[]> {
  return computed(() => {
    const itemsArray = 'value' in items ? items.value : items
    const queryString = typeof query === 'string' ? query : query.value

    // Return all items if no query
    if (!queryString || queryString.trim() === '') {
      return itemsArray
    }

    // Create Fuse instance with merged options
    const fuse = new Fuse(itemsArray, {
      ...DEFAULT_FUSE_OPTIONS,
      ...options,
    } as IFuseOptions<T>)

    // Search and extract items from results
    const results = fuse.search(queryString)
    return results.map(result => result.item)
  })
}

/**
 * Simple fuzzy filter that returns boolean for use in .filter()
 * Useful when you need to combine fuzzy search with other filters
 */
export function createFuzzyMatcher<T extends Record<string, unknown>>(
  items: T[],
  options?: Partial<IFuseOptions<T>>,
): (query: string) => Set<T> {
  const fuse = new Fuse(items, {
    ...DEFAULT_FUSE_OPTIONS,
    ...options,
  } as IFuseOptions<T>)

  return (query: string): Set<T> => {
    if (!query || query.trim() === '') {
      return new Set(items)
    }
    const results = fuse.search(query)
    return new Set(results.map(r => r.item))
  }
}
