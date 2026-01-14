import { describe, it, expect } from 'vitest'
import { useContentDetail, type ContentItem } from './useContentDetail'

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
    standard_name: 'Test Standard',
    standard_short_name: 'TEST',
    standard_slug: 'test-standard',
    technology_name: 'Test Tech',
    technology_slug: 'test-tech',
    vendor_name: 'Test Vendor',
    vendor_slug: 'test-vendor',
    maintainer_name: 'Test Maintainer',
    maintainer_slug: 'test-maintainer',
    github_url: 'https://github.com/test/repo',
    ...overrides
  }
}

describe('useContentDetail', () => {
  describe('formattedBenchmarkVersion', () => {
    it('formats STIG version as V{major}R{minor}', () => {
      const content = createContentItem({
        benchmark_version: '2.2.0',
        standard_name: 'DISA STIG'
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('V2R2')
    })

    it('handles STIG with case-insensitive matching', () => {
      const content = createContentItem({
        benchmark_version: '1.5.3',
        standard_name: 'Security Technical Implementation Guide (STIG)'
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('V1R5')
    })

    it('formats CIS version as semver with v prefix', () => {
      const content = createContentItem({
        benchmark_version: '2.0.0',
        standard_name: 'CIS Benchmark'
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('v2.0.0')
    })

    it('uses standard_short_name as fallback for STIG detection', () => {
      const content = createContentItem({
        benchmark_version: '3.1.0',
        standard_name: '',
        standard_short_name: 'STIG'
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('V3R1')
    })

    it('returns empty string when no benchmark version', () => {
      const content = createContentItem({
        benchmark_version: ''
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('')
    })
  })

  describe('formattedProfileVersion', () => {
    it('adds v prefix to version', () => {
      const content = createContentItem({ version: '1.2.3' })
      const { formattedProfileVersion } = useContentDetail(content)
      expect(formattedProfileVersion.value).toBe('v1.2.3')
    })

    it('returns empty string when no version', () => {
      const content = createContentItem({ version: '' })
      const { formattedProfileVersion } = useContentDetail(content)
      expect(formattedProfileVersion.value).toBe('')
    })
  })

  describe('benchmarkLabel', () => {
    it('combines standard short name with formatted version', () => {
      const content = createContentItem({
        benchmark_version: '2.2.0',
        standard_name: 'DISA STIG',
        standard_short_name: 'STIG'
      })
      const { benchmarkLabel } = useContentDetail(content)
      expect(benchmarkLabel.value).toBe('STIG V2R2')
    })

    it('uses "Benchmark" as fallback when no short name', () => {
      const content = createContentItem({
        benchmark_version: '1.0.0',
        standard_name: 'CIS',
        standard_short_name: ''
      })
      const { benchmarkLabel } = useContentDetail(content)
      expect(benchmarkLabel.value).toBe('Benchmark v1.0.0')
    })

    it('returns empty string when no benchmark version', () => {
      const content = createContentItem({ benchmark_version: '' })
      const { benchmarkLabel } = useContentDetail(content)
      expect(benchmarkLabel.value).toBe('')
    })
  })

  describe('isValidation / isHardening', () => {
    it('identifies validation profiles', () => {
      const content = createContentItem({ content_type: 'validation' })
      const { isValidation, isHardening } = useContentDetail(content)
      expect(isValidation.value).toBe(true)
      expect(isHardening.value).toBe(false)
    })

    it('identifies hardening profiles', () => {
      const content = createContentItem({ content_type: 'hardening' })
      const { isValidation, isHardening } = useContentDetail(content)
      expect(isValidation.value).toBe(false)
      expect(isHardening.value).toBe(true)
    })
  })

  describe('actionUrls', () => {
    it('includes GitHub URLs when available', () => {
      const content = createContentItem({
        github_url: 'https://github.com/mitre/rhel8-stig'
      })
      const { actionUrls } = useContentDetail(content)

      expect(actionUrls.value).toHaveLength(2)
      expect(actionUrls.value[0]).toEqual({
        label: 'View on GitHub',
        url: 'https://github.com/mitre/rhel8-stig',
        primary: true
      })
      expect(actionUrls.value[1]).toEqual({
        label: 'View README',
        url: 'https://github.com/mitre/rhel8-stig#readme',
        primary: false
      })
    })

    it('always shows GitHub and README links', () => {
      const content = createContentItem({
        github_url: 'https://github.com/test/repo',
        documentation_url: ''
      })
      const { actionUrls } = useContentDetail(content)

      expect(actionUrls.value).toHaveLength(2)
      expect(actionUrls.value.map(u => u.label)).toEqual([
        'View on GitHub',
        'View README'
      ])
      expect(actionUrls.value[1].url).toBe('https://github.com/test/repo#readme')
    })

    it('adds Documentation link when documentation_url exists', () => {
      const content = createContentItem({
        github_url: 'https://github.com/test/repo',
        documentation_url: 'https://docs.example.com'
      })
      const { actionUrls } = useContentDetail(content)

      // All three buttons: GitHub, README, and Documentation
      expect(actionUrls.value).toHaveLength(3)
      expect(actionUrls.value.map(u => u.label)).toEqual([
        'View on GitHub',
        'View README',
        'Documentation'
      ])
      expect(actionUrls.value[2].url).toBe('https://docs.example.com')
    })

    it('returns empty array when no GitHub URL', () => {
      const content = createContentItem({
        github_url: ''
      })
      const { actionUrls } = useContentDetail(content)
      expect(actionUrls.value).toHaveLength(0)
    })
  })

  describe('featureCards', () => {
    it('includes all available metadata fields', () => {
      const content = createContentItem({
        target_name: 'Red Hat Enterprise Linux 8',
        standard_name: 'DISA STIG',
        technology_name: 'InSpec',
        vendor_name: 'Red Hat',
        maintainer_name: 'MITRE SAF Team'
      })
      const { featureCards } = useContentDetail(content)

      expect(featureCards.value).toHaveLength(5)
      expect(featureCards.value.map(c => c.title)).toEqual([
        'Target', 'Standard', 'Technology', 'Vendor', 'Maintainer'
      ])
    })

    it('includes STIG ID for validation profiles', () => {
      const content = createContentItem({
        content_type: 'validation',
        stig_id: 'RHEL-08-010010'
      })
      const { featureCards } = useContentDetail(content)

      const stigCard = featureCards.value.find(c => c.title === 'STIG ID')
      expect(stigCard).toBeDefined()
      expect(stigCard?.value).toBe('RHEL-08-010010')
    })

    it('excludes STIG ID for hardening profiles', () => {
      const content = createContentItem({
        content_type: 'hardening',
        stig_id: 'RHEL-08-010010'
      })
      const { featureCards } = useContentDetail(content)

      const stigCard = featureCards.value.find(c => c.title === 'STIG ID')
      expect(stigCard).toBeUndefined()
    })

    it('excludes cards for empty fields', () => {
      const content = createContentItem({
        target_name: 'Test Target',
        standard_name: '',
        technology_name: '',
        vendor_name: '',
        maintainer_name: ''
      })
      const { featureCards } = useContentDetail(content)

      expect(featureCards.value).toHaveLength(1)
      expect(featureCards.value[0].title).toBe('Target')
    })
  })
})
