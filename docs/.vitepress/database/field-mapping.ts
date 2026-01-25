/**
 * Field Mapping Utilities - camelCase ↔ snake_case conversion
 *
 * Centralizes field name conversion for:
 * - CLI → Pocketbase (camelCase → snake_case)
 * - Pocketbase → CLI (snake_case → camelCase)
 * - Drizzle schema field mapping
 */

/**
 * Convert a single field name from camelCase to snake_case
 *
 * Examples:
 * - contentType → content_type
 * - longDescription → long_description
 * - xmlHTTPRequest → xml_http_request
 */
export function toSnakeCase(fieldName: string): string {
  if (!fieldName) return ''

  // If already snake_case (contains underscore, no uppercase), return as-is
  if (fieldName.includes('_') && !/[A-Z]/.test(fieldName)) {
    return fieldName
  }

  // Convert camelCase to snake_case
  // Handle consecutive capitals (acronyms) by inserting underscore before the last capital
  // when followed by lowercase
  return fieldName
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // Handle acronyms like HTTP in xmlHTTPRequest
    .replace(/([a-z\d])([A-Z])/g, '$1_$2') // Handle normal camelCase
    .toLowerCase()
}

/**
 * Convert a single field name from snake_case to camelCase
 *
 * Examples:
 * - content_type → contentType
 * - long_description → longDescription
 * - very_long_field_name → veryLongFieldName
 */
export function toCamelCase(fieldName: string): string {
  if (!fieldName) return ''

  // If already camelCase (no underscore), return as-is
  if (!fieldName.includes('_')) {
    return fieldName
  }

  // Convert snake_case to camelCase
  return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Check if a value is a plain object (not null, array, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && !(value instanceof Date)
  )
}

/**
 * Convert all keys in an object from camelCase to snake_case
 * Handles nested objects and arrays recursively
 */
export function mapFieldsToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key)

    if (isPlainObject(value)) {
      // Recursively convert nested objects
      result[snakeKey] = mapFieldsToSnakeCase(value)
    }
    else if (Array.isArray(value)) {
      // Recursively convert array items if they're objects
      result[snakeKey] = value.map(item =>
        isPlainObject(item) ? mapFieldsToSnakeCase(item) : item,
      )
    }
    else {
      // Preserve primitive values (including null and undefined)
      result[snakeKey] = value
    }
  }

  return result
}

/**
 * Convert all keys in an object from snake_case to camelCase
 * Handles nested objects and arrays recursively
 */
export function mapFieldsToCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key)

    if (isPlainObject(value)) {
      // Recursively convert nested objects
      result[camelKey] = mapFieldsToCamelCase(value)
    }
    else if (Array.isArray(value)) {
      // Recursively convert array items if they're objects
      result[camelKey] = value.map(item =>
        isPlainObject(item) ? mapFieldsToCamelCase(item) : item,
      )
    }
    else {
      // Preserve primitive values (including null and undefined)
      result[camelKey] = value
    }
  }

  return result
}
