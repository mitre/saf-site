import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'

/**
 * Extract unique values from a list of items for filter dropdowns
 *
 * @param items - Reactive array of items to extract values from
 * @param fieldName - Name of the field to extract values from
 * @returns Sorted array of unique non-empty values
 */
export function useUniqueValues<T extends object>(
  items: Ref<T[]> | T[],
  fieldName: keyof T,
): ComputedRef<string[]> {
  return computed(() => {
    const itemsArray = 'value' in items ? items.value : items
    const unique = new Set<string>()

    itemsArray.forEach((item) => {
      const value = item[fieldName]
      if (value && typeof value === 'string') {
        unique.add(value)
      }
    })

    return Array.from(unique).sort()
  })
}

/**
 * Standard option with full name and short display name
 */
export interface StandardOption {
  fullName: string
  shortName: string
}

/**
 * Extract unique standards with both full and short names
 * Used when display name differs from filter value (e.g., "DISA STIG" displays as "STIG")
 *
 * @param items - Reactive array of items with standard_name and standard_short_name fields
 * @returns Sorted array of standard options
 */
export function useStandardOptions<T extends { standard_name?: string, standard_short_name?: string }>(
  items: Ref<T[]> | T[],
): ComputedRef<StandardOption[]> {
  return computed(() => {
    const itemsArray = 'value' in items ? items.value : items
    const standardsMap = new Map<string, string>()

    itemsArray.forEach((item) => {
      if (item.standard_name) {
        standardsMap.set(
          item.standard_name,
          item.standard_short_name || item.standard_name,
        )
      }
    })

    return Array.from(standardsMap.entries())
      .map(([fullName, shortName]) => ({ fullName, shortName }))
      .sort((a, b) => a.shortName.localeCompare(b.shortName))
  })
}
