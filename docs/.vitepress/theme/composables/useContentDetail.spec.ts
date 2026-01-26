import type { ContentItem } from './useContentDetail'
import { describe, expect, it } from 'vitest'
import { useContentDetail } from './useContentDetail'

// Factory for creating test content items
function createContentItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: 'test-123',
    slug: 'test-profile',
    name: 'Test Profile',
    description: 'A test profile for testing',
    version: '1.0.0',
    status: 'active',
    contentType: 'validation',
    targetName: 'Test Target',
    targetSlug: 'test-target',
    standardName: 'Test Standard',
    standardShortName: 'TEST',
    standardSlug: 'test-standard',
    technologyName: 'Test Tech',
    technologySlug: 'test-tech',
    vendorName: 'Test Vendor',
    vendorSlug: 'test-vendor',
    maintainerName: 'Test Maintainer',
    maintainerSlug: 'test-maintainer',
    githubUrl: 'https://github.com/test/repo',
    ...overrides,
  }
}

describe('useContentDetail', () => {
  describe('formattedBenchmarkVersion', () => {
    it('formats STIG version as V{major}R{minor}', () => {
      const content = createContentItem({
        benchmarkVersion: '2.2.0',
        standardName: 'DISA STIG',
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('V2R2')
    })

    it('handles STIG with case-insensitive matching', () => {
      const content = createContentItem({
        benchmarkVersion: '1.5.3',
        standardName: 'Security Technical Implementation Guide (STIG)',
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('V1R5')
    })

    it('formats CIS version as semver with v prefix', () => {
      const content = createContentItem({
        benchmarkVersion: '2.0.0',
        standardName: 'CIS Benchmark',
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('v2.0.0')
    })

    it('uses standardShortName as fallback for STIG detection', () => {
      const content = createContentItem({
        benchmarkVersion: '3.1.0',
        standardName: '',
        standardShortName: 'STIG',
      })
      const { formattedBenchmarkVersion } = useContentDetail(content)
      expect(formattedBenchmarkVersion.value).toBe('V3R1')
    })

    it('returns empty string when no benchmark version', () => {
      const content = createContentItem({
        benchmarkVersion: '',
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
        benchmarkVersion: '2.2.0',
        standardName: 'DISA STIG',
        standardShortName: 'STIG',
      })
      const { benchmarkLabel } = useContentDetail(content)
      expect(benchmarkLabel.value).toBe('STIG V2R2')
    })

    it('uses "Benchmark" as fallback when no short name', () => {
      const content = createContentItem({
        benchmarkVersion: '1.0.0',
        standardName: 'CIS',
        standardShortName: '',
      })
      const { benchmarkLabel } = useContentDetail(content)
      expect(benchmarkLabel.value).toBe('Benchmark v1.0.0')
    })

    it('returns empty string when no benchmark version', () => {
      const content = createContentItem({ benchmarkVersion: '' })
      const { benchmarkLabel } = useContentDetail(content)
      expect(benchmarkLabel.value).toBe('')
    })
  })

  describe('isValidation / isHardening', () => {
    it('identifies validation profiles', () => {
      const content = createContentItem({ contentType: 'validation' })
      const { isValidation, isHardening } = useContentDetail(content)
      expect(isValidation.value).toBe(true)
      expect(isHardening.value).toBe(false)
    })

    it('identifies hardening profiles', () => {
      const content = createContentItem({ contentType: 'hardening' })
      const { isValidation, isHardening } = useContentDetail(content)
      expect(isValidation.value).toBe(false)
      expect(isHardening.value).toBe(true)
    })
  })

  describe('actionUrls', () => {
    it('includes GitHub URLs when available', () => {
      const content = createContentItem({
        githubUrl: 'https://github.com/mitre/rhel8-stig',
      })
      const { actionUrls } = useContentDetail(content)

      expect(actionUrls.value).toHaveLength(2)
      expect(actionUrls.value[0]).toEqual({
        label: 'View on GitHub',
        url: 'https://github.com/mitre/rhel8-stig',
        primary: true,
      })
      expect(actionUrls.value[1]).toEqual({
        label: 'View README',
        url: 'https://github.com/mitre/rhel8-stig#readme',
        primary: false,
      })
    })

    it('always shows GitHub and README links', () => {
      const content = createContentItem({
        githubUrl: 'https://github.com/test/repo',
        documentationUrl: '',
      })
      const { actionUrls } = useContentDetail(content)

      expect(actionUrls.value).toHaveLength(2)
      expect(actionUrls.value.map(u => u.label)).toEqual([
        'View on GitHub',
        'View README',
      ])
      expect(actionUrls.value[1].url).toBe('https://github.com/test/repo#readme')
    })

    it('adds Documentation link when documentationUrl exists', () => {
      const content = createContentItem({
        githubUrl: 'https://github.com/test/repo',
        documentationUrl: 'https://docs.example.com',
      })
      const { actionUrls } = useContentDetail(content)

      // All three buttons: GitHub, README, and Documentation
      expect(actionUrls.value).toHaveLength(3)
      expect(actionUrls.value.map(u => u.label)).toEqual([
        'View on GitHub',
        'View README',
        'Documentation',
      ])
      expect(actionUrls.value[2].url).toBe('https://docs.example.com')
    })

    it('returns empty array when no GitHub URL', () => {
      const content = createContentItem({
        githubUrl: '',
      })
      const { actionUrls } = useContentDetail(content)
      expect(actionUrls.value).toHaveLength(0)
    })

    it('adds reference URL with standard short name when available', () => {
      const content = createContentItem({
        githubUrl: 'https://github.com/test/repo',
        referenceUrl: 'https://public.cyber.mil/stigs/',
        standardShortName: 'STIG',
      })
      const { actionUrls } = useContentDetail(content)

      const refUrl = actionUrls.value.find(u => u.label.includes('Reference'))
      expect(refUrl).toBeDefined()
      expect(refUrl?.label).toBe('STIG Reference')
      expect(refUrl?.url).toBe('https://public.cyber.mil/stigs/')
    })

    it('uses generic label when no standard short name', () => {
      const content = createContentItem({
        githubUrl: 'https://github.com/test/repo',
        referenceUrl: 'https://example.com/standard',
        standardShortName: '',
      })
      const { actionUrls } = useContentDetail(content)

      const refUrl = actionUrls.value.find(u => u.label.includes('Reference'))
      expect(refUrl?.label).toBe('Standard Reference')
    })
  })

  describe('featureCards', () => {
    it('includes all available metadata fields', () => {
      const content = createContentItem({
        targetName: 'Red Hat Enterprise Linux 8',
        standardName: 'DISA STIG',
        technologyName: 'InSpec',
        vendorName: 'Red Hat',
        maintainerName: 'MITRE SAF Team',
      })
      const { featureCards } = useContentDetail(content)

      expect(featureCards.value).toHaveLength(5)
      expect(featureCards.value.map(c => c.title)).toEqual([
        'Target',
        'Standard',
        'Technology',
        'Vendor',
        'Maintainer',
      ])
    })

    it('includes STIG ID for validation profiles', () => {
      const content = createContentItem({
        contentType: 'validation',
        stigId: 'RHEL-08-010010',
      })
      const { featureCards } = useContentDetail(content)

      const stigCard = featureCards.value.find(c => c.title === 'STIG ID')
      expect(stigCard).toBeDefined()
      expect(stigCard?.value).toBe('RHEL-08-010010')
    })

    it('excludes STIG ID for hardening profiles', () => {
      const content = createContentItem({
        contentType: 'hardening',
        stigId: 'RHEL-08-010010',
      })
      const { featureCards } = useContentDetail(content)

      const stigCard = featureCards.value.find(c => c.title === 'STIG ID')
      expect(stigCard).toBeUndefined()
    })

    it('excludes cards for empty fields', () => {
      const content = createContentItem({
        targetName: 'Test Target',
        standardName: '',
        technologyName: '',
        vendorName: '',
        maintainerName: '',
      })
      const { featureCards } = useContentDetail(content)

      expect(featureCards.value).toHaveLength(1)
      expect(featureCards.value[0].title).toBe('Target')
    })
  })

  describe('quickStart', () => {
    it('interpolates {github} variable', () => {
      const content = createContentItem({
        githubUrl: 'https://github.com/mitre/rhel8',
        quickStartTemplate: 'git clone {github}',
      })
      const { quickStart } = useContentDetail(content)
      expect(quickStart.value).toBe('git clone https://github.com/mitre/rhel8')
    })

    it('interpolates {slug} variable', () => {
      const content = createContentItem({
        slug: 'rhel8-stig',
        quickStartTemplate: 'cd {slug}',
      })
      const { quickStart } = useContentDetail(content)
      expect(quickStart.value).toBe('cd rhel8-stig')
    })

    it('interpolates {vendor_slug} variable', () => {
      const content = createContentItem({
        vendorSlug: 'mitre',
        quickStartTemplate: 'ansible-galaxy install {vendor_slug}.role',
      })
      const { quickStart } = useContentDetail(content)
      expect(quickStart.value).toBe('ansible-galaxy install mitre.role')
    })

    it('interpolates multiple variables', () => {
      const content = createContentItem({
        githubUrl: 'https://github.com/mitre/test',
        slug: 'test-profile',
        quickStartTemplate: 'git clone {github}\ncd {slug}',
      })
      const { quickStart } = useContentDetail(content)
      expect(quickStart.value).toBe('git clone https://github.com/mitre/test\ncd test-profile')
    })

    it('returns empty string when no template', () => {
      const content = createContentItem({ quickStartTemplate: '' })
      const { quickStart } = useContentDetail(content)
      expect(quickStart.value).toBe('')
    })
  })

  describe('prerequisites', () => {
    it('returns prerequisites template as-is', () => {
      const content = createContentItem({
        prerequisitesTemplate: '- InSpec 5.x\n- SSH access',
      })
      const { prerequisites } = useContentDetail(content)
      expect(prerequisites.value).toBe('- InSpec 5.x\n- SSH access')
    })

    it('returns empty string when no template', () => {
      const content = createContentItem({ prerequisitesTemplate: '' })
      const { prerequisites } = useContentDetail(content)
      expect(prerequisites.value).toBe('')
    })
  })

  describe('content availability flags', () => {
    it('hasQuickStart is true when template exists', () => {
      const content = createContentItem({
        quickStartTemplate: 'some content',
      })
      const { hasQuickStart } = useContentDetail(content)
      expect(hasQuickStart.value).toBe(true)
    })

    it('hasQuickStart is false when template is empty', () => {
      const content = createContentItem({ quickStartTemplate: '' })
      const { hasQuickStart } = useContentDetail(content)
      expect(hasQuickStart.value).toBe(false)
    })

    it('hasPrerequisites is true when template exists', () => {
      const content = createContentItem({
        prerequisitesTemplate: '- Requirement 1',
      })
      const { hasPrerequisites } = useContentDetail(content)
      expect(hasPrerequisites.value).toBe(true)
    })

    it('hasReadme is true when readmeMarkdown exists', () => {
      const content = createContentItem({
        readmeMarkdown: '# README content',
      })
      const { hasReadme } = useContentDetail(content)
      expect(hasReadme.value).toBe(true)
    })

    it('hasReadme is false when readmeMarkdown is empty', () => {
      const content = createContentItem({ readmeMarkdown: '' })
      const { hasReadme } = useContentDetail(content)
      expect(hasReadme.value).toBe(false)
    })
  })
})
