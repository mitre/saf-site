import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useFuzzySearch, createFuzzyMatcher } from './useFuzzySearch'

// Sample content items for testing
const sampleItems = [
  {
    id: '1',
    name: 'Red Hat Enterprise Linux 8 STIG',
    description: 'InSpec profile for RHEL 8',
    target_name: 'Red Hat Enterprise Linux 8',
    standard_name: 'DISA STIG',
    technology_name: 'InSpec',
    vendor_name: 'MITRE'
  },
  {
    id: '2',
    name: 'MySQL 8.0 CIS Benchmark',
    description: 'Ansible playbook for MySQL hardening',
    target_name: 'MySQL 8.0',
    standard_name: 'CIS Benchmark',
    technology_name: 'Ansible',
    vendor_name: 'CIS'
  },
  {
    id: '3',
    name: 'Windows Server 2019 STIG',
    description: 'Chef cookbook for Windows security',
    target_name: 'Windows Server 2019',
    standard_name: 'DISA STIG',
    technology_name: 'Chef',
    vendor_name: 'MITRE'
  },
  {
    id: '4',
    name: 'Amazon Linux 2 Security Profile',
    description: 'AWS-focused security validation',
    target_name: 'Amazon Linux 2',
    standard_name: 'AWS Best Practices',
    technology_name: 'InSpec',
    vendor_name: 'AWS'
  }
]

describe('useFuzzySearch', () => {
  describe('basic functionality', () => {
    it('returns all items when query is empty', () => {
      const query = ref('')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value).toHaveLength(4)
      expect(result.value).toEqual(sampleItems)
    })

    it('returns all items when query is whitespace', () => {
      const query = ref('   ')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value).toHaveLength(4)
    })

    it('filters items by exact match', () => {
      const query = ref('MySQL')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value).toHaveLength(1)
      expect(result.value[0].name).toBe('MySQL 8.0 CIS Benchmark')
    })
  })

  describe('fuzzy matching', () => {
    it('matches "redhat" to "Red Hat"', () => {
      const query = ref('redhat')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value.length).toBeGreaterThan(0)
      expect(result.value[0].name).toContain('Red Hat')
    })

    it('matches "rhel" to RHEL content', () => {
      const query = ref('rhel')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value.length).toBeGreaterThan(0)
      // Should match either name or description containing RHEL
      const hasRhelMatch = result.value.some(
        item => item.name.includes('Red Hat') || item.description?.includes('RHEL')
      )
      expect(hasRhelMatch).toBe(true)
    })

    it('matches "mysql" case-insensitively', () => {
      const query = ref('mysql')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value.length).toBeGreaterThan(0)
      expect(result.value[0].target_name).toBe('MySQL 8.0')
    })

    it('matches partial words like "wind" for Windows', () => {
      const query = ref('wind')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value.length).toBeGreaterThan(0)
      expect(result.value[0].name).toContain('Windows')
    })

    it('matches technology names like "inspec"', () => {
      const query = ref('inspec')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value.length).toBeGreaterThan(0)
      const allInSpec = result.value.every(item => item.technology_name === 'InSpec')
      expect(allInSpec).toBe(true)
    })

    it('matches standard names like "stig"', () => {
      const query = ref('stig')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value.length).toBeGreaterThanOrEqual(2)
      const allStig = result.value.every(item => item.standard_name?.includes('STIG'))
      expect(allStig).toBe(true)
    })
  })

  describe('reactive updates', () => {
    it('updates results when query changes', () => {
      const query = ref('MySQL')
      const result = useFuzzySearch(sampleItems, query)

      expect(result.value).toHaveLength(1)
      expect(result.value[0].name).toContain('MySQL')

      // Change query
      query.value = 'Windows'
      expect(result.value).toHaveLength(1)
      expect(result.value[0].name).toContain('Windows')
    })

    it('updates results when items change', () => {
      const items = ref([...sampleItems])
      const query = ref('MySQL')
      const result = useFuzzySearch(items, query)

      expect(result.value).toHaveLength(1)

      // Remove the MySQL item
      items.value = items.value.filter(i => !i.name.includes('MySQL'))
      expect(result.value).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty items array', () => {
      const query = ref('test')
      const result = useFuzzySearch([], query)

      expect(result.value).toEqual([])
    })

    it('handles single character query (below minMatchCharLength)', () => {
      const query = ref('a')
      const result = useFuzzySearch(sampleItems, query)

      // Single char should return no results due to minMatchCharLength: 2
      expect(result.value).toHaveLength(0)
    })

    it('handles special characters in query', () => {
      const query = ref('8.0')
      const result = useFuzzySearch(sampleItems, query)

      // Should match MySQL 8.0
      expect(result.value.length).toBeGreaterThan(0)
    })
  })
})

describe('createFuzzyMatcher', () => {
  it('returns a Set of all items for empty query', () => {
    const matcher = createFuzzyMatcher(sampleItems)
    const matches = matcher('')

    expect(matches.size).toBe(4)
  })

  it('returns a Set of matching items', () => {
    const matcher = createFuzzyMatcher(sampleItems)
    const matches = matcher('MySQL')

    expect(matches.size).toBe(1)
    expect([...matches][0].name).toContain('MySQL')
  })

  it('can be used with array filter', () => {
    const matcher = createFuzzyMatcher(sampleItems)
    const query = 'stig'
    const matchSet = matcher(query)

    const filtered = sampleItems.filter(item => matchSet.has(item))

    expect(filtered.length).toBeGreaterThanOrEqual(2)
  })
})
