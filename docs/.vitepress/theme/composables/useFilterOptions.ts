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

/**
 * Match a content item's target against the selected target filter.
 *
 * Targets are stored as separate records per major version ("Red Hat
 * Enterprise Linux 8", "... 9"), alongside a general record with no version
 * ("Red Hat Enterprise Linux"). Selecting the general target should surface
 * the whole family; selecting a specific version stays narrow.
 *
 * The match is therefore one-directional: general -> versioned, never the
 * reverse. A separator is required after the selected name so that
 * "Debian 1" does not sweep up "Debian 11".
 *
 * @param selected - The target chosen in the filter dropdown
 * @param itemTarget - The target_name on the content item (optional in the
 *   loader's ContentItem type, so undefined is an expected input)
 */
export function matchesTargetFamily(
  selected: string | undefined,
  itemTarget: string | undefined,
): boolean {
  const sel = (selected || '').trim().toLowerCase()
  const target = (itemTarget || '').trim().toLowerCase()

  if (!sel || !target) {
    return false
  }

  return target === sel || target.startsWith(`${sel} `)
}
