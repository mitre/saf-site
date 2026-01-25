/**
 * Tests for field-mapping.ts - camelCase ↔ snake_case conversion
 *
 * TDD: These tests define the expected behavior before implementation.
 */
import { describe, expect, it } from 'vitest'
import {
  toSnakeCase,
  toCamelCase,
  mapFieldsToSnakeCase,
  mapFieldsToCamelCase,
} from './field-mapping'

describe('field-mapping', () => {
  describe('toSnakeCase', () => {
    it('converts camelCase to snake_case', () => {
      expect(toSnakeCase('contentType')).toBe('content_type')
      expect(toSnakeCase('longDescription')).toBe('long_description')
      expect(toSnakeCase('documentationUrl')).toBe('documentation_url')
    })

    it('handles single word (no change needed)', () => {
      expect(toSnakeCase('name')).toBe('name')
      expect(toSnakeCase('slug')).toBe('slug')
    })

    it('handles already snake_case (no change)', () => {
      expect(toSnakeCase('content_type')).toBe('content_type')
      expect(toSnakeCase('long_description')).toBe('long_description')
    })

    it('handles consecutive capitals (acronyms)', () => {
      expect(toSnakeCase('xmlHTTPRequest')).toBe('xml_http_request')
      expect(toSnakeCase('getHTTPResponse')).toBe('get_http_response')
    })

    it('handles empty string', () => {
      expect(toSnakeCase('')).toBe('')
    })
  })

  describe('toCamelCase', () => {
    it('converts snake_case to camelCase', () => {
      expect(toCamelCase('content_type')).toBe('contentType')
      expect(toCamelCase('long_description')).toBe('longDescription')
      expect(toCamelCase('documentation_url')).toBe('documentationUrl')
    })

    it('handles single word (no change needed)', () => {
      expect(toCamelCase('name')).toBe('name')
      expect(toCamelCase('slug')).toBe('slug')
    })

    it('handles already camelCase (no change)', () => {
      expect(toCamelCase('contentType')).toBe('contentType')
      expect(toCamelCase('longDescription')).toBe('longDescription')
    })

    it('handles multiple underscores', () => {
      expect(toCamelCase('very_long_field_name')).toBe('veryLongFieldName')
    })

    it('handles empty string', () => {
      expect(toCamelCase('')).toBe('')
    })
  })

  describe('mapFieldsToSnakeCase', () => {
    it('converts object keys from camelCase to snake_case', () => {
      const input = {
        contentType: 'validation',
        longDescription: 'A description',
        name: 'Test',
      }

      const result = mapFieldsToSnakeCase(input)

      expect(result).toEqual({
        content_type: 'validation',
        long_description: 'A description',
        name: 'Test',
      })
    })

    it('handles nested objects', () => {
      const input = {
        contentType: 'validation',
        metadata: {
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      }

      const result = mapFieldsToSnakeCase(input)

      expect(result).toEqual({
        content_type: 'validation',
        metadata: {
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
        },
      })
    })

    it('preserves null values', () => {
      const input = {
        contentType: 'validation',
        longDescription: null,
      }

      const result = mapFieldsToSnakeCase(input)

      expect(result).toEqual({
        content_type: 'validation',
        long_description: null,
      })
    })

    it('preserves undefined values', () => {
      const input = {
        contentType: 'validation',
        longDescription: undefined,
      }

      const result = mapFieldsToSnakeCase(input)

      expect(result.content_type).toBe('validation')
      expect(result.long_description).toBeUndefined()
    })

    it('handles arrays', () => {
      const input = {
        itemList: [
          { itemName: 'First' },
          { itemName: 'Second' },
        ],
      }

      const result = mapFieldsToSnakeCase(input)

      expect(result).toEqual({
        item_list: [
          { item_name: 'First' },
          { item_name: 'Second' },
        ],
      })
    })

    it('handles empty object', () => {
      expect(mapFieldsToSnakeCase({})).toEqual({})
    })
  })

  describe('mapFieldsToCamelCase', () => {
    it('converts object keys from snake_case to camelCase', () => {
      const input = {
        content_type: 'validation',
        long_description: 'A description',
        name: 'Test',
      }

      const result = mapFieldsToCamelCase(input)

      expect(result).toEqual({
        contentType: 'validation',
        longDescription: 'A description',
        name: 'Test',
      })
    })

    it('handles nested objects', () => {
      const input = {
        content_type: 'validation',
        metadata: {
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
        },
      }

      const result = mapFieldsToCamelCase(input)

      expect(result).toEqual({
        contentType: 'validation',
        metadata: {
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      })
    })

    it('preserves null values', () => {
      const input = {
        content_type: 'validation',
        long_description: null,
      }

      const result = mapFieldsToCamelCase(input)

      expect(result).toEqual({
        contentType: 'validation',
        longDescription: null,
      })
    })

    it('handles empty object', () => {
      expect(mapFieldsToCamelCase({})).toEqual({})
    })
  })

  describe('round-trip conversion', () => {
    it('round-trips correctly (camel → snake → camel)', () => {
      const original = {
        contentType: 'validation',
        longDescription: 'A description',
        documentationUrl: 'https://example.com',
      }

      const snake = mapFieldsToSnakeCase(original)
      const backToCamel = mapFieldsToCamelCase(snake)

      expect(backToCamel).toEqual(original)
    })

    it('round-trips correctly (snake → camel → snake)', () => {
      const original = {
        content_type: 'validation',
        long_description: 'A description',
        documentation_url: 'https://example.com',
      }

      const camel = mapFieldsToCamelCase(original)
      const backToSnake = mapFieldsToSnakeCase(camel)

      expect(backToSnake).toEqual(original)
    })

    it('round-trips nested objects correctly', () => {
      const original = {
        contentType: 'validation',
        metadata: {
          createdAt: '2024-01-01',
          nestedData: {
            fieldName: 'value',
          },
        },
      }

      const snake = mapFieldsToSnakeCase(original)
      const backToCamel = mapFieldsToCamelCase(snake)

      expect(backToCamel).toEqual(original)
    })
  })
})
