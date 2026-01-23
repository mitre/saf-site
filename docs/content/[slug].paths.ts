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
  license?: string
  release_date?: string
  target?: string  // FK ID
  expand?: {
    target?: { id: string; name: string; slug: string; category?: string }
    standard?: { id: string; name: string; short_name?: string; slug: string }
    technology?: {
      id: string
      name: string
      slug: string
      logo?: string
      quick_start_template?: string
      prerequisites_template?: string
    }
    vendor?: { id: string; name: string; slug: string; logo?: string }
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

// Simplified related content item
interface RelatedContent {
  id: string
  slug: string
  name: string
  description: string
  content_type: 'validation' | 'hardening'
  technology_name: string
}

export default {
  async paths() {
    try {
      const pb = new PocketBase(
        process.env.POCKETBASE_URL || 'http://localhost:8090'
      )

      // PocketBase 0.23+ uses _superusers collection for admin auth
      await pb.collection('_superusers').authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com',
        process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123'
      )

      // Query ALL content with FK expansion (no filter - both validation and hardening)
      // Include maintainer.organization to get org logo as fallback for teams without logos
      const records = await pb.collection('content').getFullList<PBContent>({
        expand: 'target,standard,technology,vendor,maintainer,maintainer.organization',
        sort: 'name'
      })

      console.log(`✓ Generating ${records.length} content detail pages`)

      return records.map(record => {
        // Find related content (same target, different content_type)
        const relatedContent: RelatedContent[] = records
          .filter(r =>
            r.id !== record.id &&
            r.target === record.target &&
            r.target // Must have a target to be related
          )
          .map(r => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            description: r.description || '',
            content_type: r.content_type,
            technology_name: r.expand?.technology?.name || ''
          }))

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
              // Target
              target_name: record.expand?.target?.name || '',
              target_slug: record.expand?.target?.slug || '',
              // Standard
              standard_name: record.expand?.standard?.name || '',
              standard_short_name: record.expand?.standard?.short_name || '',
              standard_slug: record.expand?.standard?.slug || '',
              // Technology
              technology_name: record.expand?.technology?.name || '',
              technology_slug: record.expand?.technology?.slug || '',
              technology_logo: record.expand?.technology?.logo || '',
              // Vendor
              vendor_name: record.expand?.vendor?.name || '',
              vendor_slug: record.expand?.vendor?.slug || '',
              vendor_logo: record.expand?.vendor?.logo || '',
              // Maintainer (logo falls back to organization logo)
              maintainer_name: record.expand?.maintainer?.name || '',
              maintainer_slug: record.expand?.maintainer?.slug || '',
              maintainer_logo: record.expand?.maintainer?.logo ||
                record.expand?.maintainer?.expand?.organization?.logo || '',
              // Links
              github_url: record.github || '',
              documentation_url: record.documentation_url || '',
              reference_url: record.reference_url || '',
              // README content
              readme_url: record.readme_url || '',
              readme_markdown: record.readme_markdown || '',
              // Technology templates
              quick_start_template: record.expand?.technology?.quick_start_template || '',
              prerequisites_template: record.expand?.technology?.prerequisites_template || '',
              // Domain-specific
              control_count: record.control_count || 0,
              stig_id: record.stig_id || '',
              benchmark_version: record.benchmark_version || '',
              license: record.license || '',
              release_date: record.release_date || ''
            },
            // Related content for cross-linking
            relatedContent
          }
        }
      })
    } catch (error) {
      console.error('Failed to generate content paths:', error)
      return []
    }
  }
}
