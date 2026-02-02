/**
 * Integration tests for organizations data loader
 * Validates that logo paths are correct and all organizations have required fields
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import PocketBase from 'pocketbase'
import { describe, expect, it } from 'vitest'

const pbUrl = process.env.PB_URL || 'http://localhost:8090'
const pbEmail = process.env.PB_ADMIN_EMAIL || 'admin@localhost.com'
const pbPassword = process.env.PB_ADMIN_PASSWORD || 'testpassword123'

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  org_type: string
  website?: string
}

describe('organizations data loader', () => {
  it('loads sponsors and vendors from database', async () => {
    const pb = new PocketBase(pbUrl)
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    const orgs = await pb.collection('organizations').getFullList<Organization>({
      filter: 'org_type != ""',
      sort: 'name',
    })

    expect(orgs.length).toBeGreaterThan(0)

    const sponsors = orgs.filter(o => o.org_type === 'government')
    const vendors = orgs.filter(o => o.org_type === 'vendor')

    expect(sponsors.length).toBeGreaterThan(0)
    expect(vendors.length).toBeGreaterThan(0)
  })

  it('all organizations have required fields', async () => {
    const pb = new PocketBase(pbUrl)
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    const orgs = await pb.collection('organizations').getFullList<Organization>({
      filter: 'org_type != ""',
    })

    orgs.forEach((org) => {
      expect(org.name).toBeTruthy()
      expect(org.slug).toBeTruthy()
      expect(org.org_type).toBeTruthy()
    })
  })

  it('logo paths point to existing files or are empty (BrandIcon fallback)', async () => {
    const pb = new PocketBase(pbUrl)
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    const orgs = await pb.collection('organizations').getFullList<Organization>({
      filter: 'org_type != ""',
    })

    const publicDir = join(process.cwd(), 'docs/public')
    const invalidLogos: string[] = []

    orgs.forEach((org) => {
      if (org.logo) {
        // Logo should start with /
        if (!org.logo.startsWith('/')) {
          invalidLogos.push(`${org.name}: logo must start with / (got: ${org.logo})`)
          return
        }

        // Check if file exists (remove leading /)
        const filePath = join(publicDir, org.logo.slice(1))
        if (!existsSync(filePath)) {
          invalidLogos.push(`${org.name}: logo file not found at ${filePath}`)
        }
      }
      // Empty logo is OK - will use BrandIcon auto-resolve
    })

    if (invalidLogos.length > 0) {
      throw new Error(`Invalid logos found:\n${invalidLogos.join('\n')}`)
    }
  })

  it('no duplicate organizations by slug', async () => {
    const pb = new PocketBase(pbUrl)
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    const orgs = await pb.collection('organizations').getFullList<Organization>()

    const slugs = orgs.map(o => o.slug)
    const uniqueSlugs = new Set(slugs)

    expect(slugs.length).toBe(uniqueSlugs.size)
  })

  it('army ECMA has correct name', async () => {
    const pb = new PocketBase(pbUrl)
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    const armyEcma = await pb.collection('organizations').getFirstListItem<Organization>(
      'slug="army-ecma"',
    )

    expect(armyEcma.name).toBe('United States Army Enterprise Cloud Management Agency')
    expect(armyEcma.name).not.toContain('Content Management')
  })
})
