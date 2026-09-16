import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { matchesTargetFamily, useStandardOptions, useUniqueValues } from './useFilterOptions'

describe('useFilterOptions', () => {
  describe('useUniqueValues', () => {
    it('extracts unique values from items', () => {
      const items = ref([
        { id: '1', target_name: 'RHEL 8' },
        { id: '2', target_name: 'RHEL 9' },
        { id: '3', target_name: 'RHEL 8' }, // duplicate
        { id: '4', target_name: 'Ubuntu 22.04' },
      ])

      const targets = useUniqueValues(items, 'target_name')

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
        { target_name: 'RHEL 8' },
        { target_name: undefined },
        { target_name: '' },
        { target_name: 'Ubuntu' },
      ])

      const targets = useUniqueValues(items, 'target_name')

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
        { standard_name: 'DISA STIG', standard_short_name: 'STIG' },
        { standard_name: 'CIS Benchmark', standard_short_name: 'CIS' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toEqual([
        { fullName: 'CIS Benchmark', shortName: 'CIS' },
        { fullName: 'DISA STIG', shortName: 'STIG' },
      ])
    })

    it('uses full name as short name when short_name is missing', () => {
      const items = ref([
        { standard_name: 'Custom Standard' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toEqual([
        { fullName: 'Custom Standard', shortName: 'Custom Standard' },
      ])
    })

    it('deduplicates by full name', () => {
      const items = ref([
        { standard_name: 'DISA STIG', standard_short_name: 'STIG' },
        { standard_name: 'DISA STIG', standard_short_name: 'STIG' },
        { standard_name: 'CIS Benchmark', standard_short_name: 'CIS' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toHaveLength(2)
    })

    it('sorts by short name', () => {
      const items = ref([
        { standard_name: 'NIST 800-53', standard_short_name: 'NIST' },
        { standard_name: 'CIS Benchmark', standard_short_name: 'CIS' },
        { standard_name: 'DISA STIG', standard_short_name: 'STIG' },
      ])

      const standards = useStandardOptions(items)

      expect(standards.value.map(s => s.shortName)).toEqual(['CIS', 'NIST', 'STIG'])
    })

    it('filters out items without standard_name', () => {
      const items = ref([
        { standard_name: 'STIG', standard_short_name: 'STIG' },
        { standard_name: undefined },
        {},
      ])

      const standards = useStandardOptions(items)

      expect(standards.value).toHaveLength(1)
    })
  })
})

describe('matchesTargetFamily', () => {
  it('matches a target against itself', () => {
    expect(matchesTargetFamily('Red Hat Enterprise Linux 9', 'Red Hat Enterprise Linux 9')).toBe(true)
  })

  it('matches every major version when a general target is selected', () => {
    for (const v of ['6', '7', '8', '9', '10']) {
      expect(
        matchesTargetFamily('Red Hat Enterprise Linux', `Red Hat Enterprise Linux ${v}`),
        `RHEL ${v}`,
      ).toBe(true)
    }
  })

  it('does NOT widen a versioned selection back to the general target', () => {
    expect(matchesTargetFamily('Red Hat Enterprise Linux 9', 'Red Hat Enterprise Linux')).toBe(false)
  })

  it('does NOT match a different version of the same family', () => {
    expect(matchesTargetFamily('Red Hat Enterprise Linux 8', 'Red Hat Enterprise Linux 9')).toBe(false)
  })

  it('requires a separator so numeric prefixes do not partial-match', () => {
    // "Debian 11" must not be swept up by a "Debian 1" selection
    expect(matchesTargetFamily('Debian 1', 'Debian 11')).toBe(false)
    expect(matchesTargetFamily('Debian 1', 'Debian 1 LTS')).toBe(true)
  })

  it('tolerates stray whitespace in stored target names', () => {
    // Real data carried "Red Hat Enterprise Linux " with a trailing space
    expect(matchesTargetFamily('Red Hat Enterprise Linux ', 'Red Hat Enterprise Linux 9')).toBe(true)
    expect(matchesTargetFamily('Red Hat Enterprise Linux', ' Red Hat Enterprise Linux 9')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(matchesTargetFamily('red hat enterprise linux', 'Red Hat Enterprise Linux 9')).toBe(true)
  })

  it('does not match unrelated targets', () => {
    expect(matchesTargetFamily('Ubuntu 22.04', 'Red Hat Enterprise Linux 9')).toBe(false)
    expect(matchesTargetFamily('MongoDB', 'MySQL 8.0')).toBe(false)
  })

  it('handles empty or missing values safely', () => {
    expect(matchesTargetFamily('Debian 12', '')).toBe(false)
    expect(matchesTargetFamily('', 'Debian 12')).toBe(false)
    // Both empty must NOT match: without the empty guard these are equal
    // strings and would wrongly report a match for unset targets.
    expect(matchesTargetFamily('', '')).toBe(false)
    expect(matchesTargetFamily('   ', '   ')).toBe(false)
    expect(matchesTargetFamily(undefined, 'Debian 12')).toBe(false)
    expect(matchesTargetFamily('Debian 12', undefined)).toBe(false)
  })
})
