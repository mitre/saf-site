/**
 * Shared metadata types and utilities
 */

/**
 * A single metadata item for display in hero cards, strips, etc.
 */
export interface MetadataItem {
  label: string
  value: string
  href?: string
}

/**
 * Build a filter URL for the content library
 */
export function buildFilterUrl(param: string, value: string): string {
  return `/content/?${param}=${encodeURIComponent(value)}`
}

/**
 * Create a metadata item if the value exists
 * Returns undefined if value is empty/null/undefined/0
 */
export function createMetadataItem(
  label: string,
  value: string | number | undefined | null,
  options?: { filterParam?: string, href?: string },
): MetadataItem | undefined {
  // Treat 0, empty string, null, undefined as "no value"
  if (value === undefined || value === null || value === '' || value === 0) {
    return undefined
  }

  const stringValue = String(value)
  let href = options?.href

  // Auto-generate filter link if filterParam provided
  if (options?.filterParam && !href) {
    href = buildFilterUrl(options.filterParam, stringValue)
  }

  return {
    label,
    value: stringValue,
    href,
  }
}

/**
 * Build an array of metadata items, filtering out undefined entries
 */
export function buildMetadataItems(
  ...items: (MetadataItem | undefined)[]
): MetadataItem[] {
  return items.filter((item): item is MetadataItem => item !== undefined)
}
