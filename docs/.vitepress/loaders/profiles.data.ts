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
  control_count?: number
  stig_id?: string
  benchmark_version?: string
  is_featured?: boolean
  expand?: {
    target?: { id: string; name: string; slug: string; category?: string }
    standard?: { id: string; name: string; short_name?: string; slug: string; standard_type?: string }
    technology?: { id: string; name: string; slug: string; logo?: string }
    vendor?: { id: string; name: string; slug: string; org_type?: string }
    maintainer?: { id: string; name: string; slug: string; organization?: string }
  }
}

// Flattened profile for VitePress consumption
export interface Profile {
  id: string
  slug: string
  name: string
  description?: string
  long_description?: string
  version?: string
  status?: string
  // Target (what this profile validates)
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
  // Maintainer (team responsible)
  maintainer?: string
  maintainer_name?: string
  maintainer_slug?: string
  // Links
  github_url?: string
  documentation_url?: string
  // Domain-specific
  control_count?: number
  stig_id?: string
  benchmark_version?: string
  is_featured?: boolean
}

export interface ProfileData {
  profiles: Profile[]
}

declare const data: ProfileData
export { data }

export default defineLoader({
  async load(): Promise<ProfileData> {
    try {
      const pb = new PocketBase(
        process.env.POCKETBASE_URL || 'http://localhost:8090'
      )

      // PocketBase 0.23+ uses _superusers collection for admin auth
      await pb.collection('_superusers').authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com',
        process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123'
      )

      // Query content with FK expansion, filter for validation profiles only
      const records = await pb.collection('content').getFullList<PBContent>({
        filter: 'content_type = "validation"',
        expand: 'target,standard,technology,vendor,maintainer',
        sort: 'name'
      })

      // Transform Pocketbase records to flattened Profile format
      const profiles: Profile[] = records.map(record => ({
        id: record.id,
        slug: record.slug,
        name: record.name,
        description: record.description,
        long_description: record.long_description,
        version: record.version,
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
        // Maintainer
        maintainer: record.expand?.maintainer?.id,
        maintainer_name: record.expand?.maintainer?.name,
        maintainer_slug: record.expand?.maintainer?.slug,
        // Links
        github_url: record.github,
        documentation_url: record.documentation_url,
        // Domain-specific
        control_count: record.control_count,
        stig_id: record.stig_id,
        benchmark_version: record.benchmark_version,
        is_featured: record.is_featured
      }))

      console.log(`✓ Loaded ${profiles.length} validation profiles from Pocketbase`)
      return { profiles }
    } catch (error) {
      console.error('Failed to load profiles from Pocketbase:', error)
      console.error('Make sure Pocketbase is running: cd .pocketbase && ./pocketbase serve')

      // Return empty array instead of crashing build
      return { profiles: [] }
    }
  }
})
