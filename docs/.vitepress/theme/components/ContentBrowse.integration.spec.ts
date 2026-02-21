import { flushPromises, mount } from '@vue/test-utils'
/**
 * Integration tests for the Content Browse flow
 *
 * Tests the full filtering pipeline:
 * ContentFilters → filter logic → ContentCard display
 */
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, ref } from 'vue'
import { createFuzzyMatcher } from '@/composables/useFuzzySearch'
import ContentCard from './ContentCard.vue'
import ContentFilters from './ContentFilters.vue'

// Sample content items representing real data structure
const sampleContent = [
  {
    id: '1',
    slug: 'rhel8-stig',
    name: 'Red Hat Enterprise Linux 8 STIG',
    description: 'InSpec profile for RHEL 8 STIG compliance validation',
    content_type: 'validation' as const,
    pillar: 'validate',
    status: 'active',
    target_name: 'Red Hat Enterprise Linux 8',
    technology_name: 'InSpec',
    vendor_name: 'MITRE',
    standard_name: 'DISA STIG',
    standard_short_name: 'STIG',
  },
  {
    id: '2',
    slug: 'rhel8-ansible',
    name: 'Red Hat Enterprise Linux 8 Ansible Hardening',
    description: 'Ansible playbook for RHEL 8 security hardening',
    content_type: 'hardening' as const,
    pillar: 'harden',
    status: 'active',
    target_name: 'Red Hat Enterprise Linux 8',
    technology_name: 'Ansible',
    vendor_name: 'MITRE',
    standard_name: 'DISA STIG',
    standard_short_name: 'STIG',
  },
  {
    id: '3',
    slug: 'mysql-cis',
    name: 'MySQL 8.0 CIS Benchmark',
    description: 'InSpec profile for MySQL CIS compliance',
    content_type: 'validation' as const,
    pillar: 'validate',
    status: 'active',
    target_name: 'MySQL 8.0',
    technology_name: 'InSpec',
    vendor_name: 'CIS',
    standard_name: 'CIS Benchmark',
    standard_short_name: 'CIS',
  },
  {
    id: '4',
    slug: 'windows-stig',
    name: 'Windows Server 2019 STIG',
    description: 'Chef cookbook for Windows Server hardening',
    content_type: 'hardening' as const,
    pillar: 'harden',
    status: 'beta',
    target_name: 'Windows Server 2019',
    technology_name: 'Chef',
    vendor_name: 'MITRE',
    standard_name: 'DISA STIG',
    standard_short_name: 'STIG',
  },
  {
    id: '5',
    slug: 'ubuntu-stig',
    name: 'Ubuntu 20.04 STIG',
    description: 'InSpec profile for Ubuntu STIG validation',
    content_type: 'validation' as const,
    pillar: 'validate',
    status: 'active',
    target_name: 'Ubuntu 20.04',
    technology_name: 'InSpec',
    vendor_name: 'MITRE',
    standard_name: 'DISA STIG',
    standard_short_name: 'STIG',
  },
  {
    id: '6',
    slug: 'ohdf-converters',
    name: 'OHDF Converters',
    description: 'Convert security data into OHDF format',
    content_type: 'library' as const,
    pillar: 'normalize',
    status: 'active',
    target_name: '',
    technology_name: 'TypeScript',
    vendor_name: 'MITRE',
    standard_name: '',
    standard_short_name: '',
    packages: [{ registry: 'npm', name: '@mitre/hdf-converters' }],
  },
]

/**
 * Test wrapper component that mimics content/index.md behavior
 * Combines ContentFilters with filtering logic and ContentCard display
 */
const ContentBrowseWrapper = defineComponent({
  name: 'ContentBrowseWrapper',
  components: { ContentFilters, ContentCard },
  setup() {
    const allItems = sampleContent
    const fuzzyMatch = createFuzzyMatcher(allItems)

    // Filter state
    const selectedPillar = ref('all')
    const selectedTarget = ref('all')
    const selectedTech = ref('all')
    const selectedVendor = ref('all')
    const selectedStandard = ref('all')
    const searchQuery = ref('')

    // Filtered items (mirrors content/index.md logic)
    const filteredItems = computed(() => {
      let result = [...allItems]

      if (selectedPillar.value !== 'all') {
        result = result.filter(item => item.pillar === selectedPillar.value)
      }

      if (selectedTarget.value !== 'all') {
        result = result.filter(item => item.target_name === selectedTarget.value)
      }

      if (selectedTech.value !== 'all') {
        result = result.filter(item => item.technology_name === selectedTech.value)
      }

      if (selectedVendor.value !== 'all') {
        result = result.filter(item => item.vendor_name === selectedVendor.value)
      }

      if (selectedStandard.value !== 'all') {
        result = result.filter(item => item.standard_name === selectedStandard.value)
      }

      if (searchQuery.value) {
        const matchingItems = fuzzyMatch(searchQuery.value)
        result = result.filter(item => matchingItems.has(item))
      }

      return result
    })

    const clearAllFilters = () => {
      selectedPillar.value = 'all'
      selectedTarget.value = 'all'
      selectedTech.value = 'all'
      selectedVendor.value = 'all'
      selectedStandard.value = 'all'
      searchQuery.value = ''
    }

    return {
      allItems,
      filteredItems,
      selectedPillar,
      selectedTarget,
      selectedTech,
      selectedVendor,
      selectedStandard,
      searchQuery,
      clearAllFilters,
    }
  },
  template: `
    <div class="content-browse">
      <ContentFilters
        :items="allItems"
        :initial-pillar="selectedPillar"
        :initial-target="selectedTarget"
        :initial-technology="selectedTech"
        :initial-vendor="selectedVendor"
        :initial-standard="selectedStandard"
        :initial-search="searchQuery"
        @update:pillar="selectedPillar = $event"
        @update:target="selectedTarget = $event"
        @update:technology="selectedTech = $event"
        @update:vendor="selectedVendor = $event"
        @update:standard="selectedStandard = $event"
        @update:search="searchQuery = $event"
        @clear="clearAllFilters"
      />
      <div class="results-count">
        Showing {{ filteredItems.length }} of {{ allItems.length }} items
      </div>
      <div class="content-grid">
        <ContentCard
          v-for="item in filteredItems"
          :key="item.id"
          :content="item"
        />
      </div>
    </div>
  `,
})

describe('content Browse Integration', () => {
  const mountBrowse = () => {
    return mount(ContentBrowseWrapper, {
      global: {
        stubs: {
          // Stub router-link since we're not in a router context
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    })
  }

  describe('initial state', () => {
    it('displays all content items on load', () => {
      const wrapper = mountBrowse()

      expect(wrapper.text()).toContain('Showing 6 of 6 items')
      expect(wrapper.findAllComponents(ContentCard)).toHaveLength(6)
    })

    it('shows all filter options populated from content', () => {
      const wrapper = mountBrowse()

      // Check that filter dropdowns exist
      expect(wrapper.text()).toContain('Pillar')
      expect(wrapper.text()).toContain('Target')
      expect(wrapper.text()).toContain('Technology')
      expect(wrapper.text()).toContain('Vendor')
      expect(wrapper.text()).toContain('Standard')
    })
  })

  describe('pillar filtering', () => {
    it('filters to validation content only', async () => {
      const wrapper = mountBrowse()

      // Simulate pillar filter change
      await wrapper.findComponent(ContentFilters).vm.$emit('update:pillar', 'validate')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 3 of 6 items')

      // All visible cards should be validation type
      const cards = wrapper.findAllComponents(ContentCard)
      expect(cards).toHaveLength(3)
    })

    it('filters to hardening content only', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:pillar', 'harden')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 2 of 6 items')
    })

    it('filters to normalize pillar (library content)', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:pillar', 'normalize')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 1 of 6 items')
      expect(wrapper.text()).toContain('OHDF Converters')
    })
  })

  describe('target filtering', () => {
    it('filters by specific target platform', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:target', 'Red Hat Enterprise Linux 8')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 2 of 6 items')

      // Both RHEL 8 items (STIG and Ansible)
      expect(wrapper.text()).toContain('Red Hat Enterprise Linux 8 STIG')
      expect(wrapper.text()).toContain('Red Hat Enterprise Linux 8 Ansible')
    })
  })

  describe('technology filtering', () => {
    it('filters by InSpec technology', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:technology', 'InSpec')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 3 of 6 items')
    })

    it('filters by Ansible technology', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:technology', 'Ansible')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 1 of 6 items')
      expect(wrapper.text()).toContain('Ansible Hardening')
    })
  })

  describe('vendor filtering', () => {
    it('filters by MITRE vendor', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:vendor', 'MITRE')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 5 of 6 items')
    })

    it('filters by CIS vendor', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:vendor', 'CIS')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 1 of 6 items')
      expect(wrapper.text()).toContain('MySQL')
    })
  })

  describe('standard filtering', () => {
    it('filters by DISA STIG standard', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:standard', 'DISA STIG')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 4 of 6 items')
    })

    it('filters by CIS Benchmark standard', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:standard', 'CIS Benchmark')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 1 of 6 items')
    })
  })

  describe('combined filters', () => {
    it('applies multiple filters together', async () => {
      const wrapper = mountBrowse()
      const filters = wrapper.findComponent(ContentFilters)

      // Filter: validation + InSpec + MITRE
      await filters.vm.$emit('update:pillar', 'validate')
      await filters.vm.$emit('update:technology', 'InSpec')
      await filters.vm.$emit('update:vendor', 'MITRE')
      await flushPromises()

      // Should show: RHEL 8 STIG, Ubuntu STIG (not MySQL - CIS vendor)
      expect(wrapper.text()).toContain('Showing 2 of 6 items')
    })

    it('can result in zero matches with conflicting filters', async () => {
      const wrapper = mountBrowse()
      const filters = wrapper.findComponent(ContentFilters)

      // Filter: hardening + CIS vendor (no hardening content from CIS)
      await filters.vm.$emit('update:pillar', 'harden')
      await filters.vm.$emit('update:vendor', 'CIS')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 0 of 6 items')
    })
  })

  describe('fuzzy search', () => {
    it('finds content with exact match', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:search', 'MySQL')
      await flushPromises()

      expect(wrapper.text()).toContain('Showing 1 of 6 items')
      expect(wrapper.text()).toContain('MySQL 8.0 CIS Benchmark')
    })

    it('finds "Red Hat" with "redhat" query (fuzzy)', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:search', 'redhat')
      await flushPromises()

      // Should find both RHEL items
      expect(wrapper.findAllComponents(ContentCard).length).toBeGreaterThanOrEqual(1)
      expect(wrapper.text()).toContain('Red Hat')
    })

    it('finds RHEL content with "rhel" query', async () => {
      const wrapper = mountBrowse()

      await wrapper.findComponent(ContentFilters).vm.$emit('update:search', 'rhel')
      await flushPromises()

      // Should match items with RHEL in name or description
      expect(wrapper.findAllComponents(ContentCard).length).toBeGreaterThanOrEqual(1)
    })

    it('combines search with filters', async () => {
      const wrapper = mountBrowse()
      const filters = wrapper.findComponent(ContentFilters)

      // Filter: validation + search "stig"
      await filters.vm.$emit('update:pillar', 'validate')
      await filters.vm.$emit('update:search', 'stig')
      await flushPromises()

      // Should show validation STIGs only
      const count = wrapper.findAllComponents(ContentCard).length
      expect(count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('clear filters', () => {
    it('resets all filters and shows all content', async () => {
      const wrapper = mountBrowse()
      const filters = wrapper.findComponent(ContentFilters)

      // Apply some filters
      await filters.vm.$emit('update:pillar', 'validate')
      await filters.vm.$emit('update:technology', 'InSpec')
      await filters.vm.$emit('update:search', 'rhel')
      await flushPromises()

      // Verify filters are applied
      expect(wrapper.text()).not.toContain('Showing 6 of 6 items')

      // Clear filters
      await filters.vm.$emit('clear')
      await flushPromises()

      // Should show all items again
      expect(wrapper.text()).toContain('Showing 6 of 6 items')
      expect(wrapper.findAllComponents(ContentCard)).toHaveLength(6)
    })
  })
})
