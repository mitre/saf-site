import type { PBContent } from '../.vitepress/theme/lib/pocketbase-types'
import {
  extractFK,
  extractMaintainerFK,
  extractOrgFK,
  extractStandardFK,
  extractTechnologyFK,
  initPocketBase,
} from '../.vitepress/lib/loader-utils'

// Simplified related content item
interface RelatedContent {
  id: string
  slug: string
  name: string
  description: string
  content_type: 'validation' | 'hardening' | 'library'
  pillar?: string
  technology_name: string
}

interface PackageInfo {
  registry: 'npm' | 'rubygems' | 'pypi'
  name: string
}

export default {
  async paths() {
    try {
      const pb = await initPocketBase()

      // Query ALL content with FK expansion (no filter - validation, hardening, and library)
      // Include maintainer.organization to get org logo as fallback for teams without logos
      // Include primary_capability for pillar association
      const records = await pb.collection('content').getFullList<PBContent>({
        expand: 'target,standard,technology,vendor,maintainer,maintainer.organization,primary_capability',
        sort: 'name',
      })

      console.log(`✓ Generating ${records.length} content detail pages`)

      return records.map((record) => {
        // Extract FK data using shared utilities
        const target = extractFK(record.expand, 'target')
        const standard = extractStandardFK(record.expand)
        const technology = extractTechnologyFK(record.expand)
        const vendor = extractOrgFK(record.expand, 'vendor')
        const maintainer = extractMaintainerFK(record.expand)

        // Find related content (same target, different content_type)
        const relatedContent: RelatedContent[] = records
          .filter(r =>
            r.id !== record.id
            && r.target === record.target
            && r.target, // Must have a target to be related
          )
          .map(r => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            description: r.description || '',
            content_type: r.content_type,
            pillar: r.expand?.primary_capability?.slug
              || (r.content_type === 'validation' ? 'validate' : 'harden'),
            technology_name: r.expand?.technology?.name || '',
          }))

        // Extract pillar from primary_capability FK, fallback to content_type derivation
        const capability = record.expand?.primary_capability
        const pillar = capability?.slug
          || (record.content_type === 'validation' ? 'validate' : 'harden')
        const pillarName = capability?.name
          || (record.content_type === 'validation' ? 'Validate' : 'Harden')

        // Parse packages JSON (libraries only)
        let packages: PackageInfo[] | undefined
        if (record.packages) {
          try {
            const parsed = typeof record.packages === 'string'
              ? JSON.parse(record.packages)
              : record.packages
            if (Array.isArray(parsed) && parsed.length > 0) {
              packages = parsed
            }
          }
          catch {
            // Ignore malformed JSON
          }
        }

        return {
          params: {
            slug: record.slug,
            // Pass all content data to the template
            content: {
              id: record.id,
              slug: record.slug,
              name: record.name,
              description: record.description || '',
              long_description: record.long_description || '',
              version: record.version || '',
              status: record.status || 'active',
              content_type: record.content_type,
              pillar,
              pillar_name: pillarName,
              packages,
              // Target
              target_name: target.name || '',
              target_slug: target.slug || '',
              // Standard
              standard_name: standard.name || '',
              standard_short_name: standard.short_name || '',
              standard_slug: standard.slug || '',
              // Technology
              technology_name: technology.name || '',
              technology_slug: technology.slug || '',
              technology_logo: technology.logo || '',
              // Vendor
              vendor_name: vendor.name || '',
              vendor_slug: vendor.slug || '',
              vendor_logo: vendor.logo || '',
              // Maintainer
              maintainer_name: maintainer.name || '',
              maintainer_slug: maintainer.slug || '',
              maintainer_logo: maintainer.logo || '',
              // Links
              github_url: record.github || '',
              documentation_url: record.documentation_url || '',
              reference_url: record.reference_url || '',
              // README content
              readme_url: record.readme_url || '',
              readme_markdown: record.readme_markdown || '',
              // Technology templates
              quick_start_template: technology.quick_start_template || '',
              prerequisites_template: technology.prerequisites_template || '',
              // Domain-specific
              control_count: record.control_count || 0,
              stig_id: record.stig_id || '',
              benchmark_version: record.benchmark_version || '',
              license: record.license || '',
              release_date: record.release_date || '',
            },
            // Related content for cross-linking
            relatedContent,
          },
        }
      })
    }
    catch (error) {
      console.error('Failed to generate content paths:', error)
      return []
    }
  },
}
