import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useContentFiltering } from './useContentFiltering'

// Minimal content item for testing
interface TestContentItem {
  id: string
  name: string
  description?: string
  contentType: 'validation' | 'hardening'
  targetName?: string
  technologyName?: string
  vendorName?: string
  standardName?: string
}

// Factory for test items
function createItem(overrides: Partial<TestContentItem> = {}): TestContentItem {
  return {
    id: 'test-1',
    name: 'Test Item',
    contentType: 'validation',
    ...overrides,
  }
}

describe('useContentFiltering', () => {
  describe('pillar filtering', () => {
    it('returns all items when pillar is "all"', () => {
      const items = [
        createItem({ id: '1', contentType: 'validation' }),
        createItem({ id: '2', contentType: 'hardening' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
    })

    it('filters to validation when pillar is "validate"', () => {
      const items = [
        createItem({ id: '1', contentType: 'validation' }),
        createItem({ id: '2', contentType: 'hardening' }),
        createItem({ id: '3', contentType: 'validation' }),
      ]
      const filters = { pillar: ref('validate'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.every(i => i.contentType === 'validation')).toBe(true)
    })

    it('filters to hardening when pillar is "harden"', () => {
      const items = [
        createItem({ id: '1', contentType: 'validation' }),
        createItem({ id: '2', contentType: 'hardening' }),
      ]
      const filters = { pillar: ref('harden'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].contentType).toBe('hardening')
    })
  })

  describe('target filtering', () => {
    it('filters by target name', () => {
      const items = [
        createItem({ id: '1', targetName: 'RHEL 8' }),
        createItem({ id: '2', targetName: 'Ubuntu 20.04' }),
        createItem({ id: '3', targetName: 'RHEL 8' }),
      ]
      const filters = { pillar: ref('all'), target: ref('RHEL 8'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.every(i => i.targetName === 'RHEL 8')).toBe(true)
    })

    it('returns all when target is "all"', () => {
      const items = [
        createItem({ id: '1', targetName: 'RHEL 8' }),
        createItem({ id: '2', targetName: 'Ubuntu 20.04' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
    })
  })

  describe('technology filtering', () => {
    it('filters by technology name', () => {
      const items = [
        createItem({ id: '1', technologyName: 'InSpec' }),
        createItem({ id: '2', technologyName: 'Ansible' }),
        createItem({ id: '3', technologyName: 'InSpec' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('InSpec'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.every(i => i.technologyName === 'InSpec')).toBe(true)
    })
  })

  describe('vendor filtering', () => {
    it('filters by vendor name', () => {
      const items = [
        createItem({ id: '1', vendorName: 'MITRE' }),
        createItem({ id: '2', vendorName: 'CIS' }),
        createItem({ id: '3', vendorName: 'MITRE' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('MITRE'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.every(i => i.vendorName === 'MITRE')).toBe(true)
    })
  })

  describe('standard filtering', () => {
    it('filters by standard name', () => {
      const items = [
        createItem({ id: '1', standardName: 'DISA STIG' }),
        createItem({ id: '2', standardName: 'CIS Benchmark' }),
        createItem({ id: '3', standardName: 'DISA STIG' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('DISA STIG'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.every(i => i.standardName === 'DISA STIG')).toBe(true)
    })
  })

  describe('search filtering', () => {
    it('filters by search query matching name', () => {
      const items = [
        createItem({ id: '1', name: 'RHEL 8 STIG' }),
        createItem({ id: '2', name: 'Ubuntu 20.04 CIS' }),
        createItem({ id: '3', name: 'RHEL 9 STIG' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('RHEL') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
      expect(filteredItems.value.every(i => i.name.includes('RHEL'))).toBe(true)
    })

    it('returns all items when search is empty', () => {
      const items = [
        createItem({ id: '1', name: 'RHEL 8 STIG' }),
        createItem({ id: '2', name: 'Ubuntu 20.04 CIS' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)
    })
  })

  describe('combined filtering', () => {
    it('applies multiple filters together', () => {
      const items = [
        createItem({ id: '1', contentType: 'validation', targetName: 'RHEL 8', technologyName: 'InSpec' }),
        createItem({ id: '2', contentType: 'validation', targetName: 'RHEL 8', technologyName: 'Ansible' }),
        createItem({ id: '3', contentType: 'hardening', targetName: 'RHEL 8', technologyName: 'InSpec' }),
        createItem({ id: '4', contentType: 'validation', targetName: 'Ubuntu', technologyName: 'InSpec' }),
      ]
      const filters = {
        pillar: ref('validate'),
        target: ref('RHEL 8'),
        technology: ref('InSpec'),
        vendor: ref('all'),
        standard: ref('all'),
        search: ref(''),
      }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].id).toBe('1')
    })
  })

  describe('stats', () => {
    it('returns correct validation count', () => {
      const items = [
        createItem({ id: '1', contentType: 'validation' }),
        createItem({ id: '2', contentType: 'hardening' }),
        createItem({ id: '3', contentType: 'validation' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { validationCount } = useContentFiltering(items, filters)

      expect(validationCount.value).toBe(2)
    })

    it('returns correct hardening count', () => {
      const items = [
        createItem({ id: '1', contentType: 'validation' }),
        createItem({ id: '2', contentType: 'hardening' }),
        createItem({ id: '3', contentType: 'hardening' }),
      ]
      const filters = { pillar: ref('all'), target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { hardeningCount } = useContentFiltering(items, filters)

      expect(hardeningCount.value).toBe(2)
    })
  })

  describe('reactivity', () => {
    it('updates filtered items when filter changes', () => {
      const items = [
        createItem({ id: '1', contentType: 'validation' }),
        createItem({ id: '2', contentType: 'hardening' }),
      ]
      const pillar = ref('all')
      const filters = { pillar, target: ref('all'), technology: ref('all'), vendor: ref('all'), standard: ref('all'), search: ref('') }

      const { filteredItems } = useContentFiltering(items, filters)

      expect(filteredItems.value).toHaveLength(2)

      // Change filter
      pillar.value = 'validate'

      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].contentType).toBe('validation')
    })
  })
})
