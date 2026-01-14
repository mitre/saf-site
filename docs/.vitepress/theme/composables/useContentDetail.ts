import { computed, type ComputedRef } from 'vue'

/**
 * Content item from Pocketbase (validation or hardening profile)
 */
export interface ContentItem {
  id: string
  slug: string
  name: string
  description: string
  long_description?: string
  version: string
  status: string
  content_type: 'validation' | 'hardening'
  // Target
  target_name: string
  target_slug: string
  // Standard
  standard_name: string
  standard_short_name: string
  standard_slug: string
  // Technology
  technology_name: string
  technology_slug: string
  technology_logo?: string
  // Vendor
  vendor_name: string
  vendor_slug: string
  // Maintainer
  maintainer_name: string
  maintainer_slug: string
  // Links
  github_url: string
  documentation_url?: string
  // Domain-specific (validation)
  control_count?: number
  stig_id?: string
  benchmark_version?: string
  license?: string
  release_date?: string
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
  if (!version) return ''

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
 * Composable for content detail page logic
 * Extracts formatting, URLs, and display configuration from component
 */
export function useContentDetail(content: ContentItem): ContentDetailReturn {
  const isValidation = computed(() => content.content_type === 'validation')
  const isHardening = computed(() => content.content_type === 'hardening')

  const formattedBenchmarkVersion = computed(() => {
    return formatBenchmarkVersion(
      content.benchmark_version || '',
      content.standard_name || content.standard_short_name
    )
  })

  const formattedProfileVersion = computed(() => {
    return content.version ? `v${content.version}` : ''
  })

  const benchmarkLabel = computed(() => {
    const version = formattedBenchmarkVersion.value
    if (!version) return ''
    const standard = content.standard_short_name || 'Benchmark'
    return `${standard} ${version}`
  })

  const actionUrls = computed<ActionUrl[]>(() => {
    const urls: ActionUrl[] = []

    if (content.github_url) {
      // Always show GitHub
      urls.push({
        label: 'View on GitHub',
        url: content.github_url,
        primary: true
      })

      // Always show README
      urls.push({
        label: 'View README',
        url: `${content.github_url}#readme`,
        primary: false
      })
    }

    // Additionally show Documentation if custom docs URL exists
    if (content.documentation_url) {
      urls.push({
        label: 'Documentation',
        url: content.documentation_url,
        primary: false
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

    if (content.target_name) {
      cards.push({ icon: '🎯', title: 'Target', value: content.target_name })
    }

    if (content.standard_name) {
      cards.push({ icon: '📋', title: 'Standard', value: content.standard_name })
    }

    if (content.technology_name) {
      cards.push({ icon: '⚙️', title: 'Technology', value: content.technology_name })
    }

    if (content.vendor_name) {
      cards.push({ icon: '🏢', title: 'Vendor', value: content.vendor_name })
    }

    if (content.maintainer_name) {
      cards.push({ icon: '👤', title: 'Maintainer', value: content.maintainer_name })
    }

    // Validation-specific
    if (isValidation.value && content.stig_id) {
      cards.push({ icon: '📊', title: 'STIG ID', value: content.stig_id })
    }

    return cards
  })

  return {
    formattedBenchmarkVersion,
    formattedProfileVersion,
    benchmarkLabel,
    actionUrls,
    featureCards,
    isValidation,
    isHardening
  }
}
