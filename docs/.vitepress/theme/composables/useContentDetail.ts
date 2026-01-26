import type { ComputedRef } from 'vue'
import { computed } from 'vue'

/**
 * Content item from database (validation or hardening profile)
 * Uses camelCase field names (JS/TS convention)
 */
export interface ContentItem {
  id: string
  slug: string
  name: string
  description: string
  longDescription?: string
  version: string
  status: string
  contentType: 'validation' | 'hardening'
  // Target
  targetName: string
  targetSlug: string
  // Standard
  standardName: string
  standardShortName: string
  standardSlug: string
  // Technology
  technologyName: string
  technologySlug: string
  technologyLogo?: string
  // Vendor
  vendorName: string
  vendorSlug: string
  vendorLogo?: string
  // Maintainer
  maintainerName: string
  maintainerSlug: string
  maintainerLogo?: string
  // Links
  githubUrl: string
  documentationUrl?: string
  referenceUrl?: string
  // README content
  readmeUrl?: string
  readmeMarkdown?: string
  // Technology templates
  quickStartTemplate?: string
  prerequisitesTemplate?: string
  // Domain-specific (validation)
  controlCount?: number
  stigId?: string
  benchmarkVersion?: string
  license?: string
  releaseDate?: string
}

export interface ContentDetailReturn {
  /** Formatted benchmark version (e.g., "V2R2" for STIG, "v2.0.0" for CIS) */
  formattedBenchmarkVersion: ComputedRef<string>
  /** Formatted profile version with "v" prefix */
  formattedProfileVersion: ComputedRef<string>
  /** Combined standard + version label (e.g., "STIG V2R2") */
  benchmarkLabel: ComputedRef<string>
  /** Action URLs based on content type */
  actionUrls: ComputedRef<ActionUrl[]>
  /** Feature cards to display */
  featureCards: ComputedRef<FeatureCard[]>
  /** Whether this is a validation profile */
  isValidation: ComputedRef<boolean>
  /** Whether this is a hardening profile */
  isHardening: ComputedRef<boolean>
  /** Interpolated quick start template */
  quickStart: ComputedRef<string>
  /** Interpolated prerequisites template */
  prerequisites: ComputedRef<string>
  /** Whether quick start content is available */
  hasQuickStart: ComputedRef<boolean>
  /** Whether prerequisites content is available */
  hasPrerequisites: ComputedRef<boolean>
  /** Whether README content is available */
  hasReadme: ComputedRef<boolean>
}

export interface ActionUrl {
  label: string
  url: string
  primary: boolean
}

export interface FeatureCard {
  icon: string
  title: string
  value: string
}

/**
 * Format benchmark version based on standard type
 * STIG: 2.5.3 → V2R5 (Version.Release.ProfilePatch)
 * CIS/Others: 2.0.0 → v2.0.0 (keep semver)
 */
function formatBenchmarkVersion(version: string, standardName: string): string {
  if (!version)
    return ''

  // STIG uses V{major}R{minor} format
  if (standardName?.toLowerCase().includes('stig')) {
    const parts = version.split('.')
    const major = parts[0] || '0'
    const minor = parts[1] || '0'
    return `V${major}R${minor}`
  }

  // CIS and others keep semver format
  return `v${version}`
}

/**
 * Interpolate template variables with content values
 * Supported variables: {github}, {slug}, {vendorSlug}, {name}
 */
function interpolateTemplate(template: string, content: ContentItem): string {
  if (!template)
    return ''

  return template
    .replace(/\{github\}/g, content.githubUrl || '')
    .replace(/\{slug\}/g, content.slug || '')
    .replace(/\{vendor_slug\}/g, content.vendorSlug || '') // Keep legacy template var
    .replace(/\{vendorSlug\}/g, content.vendorSlug || '')
    .replace(/\{name\}/g, content.name || '')
}

/**
 * Composable for content detail page logic
 * Extracts formatting, URLs, and display configuration from component
 */
export function useContentDetail(content: ContentItem): ContentDetailReturn {
  const isValidation = computed(() => content.contentType === 'validation')
  const isHardening = computed(() => content.contentType === 'hardening')

  const formattedBenchmarkVersion = computed(() => {
    return formatBenchmarkVersion(
      content.benchmarkVersion || '',
      content.standardName || content.standardShortName,
    )
  })

  const formattedProfileVersion = computed(() => {
    return content.version ? `v${content.version}` : ''
  })

  const benchmarkLabel = computed(() => {
    const version = formattedBenchmarkVersion.value
    if (!version)
      return ''
    const standard = content.standardShortName || 'Benchmark'
    return `${standard} ${version}`
  })

  const actionUrls = computed<ActionUrl[]>(() => {
    const urls: ActionUrl[] = []

    if (content.githubUrl) {
      // Always show GitHub
      urls.push({
        label: 'View on GitHub',
        url: content.githubUrl,
        primary: true,
      })

      // Always show README
      urls.push({
        label: 'View README',
        url: `${content.githubUrl}#readme`,
        primary: false,
      })
    }

    // Additionally show Documentation if custom docs URL exists
    if (content.documentationUrl) {
      urls.push({
        label: 'Documentation',
        url: content.documentationUrl,
        primary: false,
      })
    }

    // Show reference URL (STIG, CIS benchmark, etc.)
    if (content.referenceUrl) {
      urls.push({
        label: content.standardShortName
          ? `${content.standardShortName} Reference`
          : 'Standard Reference',
        url: content.referenceUrl,
        primary: false,
      })
    }

    // Future: Add content-type specific URLs for hardening profiles
    // - Ansible Galaxy: https://galaxy.ansible.com/...
    // - Chef Supermarket: https://supermarket.chef.io/...
    // - Terraform Registry: https://registry.terraform.io/...

    return urls
  })

  const featureCards = computed<FeatureCard[]>(() => {
    const cards: FeatureCard[] = []

    if (content.targetName) {
      cards.push({ icon: '🎯', title: 'Target', value: content.targetName })
    }

    if (content.standardName) {
      cards.push({ icon: '📋', title: 'Standard', value: content.standardName })
    }

    if (content.technologyName) {
      cards.push({ icon: '⚙️', title: 'Technology', value: content.technologyName })
    }

    if (content.vendorName) {
      cards.push({ icon: '🏢', title: 'Vendor', value: content.vendorName })
    }

    if (content.maintainerName) {
      cards.push({ icon: '👤', title: 'Maintainer', value: content.maintainerName })
    }

    // Validation-specific
    if (isValidation.value && content.stigId) {
      cards.push({ icon: '📊', title: 'STIG ID', value: content.stigId })
    }

    return cards
  })

  // Template interpolation
  const quickStart = computed(() => {
    return interpolateTemplate(content.quickStartTemplate || '', content)
  })

  const prerequisites = computed(() => {
    return content.prerequisitesTemplate || ''
  })

  const hasQuickStart = computed(() => Boolean(content.quickStartTemplate))
  const hasPrerequisites = computed(() => Boolean(content.prerequisitesTemplate))
  const hasReadme = computed(() => Boolean(content.readmeMarkdown))

  return {
    formattedBenchmarkVersion,
    formattedProfileVersion,
    benchmarkLabel,
    actionUrls,
    featureCards,
    isValidation,
    isHardening,
    quickStart,
    prerequisites,
    hasQuickStart,
    hasPrerequisites,
    hasReadme,
  }
}
