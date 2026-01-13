import { defineLoader } from 'vitepress'
import PocketBase from 'pocketbase'

// Pocketbase record types
interface PBProfile {
  id: string
  profile_id: string
  name: string
  version?: string
  platform?: string
  framework?: string
  vendor?: string
  github?: string
  details?: string
  standard_version?: string
  short_description?: string
  requirements?: string
  category?: string
  status?: string
  expand?: {
    technology?: { id: string; name: string; tech_id: string }
    organization?: { id: string; name: string; org_id: string }
    team?: { id: string; name: string; team_id: string }
    standard?: { id: string; name: string; standard_id: string }
  }
}

// Flattened profile for VitePress consumption
export interface Profile {
  id: string
  slug: string
  name: string
  description?: string
  category?: string
  version?: string
  platform?: string
  framework?: string
  technology?: string
  technology_name?: string
  vendor?: string
  organization?: string
  organization_name?: string
  team?: string
  team_name?: string
  standard?: string
  standard_name?: string
  standard_version?: string
  github_url?: string
  requirements?: string
  status?: string
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

      // Authenticate for build-time access
      // In production CI/CD, use environment variables
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com',
        process.env.POCKETBASE_ADMIN_PASSWORD || 'test1234567'
      )

      // Query with automatic FK expansion
      const records = await pb.collection('profiles').getFullList<PBProfile>({
        expand: 'technology,organization,team,standard'
      })

      // Transform Pocketbase records to flattened Profile format
      const profiles: Profile[] = records.map(record => ({
        id: record.profile_id,
        slug: record.profile_id, // Use profile_id as slug
        name: record.name,
        description: record.short_description,
        category: record.category,
        version: record.version,
        platform: record.platform,
        framework: record.framework,
        technology: record.expand?.technology?.tech_id,
        technology_name: record.expand?.technology?.name,
        vendor: record.vendor,
        organization: record.expand?.organization?.org_id,
        organization_name: record.expand?.organization?.name,
        team: record.expand?.team?.team_id,
        team_name: record.expand?.team?.name,
        standard: record.expand?.standard?.standard_id,
        standard_name: record.expand?.standard?.name,
        standard_version: record.standard_version,
        github_url: record.github,
        requirements: record.requirements,
        status: record.status
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
