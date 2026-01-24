import { describe, it, expect } from 'vitest'
import {
  buildFilterUrl,
  createMetadataItem,
  buildMetadataItems,
  type MetadataItem
} from './metadata'

describe('metadata utilities', () => {
  describe('buildFilterUrl', () => {
    it('builds URL with parameter', () => {
      expect(buildFilterUrl('target', 'RHEL 8')).toBe('/content/?target=RHEL%208')
    })

    it('encodes special characters', () => {
      expect(buildFilterUrl('standard', 'DISA STIG')).toBe('/content/?standard=DISA%20STIG')
    })
  })

  describe('createMetadataItem', () => {
    it('creates item with label and value', () => {
      const item = createMetadataItem('Target', 'RHEL 8')

      expect(item).toEqual({
        label: 'Target',
        value: 'RHEL 8',
        href: undefined
      })
    })

    it('creates item with explicit href', () => {
      const item = createMetadataItem('GitHub', 'View Source', {
        href: 'https://github.com/example/repo'
      })

      expect(item).toEqual({
        label: 'GitHub',
        value: 'View Source',
        href: 'https://github.com/example/repo'
      })
    })

    it('auto-generates filter link with filterParam', () => {
      const item = createMetadataItem('Target', 'RHEL 8', {
        filterParam: 'target'
      })

      expect(item).toEqual({
        label: 'Target',
        value: 'RHEL 8',
        href: '/content/?target=RHEL%208'
      })
    })

    it('prefers explicit href over filterParam', () => {
      const item = createMetadataItem('Target', 'RHEL 8', {
        filterParam: 'target',
        href: '/custom/url'
      })

      expect(item?.href).toBe('/custom/url')
    })

    it('returns undefined for empty string', () => {
      expect(createMetadataItem('Empty', '')).toBeUndefined()
    })

    it('returns undefined for null', () => {
      expect(createMetadataItem('Null', null)).toBeUndefined()
    })

    it('returns undefined for undefined', () => {
      expect(createMetadataItem('Undef', undefined)).toBeUndefined()
    })

    it('converts numbers to strings', () => {
      const item = createMetadataItem('Controls', 247)

      expect(item).toEqual({
        label: 'Controls',
        value: '247',
        href: undefined
      })
    })

    it('returns undefined for zero (treated as no value)', () => {
      expect(createMetadataItem('Controls', 0)).toBeUndefined()
    })
  })

  describe('buildMetadataItems', () => {
    it('filters out undefined items', () => {
      const items = buildMetadataItems(
        createMetadataItem('A', 'Value A'),
        createMetadataItem('B', undefined),
        createMetadataItem('C', 'Value C'),
        undefined
      )

      expect(items).toHaveLength(2)
      expect(items.map(i => i.label)).toEqual(['A', 'C'])
    })

    it('returns empty array when all items undefined', () => {
      const items = buildMetadataItems(
        createMetadataItem('A', undefined),
        createMetadataItem('B', null),
        createMetadataItem('C', '')
      )

      expect(items).toEqual([])
    })

    it('preserves order of valid items', () => {
      const items = buildMetadataItems(
        createMetadataItem('First', '1'),
        createMetadataItem('Second', '2'),
        createMetadataItem('Third', '3')
      )

      expect(items.map(i => i.label)).toEqual(['First', 'Second', 'Third'])
    })
  })
})
