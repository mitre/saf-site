import { defineLoader } from 'vitepress'
import PocketBase from 'pocketbase'

// Pocketbase content record types
interface PBContent {
  id: string
  name: string
  slug: string
  description?: string
  long_description?: string
  version?: string
  content_type: 'validation' | 'hardening'
  status?: 'active' | 'beta' | 'deprecated' | 'draft'
  github?: string
  documentation_url?: string
  reference_url?: string
  readme_url?: string
  readme_markdown?: string
  control_count?: number
  stig_id?: string
  benchmark_version?: string
  is_featured?: boolean
  expand?: {
    target?: { id: string; name: string; slug: string; category?: string }
    standard?: { id: string; name: string; short_name?: string; slug: string; standard_type?: string }
    technology?: {
      id: string
      name: string
      slug: string
      logo?: string
      quick_start_template?: string
      prerequisites_template?: string
    }
    vendor?: { id: string; name: string; slug: string; logo?: string; org_type?: string }
    maintainer?: {
      id: string
      name: string
      slug: string
      logo?: string
      organization?: string
      expand?: {
        organization?: { id: string; name: string; logo?: string }
      }
    }
  }
}

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
      const pb = new PocketBase(
        process.env.POCKETBASE_URL || 'http://localhost:8090'
      )

      // PocketBase 0.23+ uses _superusers collection for admin auth
      await pb.collection('_superusers').authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com',
        process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123'
      )

      // Query ALL content with FK expansion (no filter)
      // Include maintainer.organization to get org logo as fallback for teams without logos
      const records = await pb.collection('content').getFullList<PBContent>({
        expand: 'target,standard,technology,vendor,maintainer,maintainer.organization',
        sort: 'name'
      })

      // Transform Pocketbase records to flattened ContentItem format
      const items: ContentItem[] = records.map(record => ({
        id: record.id,
        slug: record.slug,
        name: record.name,
        description: record.description,
        long_description: record.long_description,
        version: record.version,
        content_type: record.content_type,
        status: record.status,
        // Target
        target: record.expand?.target?.id,
        target_name: record.expand?.target?.name,
        target_slug: record.expand?.target?.slug,
        // Standard
        standard: record.expand?.standard?.id,
        standard_name: record.expand?.standard?.name,
        standard_short_name: record.expand?.standard?.short_name,
        standard_slug: record.expand?.standard?.slug,
        // Technology
        technology: record.expand?.technology?.id,
        technology_name: record.expand?.technology?.name,
        technology_slug: record.expand?.technology?.slug,
        technology_logo: record.expand?.technology?.logo,
        // Vendor
        vendor: record.expand?.vendor?.id,
        vendor_name: record.expand?.vendor?.name,
        vendor_slug: record.expand?.vendor?.slug,
        vendor_logo: record.expand?.vendor?.logo,
        // Maintainer (logo falls back to organization logo)
        maintainer: record.expand?.maintainer?.id,
        maintainer_name: record.expand?.maintainer?.name,
        maintainer_slug: record.expand?.maintainer?.slug,
        maintainer_logo: record.expand?.maintainer?.logo ||
          record.expand?.maintainer?.expand?.organization?.logo,
        // Links
        github_url: record.github,
        documentation_url: record.documentation_url,
        reference_url: record.reference_url,
        // README content
        readme_url: record.readme_url,
        readme_markdown: record.readme_markdown,
        // Technology templates
        quick_start_template: record.expand?.technology?.quick_start_template,
        prerequisites_template: record.expand?.technology?.prerequisites_template,
        // Domain-specific
        control_count: record.control_count,
        stig_id: record.stig_id,
        benchmark_version: record.benchmark_version,
        is_featured: record.is_featured
      }))

      // Group by content type
      const validation = items.filter(item => item.content_type === 'validation')
      const hardening = items.filter(item => item.content_type === 'hardening')

      console.log(`✓ Loaded ${items.length} content items (${validation.length} validation, ${hardening.length} hardening)`)
      return { items, validation, hardening }
    } catch (error) {
      console.error('Failed to load content from Pocketbase:', error)
      console.error('Make sure Pocketbase is running: cd .pocketbase && ./pocketbase serve')

      // Return empty arrays instead of crashing build
      return { items: [], validation: [], hardening: [] }
    }
  }
})
