import type { PBContent } from '../theme/lib/pocketbase-types'
import { defineLoader } from 'vitepress'
import {
  extractFK,
  extractMaintainerFK,
  extractOrgFK,
  extractStandardFK,
  extractTechnologyFK,
  initPocketBase,
} from '../lib/loader-utils'

// Flattened content item for VitePress consumption
export interface ContentItem {
  id: string
  slug: string
  name: string
  description?: string
  long_description?: string
  version?: string
  content_type: 'validation' | 'hardening'
  status?: string
  // Target (what this content secures)
  target?: string
  target_name?: string
  target_slug?: string
  // Standard (compliance framework)
  standard?: string
  standard_name?: string
  standard_short_name?: string
  standard_slug?: string
  // Technology (InSpec, Ansible, etc.)
  technology?: string
  technology_name?: string
  technology_slug?: string
  technology_logo?: string
  // Vendor (who made it)
  vendor?: string
  vendor_name?: string
  vendor_slug?: string
  vendor_logo?: string
  // Maintainer (team responsible)
  maintainer?: string
  maintainer_name?: string
  maintainer_slug?: string
  maintainer_logo?: string
  // Links
  github_url?: string
  documentation_url?: string
  reference_url?: string
  // README content
  readme_url?: string
  readme_markdown?: string
  // Technology templates
  quick_start_template?: string
  prerequisites_template?: string
  // Domain-specific
  control_count?: number
  stig_id?: string
  benchmark_version?: string
  is_featured?: boolean
}

export interface ContentData {
  items: ContentItem[]
  // Grouped views for convenience
  validation: ContentItem[]
  hardening: ContentItem[]
}

declare const data: ContentData
export { data }

export default defineLoader({
  async load(): Promise<ContentData> {
    try {
      const pb = await initPocketBase()

      // Query ALL content with FK expansion (no filter)
      // Include maintainer.organization to get org logo as fallback for teams without logos
      const records = await pb.collection('content').getFullList<PBContent>({
        expand: 'target,standard,technology,vendor,maintainer,maintainer.organization',
        sort: 'name',
      })

      // Transform Pocketbase records to flattened ContentItem format
      const items: ContentItem[] = records.map((record) => {
        const target = extractFK(record.expand, 'target')
        const standard = extractStandardFK(record.expand)
        const technology = extractTechnologyFK(record.expand)
        const vendor = extractOrgFK(record.expand, 'vendor')
        const maintainer = extractMaintainerFK(record.expand)

        return {
          id: record.id,
          slug: record.slug,
          name: record.name,
          description: record.description,
          long_description: record.long_description,
          version: record.version,
          content_type: record.content_type,
          status: record.status,
          // Target
          target: target.id,
          target_name: target.name,
          target_slug: target.slug,
          // Standard
          standard: standard.id,
          standard_name: standard.name,
          standard_short_name: standard.short_name,
          standard_slug: standard.slug,
          // Technology
          technology: technology.id,
          technology_name: technology.name,
          technology_slug: technology.slug,
          technology_logo: technology.logo,
          // Vendor
          vendor: vendor.id,
          vendor_name: vendor.name,
          vendor_slug: vendor.slug,
          vendor_logo: vendor.logo,
          // Maintainer
          maintainer: maintainer.id,
          maintainer_name: maintainer.name,
          maintainer_slug: maintainer.slug,
          maintainer_logo: maintainer.logo,
          // Links
          github_url: record.github,
          documentation_url: record.documentation_url,
          reference_url: record.reference_url,
          // README content
          readme_url: record.readme_url,
          readme_markdown: record.readme_markdown,
          // Technology templates
          quick_start_template: technology.quick_start_template,
          prerequisites_template: technology.prerequisites_template,
          // Domain-specific
          control_count: record.control_count,
          stig_id: record.stig_id,
          benchmark_version: record.benchmark_version,
          is_featured: record.is_featured,
        }
      })

      // Group by content type
      const validation = items.filter(item => item.content_type === 'validation')
      const hardening = items.filter(item => item.content_type === 'hardening')

      console.log(`✓ Loaded ${items.length} content items (${validation.length} validation, ${hardening.length} hardening)`)
      return { items, validation, hardening }
    }
    catch (error) {
      console.error('Failed to load content from Pocketbase:', error)
      console.error('Make sure Pocketbase is running: cd .pocketbase && ./pocketbase serve')

      // Return empty arrays instead of crashing build
      return { items: [], validation: [], hardening: [] }
    }
  },
})
