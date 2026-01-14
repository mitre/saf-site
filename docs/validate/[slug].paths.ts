import PocketBase from 'pocketbase'

// Pocketbase v2_content record types
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
  control_count?: number
  stig_id?: string
  benchmark_version?: string
  license?: string
  release_date?: string
  expand?: {
    target?: { id: string; name: string; slug: string; category?: string }
    standard?: { id: string; name: string; short_name?: string; slug: string }
    technology?: { id: string; name: string; slug: string; logo?: string }
    vendor?: { id: string; name: string; slug: string }
    maintainer?: { id: string; name: string; slug: string; organization?: string }
  }
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

      // Query v2_content with FK expansion, filter for validation profiles only
      const records = await pb.collection('v2_content').getFullList<PBContent>({
        filter: 'content_type = "validation"',
        expand: 'target,standard,technology,vendor,maintainer',
        sort: 'name'
      })

      console.log(`✓ Generating ${records.length} validation profile detail pages`)

      return records.map(record => ({
        params: {
          slug: record.slug,
          // Pass all profile data to the template
          profile: {
            id: record.id,
            slug: record.slug,
            name: record.name,
            description: record.description || '',
            long_description: record.long_description || '',
            version: record.version || '',
            status: record.status || 'active',
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
            // Maintainer
            maintainer_name: record.expand?.maintainer?.name || '',
            maintainer_slug: record.expand?.maintainer?.slug || '',
            // Links
            github_url: record.github || '',
            documentation_url: record.documentation_url || '',
            // Domain-specific
            control_count: record.control_count || 0,
            stig_id: record.stig_id || '',
            benchmark_version: record.benchmark_version || '',
            license: record.license || '',
            release_date: record.release_date || ''
          }
        }
      }))
    } catch (error) {
      console.error('Failed to generate profile paths:', error)
      return []
    }
  }
}
