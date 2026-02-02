/**
 * Organizations Data Loader
 *
 * Loads organizations from Pocketbase, filtered by org_type
 * for display on homepage sponsors/vendors sections
 */

import PocketBase from 'pocketbase'
import { defineLoader } from 'vitepress'

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  logo?: string
  org_type: 'government' | 'vendor' | 'community' | 'standards_body' | ''
}

interface OrganizationsData {
  sponsors: Organization[]
  vendors: Organization[]
  all: Organization[]
}

// Use environment variables or defaults for authentication
const pbUrl = process.env.PB_URL || 'http://localhost:8090'
const pbEmail = process.env.PB_ADMIN_EMAIL || 'admin@localhost.com'
const pbPassword = process.env.PB_ADMIN_PASSWORD || 'testpassword123'

export default defineLoader({
  async load(): Promise<OrganizationsData> {
    const pb = new PocketBase(pbUrl)

    // Authenticate
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    // Get all organizations
    const all = await pb.collection('organizations').getFullList<Organization>({
      sort: 'name',
      filter: 'org_type != ""', // Exclude entries without org_type
    })

    // Split into sponsors (government) and vendors
    const sponsors = all.filter(org => org.org_type === 'government')
    const vendors = all.filter(org => org.org_type === 'vendor')

    return {
      sponsors,
      vendors,
      all,
    }
  },
})

declare const data: OrganizationsData
export { data }
