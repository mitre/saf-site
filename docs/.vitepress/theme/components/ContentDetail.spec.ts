import type { ContentItem } from '../composables/useContentDetail'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ContentDetail from './ContentDetail.vue'

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
    pillar: 'validate',
    pillar_name: 'Validate',
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
    ...overrides,
  }
}

// Factory for creating library content items
function createLibraryItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return createContentItem({
    id: 'lib-123',
    slug: 'test-library',
    name: 'Test Library',
    description: 'A test library for testing',
    content_type: 'library',
    pillar: 'normalize',
    pillar_name: 'Normalize',
    target_name: '',
    target_slug: '',
    standard_name: '',
    standard_short_name: '',
    standard_slug: '',
    benchmark_version: '',
    control_count: undefined,
    stig_id: '',
    packages: [{ registry: 'npm', name: '@mitre/test-lib' }],
    ...overrides,
  })
}

/**
 * Helper to find a metadata item by its label
 */
function findMetadataByLabel(wrapper: ReturnType<typeof mount>, label: string) {
  const items = wrapper.findAll('.metadata-item')
  return items.find(item => item.find('.metadata-label').text() === label)
}

/**
 * Helper to get metadata value text by label
 */
function getMetadataValue(wrapper: ReturnType<typeof mount>, label: string): string | undefined {
  const item = findMetadataByLabel(wrapper, label)
  return item?.find('.metadata-text').text()
}

describe('contentDetail', () => {
  describe('rendering', () => {
    it('renders the content name as title', () => {
      const content = createContentItem({ name: 'RHEL8 STIG' })
      const wrapper = mount(ContentDetail, { props: { content } })

      // Title is in ContentHero child component
      expect(wrapper.find('.hero-title').text()).toBe('RHEL8 STIG')
    })

    it('renders the description', () => {
      const content = createContentItem({
        description: 'InSpec validation profile for RHEL 8',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      // Description is in ContentHero child component
      expect(wrapper.find('.hero-description').text()).toBe(
        'InSpec validation profile for RHEL 8',
      )
    })

    it('renders the status in metadata', () => {
      const content = createContentItem({ status: 'active' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const statusValue = getMetadataValue(wrapper, 'Status')
      expect(statusValue).toBe('active')
    })
  })

  describe('benchmark version formatting', () => {
    it('displays STIG version in V{major}R{minor} format', () => {
      const content = createContentItem({
        benchmark_version: '2.2.0',
        standard_name: 'DISA STIG',
        standard_short_name: 'STIG',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      // Benchmark is shown in Standard metadata item
      const standardValue = getMetadataValue(wrapper, 'Standard')
      expect(standardValue).toBe('STIG V2R2')
    })

    it('displays CIS version in semver format', () => {
      const content = createContentItem({
        benchmark_version: '2.0.0',
        standard_name: 'CIS Benchmark',
        standard_short_name: 'CIS',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const standardValue = getMetadataValue(wrapper, 'Standard')
      expect(standardValue).toBe('CIS v2.0.0')
    })

    it('shows standard without version when benchmark_version not provided', () => {
      const content = createContentItem({
        benchmark_version: '',
        standard_name: 'DISA STIG',
        standard_short_name: 'STIG',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      // Should show just the standard name
      const standardValue = getMetadataValue(wrapper, 'Standard')
      expect(standardValue).toBe('STIG')
    })
  })

  describe('profile version', () => {
    it('displays profile version with v prefix', () => {
      const content = createContentItem({ version: '1.2.3' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const profileValue = getMetadataValue(wrapper, 'Profile')
      expect(profileValue).toBe('v1.2.3')
    })

    it('hides profile version when not provided', () => {
      const content = createContentItem({ version: '' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const profileItem = findMetadataByLabel(wrapper, 'Profile')
      expect(profileItem).toBeUndefined()
    })
  })

  describe('breadcrumb navigation', () => {
    it('links to /content/ for validation profiles', () => {
      const content = createContentItem({ content_type: 'validation' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const breadcrumbLink = wrapper.find('.breadcrumb a')
      expect(breadcrumbLink.attributes('href')).toBe('/content/')
      expect(breadcrumbLink.text()).toBe('Content Library')
    })

    it('links to /content/ for hardening profiles', () => {
      const content = createContentItem({ content_type: 'hardening' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const breadcrumbLink = wrapper.find('.breadcrumb a')
      expect(breadcrumbLink.attributes('href')).toBe('/content/')
      expect(breadcrumbLink.text()).toBe('Content Library')
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
        github_url: 'https://github.com/mitre/rhel8-stig',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      // Action buttons now use ActionButtons component with .action-btn.primary
      const primaryBtn = wrapper.find('.action-btn.primary')
      expect(primaryBtn.text()).toBe('View on GitHub')
      expect(primaryBtn.attributes('href')).toBe('https://github.com/mitre/rhel8-stig')
    })

    it('renders README link as secondary action', () => {
      const content = createContentItem({
        github_url: 'https://github.com/mitre/rhel8-stig',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      // Non-primary buttons don't have the .primary class
      const allBtns = wrapper.findAll('.action-btn')
      const readmeBtn = allBtns.find(btn => btn.text() === 'View README')
      expect(readmeBtn?.attributes('href')).toBe('https://github.com/mitre/rhel8-stig#readme')
    })

    it('hides actions section when no URLs', () => {
      const content = createContentItem({ github_url: '' })
      const wrapper = mount(ContentDetail, { props: { content } })

      // ActionButtons component won't render anything
      expect(wrapper.find('.action-buttons').exists()).toBe(false)
    })
  })

  describe('metadata items', () => {
    it('renders metadata items for available metadata', () => {
      const content = createContentItem({
        target_name: 'RHEL 8',
        standard_name: 'DISA STIG',
        standard_short_name: 'STIG',
        technology_name: 'InSpec',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      // Uses ContentHero with .metadata-item
      const items = wrapper.findAll('.metadata-item')
      expect(items.length).toBeGreaterThanOrEqual(3)

      expect(getMetadataValue(wrapper, 'Target')).toBe('RHEL 8')
      expect(getMetadataValue(wrapper, 'Standard')).toContain('STIG')
      expect(getMetadataValue(wrapper, 'Tech')).toBe('InSpec')
    })

    it('includes vendor metadata when provided', () => {
      const content = createContentItem({
        vendor_name: 'MITRE',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(getMetadataValue(wrapper, 'Vendor')).toBe('MITRE')
    })

    it('includes maintainer metadata when provided', () => {
      const content = createContentItem({
        maintainer_name: 'SAF Team',
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(getMetadataValue(wrapper, 'Maintainer')).toBe('SAF Team')
    })
  })

  describe('control count', () => {
    it('displays control count when provided', () => {
      const content = createContentItem({ control_count: 247 })
      const wrapper = mount(ContentDetail, { props: { content } })

      expect(getMetadataValue(wrapper, 'Controls')).toBe('247')
    })

    it('hides control count when zero', () => {
      const content = createContentItem({ control_count: 0 })
      const wrapper = mount(ContentDetail, { props: { content } })

      const controlsItem = findMetadataByLabel(wrapper, 'Controls')
      expect(controlsItem).toBeUndefined()
    })
  })

  describe('library content', () => {
    it('uses pillar field for pillar badge', () => {
      const content = createLibraryItem({ pillar: 'normalize' })
      const wrapper = mount(ContentDetail, { props: { content } })

      // PillarBadge should show Normalize
      const badge = wrapper.find('[title="Normalize"]')
      expect(badge.exists()).toBe(true)
    })

    it('hides controls metadata for libraries', () => {
      const content = createLibraryItem()
      const wrapper = mount(ContentDetail, { props: { content } })

      const controlsItem = findMetadataByLabel(wrapper, 'Controls')
      expect(controlsItem).toBeUndefined()
    })

    it('hides standard metadata for libraries', () => {
      const content = createLibraryItem()
      const wrapper = mount(ContentDetail, { props: { content } })

      const standardItem = findMetadataByLabel(wrapper, 'Standard')
      expect(standardItem).toBeUndefined()
    })

    it('hides profile version metadata for libraries', () => {
      const content = createLibraryItem({ version: '1.0.0' })
      const wrapper = mount(ContentDetail, { props: { content } })

      const profileItem = findMetadataByLabel(wrapper, 'Profile')
      expect(profileItem).toBeUndefined()
    })

    it('shows packages metadata for libraries', () => {
      const content = createLibraryItem({
        packages: [{ registry: 'npm', name: '@mitre/hdf-converters' }],
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const packagesItem = findMetadataByLabel(wrapper, 'Packages')
      expect(packagesItem).toBeDefined()
      expect(getMetadataValue(wrapper, 'Packages')).toContain('@mitre/hdf-converters')
    })

    it('shows package registry links in actions', () => {
      const content = createLibraryItem({
        github_url: 'https://github.com/mitre/inspecjs',
        packages: [{ registry: 'npm', name: '@mitre/inspecjs' }],
      })
      const wrapper = mount(ContentDetail, { props: { content } })

      const allBtns = wrapper.findAll('.action-btn')
      const npmBtn = allBtns.find(btn => btn.text().includes('npm'))
      expect(npmBtn).toBeDefined()
      expect(npmBtn?.attributes('href')).toContain('npmjs.com/package/@mitre/inspecjs')
    })
  })
})

// ============================================================================
// README MARKDOWN RENDERING
//
// Regression guard for the bug where content.readme_markdown was stored as
// rich-text HTML ("<p># Heading</p>") instead of markdown, so the detail page
// showed raw '#' characters. Rendering happens in onMounted via async shiki,
// so this is the only automated way to observe the rendered output — the SSG
// HTML always ships an empty div.
// ============================================================================

describe('contentDetail README rendering', () => {
  async function mountAndRenderReadme(readme: string) {
    const wrapper = mount(ContentDetail, {
      props: { content: createContentItem({ readme_markdown: readme }) },
    })
    // onMounted kicks off async shiki highlighting; wait for the v-html
    // content itself to land (the empty wrapper div exists immediately)
    await vi.waitFor(() => {
      const el = wrapper.find('.readme-content')
      expect(el.exists()).toBe(true)
      expect(el.element.innerHTML.length).toBeGreaterThan(0)
    }, { timeout: 15000, interval: 50 })
    return wrapper.find('.readme-content').element.innerHTML
  }

  it('renders markdown headings as real heading elements, not literal characters', async () => {
    const html = await mountAndRenderReadme('# RHEL 9 STIG Profile\n\nSome description text.\n')

    expect(html).toContain('<h1')
    expect(html).toContain('RHEL 9 STIG Profile')
    // the '#' must be consumed by the renderer, not shown to the reader
    expect(html).not.toContain('# RHEL 9 STIG Profile')
  }, 20000)

  it('renders fenced code blocks', async () => {
    const html = await mountAndRenderReadme('# Title\n\n```bash\ninspec exec profile\n```\n')

    expect(html).toMatch(/<pre|shiki/)
    // shiki tokenizes the code into spans, so assert on the text content
    expect(html.replace(/<[^>]+>/g, '')).toContain('inspec exec profile')
  }, 20000)

  it('surfaces the corruption if HTML-wrapped markdown is ever stored again', async () => {
    // This is what the bad rhel9 record looked like: markdown wrapped in <p>
    const html = await mountAndRenderReadme('<p># RHEL 9 STIG Profile</p>\n')

    // The '#' survives as literal text and no heading is produced — exactly
    // the reported bug. If this assertion ever flips, the renderer changed.
    expect(html).toContain('# RHEL 9 STIG Profile')
    expect(html).not.toContain('<h1')
  }, 20000)
})
