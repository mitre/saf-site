import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentDetail from './ContentDetail.vue'
import type { ContentItem } from '../composables/useContentDetail'

// Factory for creating test content items
function createContentItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: 'test-123',
    slug: 'test-profile',
    name: 'Test Profile',
    description: 'A test profile for testing',
    version: '1.0.0',
    status: 'active',
    content_type: 'validation',
    target_name: 'Test Target',
    target_slug: 'test-target',
    standard_name: 'DISA STIG',
    standard_short_name: 'STIG',
    standard_slug: 'stig',
    technology_name: 'InSpec',
    technology_slug: 'inspec',
    vendor_name: 'Test Vendor',
    vendor_slug: 'test-vendor',
    maintainer_name: 'Test Maintainer',
    maintainer_slug: 'test-maintainer',
    github_url: 'https://github.com/test/repo',
    benchmark_version: '2.2.0',
    ...overrides
  }
}

describe('ContentDetail', () => {
  describe('rendering', () => {
    it('renders the content name as title', () => {
      const content = createContentItem({ name: 'RHEL8 STIG' })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.content-title').text()).toBe('RHEL8 STIG')
    })

    it('renders the description', () => {
      const content = createContentItem({
        description: 'InSpec validation profile for RHEL 8'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.content-description').text()).toBe(
        'InSpec validation profile for RHEL 8'
      )
    })

    it('renders the status tag', () => {
      const content = createContentItem({ status: 'active' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const statusTag = wrapper.find('.tag-active')
      expect(statusTag.exists()).toBe(true)
      expect(statusTag.text()).toBe('active')
    })
  })

  describe('benchmark version formatting', () => {
    it('displays STIG version in V{major}R{minor} format', () => {
      const content = createContentItem({
        benchmark_version: '2.2.0',
        standard_name: 'DISA STIG',
        standard_short_name: 'STIG'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.benchmark-version').text()).toBe('STIG V2R2')
    })

    it('displays CIS version in semver format', () => {
      const content = createContentItem({
        benchmark_version: '2.0.0',
        standard_name: 'CIS Benchmark',
        standard_short_name: 'CIS'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.benchmark-version').text()).toBe('CIS v2.0.0')
    })

    it('hides benchmark version when not provided', () => {
      const content = createContentItem({ benchmark_version: '' })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.benchmark-version').exists()).toBe(false)
    })
  })

  describe('profile version', () => {
    it('displays profile version with v prefix', () => {
      const content = createContentItem({ version: '1.2.3' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const versionTag = wrapper.find('.tag-version')
      expect(versionTag.text()).toBe('Profile v1.2.3')
    })

    it('hides profile version tag when not provided', () => {
      const content = createContentItem({ version: '' })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.tag-version').exists()).toBe(false)
    })
  })

  describe('breadcrumb navigation', () => {
    it('links to /validate/ for validation profiles', () => {
      const content = createContentItem({ content_type: 'validation' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const breadcrumbLink = wrapper.find('.breadcrumb a')
      expect(breadcrumbLink.attributes('href')).toBe('/validate/')
      expect(breadcrumbLink.text()).toBe('Validate')
    })

    it('links to /harden/ for hardening profiles', () => {
      const content = createContentItem({ content_type: 'hardening' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const breadcrumbLink = wrapper.find('.breadcrumb a')
      expect(breadcrumbLink.attributes('href')).toBe('/harden/')
      expect(breadcrumbLink.text()).toBe('Harden')
    })

    it('shows content name as current breadcrumb', () => {
      const content = createContentItem({ name: 'Ubuntu 20.04 CIS' })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.breadcrumb .current').text()).toBe('Ubuntu 20.04 CIS')
    })
  })

  describe('action buttons', () => {
    it('renders GitHub link as primary action', () => {
      const content = createContentItem({
        github_url: 'https://github.com/mitre/rhel8-stig'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const primaryBtn = wrapper.find('.action-btn.brand')
      expect(primaryBtn.text()).toBe('View on GitHub')
      expect(primaryBtn.attributes('href')).toBe('https://github.com/mitre/rhel8-stig')
    })

    it('renders README link as secondary action', () => {
      const content = createContentItem({
        github_url: 'https://github.com/mitre/rhel8-stig'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const altBtns = wrapper.findAll('.action-btn.alt')
      const readmeBtn = altBtns.find(btn => btn.text() === 'View README')
      expect(readmeBtn?.attributes('href')).toBe('https://github.com/mitre/rhel8-stig#readme')
    })

    it('hides actions section when no URLs', () => {
      const content = createContentItem({ github_url: '' })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.content-actions').exists()).toBe(false)
    })
  })

  describe('feature cards', () => {
    it('renders feature cards for available metadata', () => {
      const content = createContentItem({
        target_name: 'RHEL 8',
        standard_name: 'DISA STIG',
        technology_name: 'InSpec'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const cards = wrapper.findAll('.feature-card')
      expect(cards.length).toBeGreaterThanOrEqual(3)

      const titles = cards.map(c => c.find('.feature-title').text())
      expect(titles).toContain('Target')
      expect(titles).toContain('Standard')
      expect(titles).toContain('Technology')
    })

    it('shows STIG ID card for validation profiles', () => {
      const content = createContentItem({
        content_type: 'validation',
        stig_id: 'RHEL-08-010010'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const stigCard = wrapper.findAll('.feature-card').find(
        c => c.find('.feature-title').text() === 'STIG ID'
      )
      expect(stigCard).toBeDefined()
      expect(stigCard?.find('.feature-detail').text()).toBe('RHEL-08-010010')
    })

    it('applies mono styling to STIG ID', () => {
      const content = createContentItem({
        content_type: 'validation',
        stig_id: 'RHEL-08-010010'
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const stigCard = wrapper.findAll('.feature-card').find(
        c => c.find('.feature-title').text() === 'STIG ID'
      )
      expect(stigCard?.find('.feature-detail').classes()).toContain('mono')
    })
  })

  describe('control count', () => {
    it('displays control count when provided', () => {
      const content = createContentItem({ control_count: 247 })
      const wrapper = mount(ContentDetail, { props: { content } })

      const controlsTag = wrapper.find('.tag-controls')
      expect(controlsTag.text()).toBe('247 controls')
    })

    it('hides control count when zero', () => {
      const content = createContentItem({ control_count: 0 })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(wrapper.find('.tag-controls').exists()).toBe(false)
    })
  })
})
