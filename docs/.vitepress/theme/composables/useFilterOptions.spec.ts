import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useStandardOptions, useUniqueValues } from './useFilterOptions'

describe('useFilterOptions', () => {
  describe('useUniqueValues', () => {
    it('extracts unique values from items', () => {
      const items = ref([
        { id: '1', targetName: 'RHEL 8' },
        { id: '2', targetName: 'RHEL 9' },
        { id: '3', targetName: 'RHEL 8' }, // duplicate
        { id: '4', targetName: 'Ubuntu 22.04' },
      ])

      const targets = useUniqueValues(items, 'targetName')

      expect(targets.value).toEqual(['RHEL 8', 'RHEL 9', 'Ubuntu 22.04'])
    })

    it('sorts values alphabetically', () => {
      const items = ref([
        { name: 'Zebra' },
        { name: 'Apple' },
        { name: 'Mango' },
      ])

      const names = useUniqueValues(items, 'name')

      expect(names.value).toEqual(['Apple', 'Mango', 'Zebra'])
    })

    it('filters out empty and undefined values', () => {
      const items = ref([
        { targetName: 'RHEL 8' },
        { targetName: undefined },
        { targetName: '' },
        { targetName: 'Ubuntu' },
      ])

      const targets = useUniqueValues(items, 'targetName')

      expect(targets.value).toEqual(['RHEL 8', 'Ubuntu'])
    })

    it('works with plain array (not ref)', () => {
      const items = [
        { tech: 'InSpec' },
        { tech: 'Ansible' },
        { tech: 'InSpec' },
      ]

      const techs = useUniqueValues(items, 'tech')

      expect(techs.value).toEqual(['Ansible', 'InSpec'])
    })

    it('returns empty array for empty items', () => {
      const items = ref<Array<{ name: string }>>([])

      const names = useUniqueValues(items, 'name')

      expect(names.value).toEqual([])
    })

    it('reacts to items changes', () => {
      const items = ref([{ name: 'First' }])

      const names = useUniqueValues(items, 'name')
      expect(names.value).toEqual(['First'])

      items.value.push({ name: 'Second' })
      expect(names.value).toEqual(['First', 'Second'])
    })
  })

  describe('useStandardOptions', () => {
    it('extracts standards with full and short names', () => {
      const items = ref([
        { standardName: 'DISA STIG', standardShortName: 'STIG' },
        { standardName: 'CIS Benchmark', standardShortName: 'CIS' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toEqual([
        { fullName: 'CIS Benchmark', shortName: 'CIS' },
        { fullName: 'DISA STIG', shortName: 'STIG' },
      ])
    })

    it('uses full name as short name when shortName is missing', () => {
      const items = ref([
        { standardName: 'Custom Standard' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toEqual([
        { fullName: 'Custom Standard', shortName: 'Custom Standard' },
      ])
    })

    it('deduplicates by full name', () => {
      const items = ref([
        { standardName: 'DISA STIG', standardShortName: 'STIG' },
        { standardName: 'DISA STIG', standardShortName: 'STIG' },
        { standardName: 'CIS Benchmark', standardShortName: 'CIS' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toHaveLength(2)
    })

    it('sorts by short name', () => {
      const items = ref([
        { standardName: 'NIST 800-53', standardShortName: 'NIST' },
        { standardName: 'CIS Benchmark', standardShortName: 'CIS' },
        { standardName: 'DISA STIG', standardShortName: 'STIG' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value.map(s => s.shortName)).toEqual(['CIS', 'NIST', 'STIG'])
    })

    it('filters out items without standardName', () => {
      const items = ref([
        { standardName: 'STIG', standardShortName: 'STIG' },
        { standardName: undefined },
        {},
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toHaveLength(1)
    })
  })
})
