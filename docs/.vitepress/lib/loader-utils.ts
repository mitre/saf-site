/**
 * Shared utilities for VitePress data loaders
 * Extracts common Pocketbase initialization and FK transformation logic
 */
import PocketBase from 'pocketbase'

/**
 * Initialize and authenticate PocketBase client
 */
export async function initPocketBase(): Promise<PocketBase> {
  const pb = new PocketBase(
    process.env.POCKETBASE_URL || 'http://localhost:8090'
  )

  // PocketBase 0.23+ uses _superusers collection for admin auth
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost.com',
    process.env.POCKETBASE_ADMIN_PASSWORD || 'testpassword123'
  )

  return pb
}

/**
 * Extract id, name, slug from an expanded FK field
 */
export function extractFK(expand: Record<string, unknown> | undefined, fieldName: string): {
  id?: string
  name?: string
  slug?: string
} {
  const field = expand?.[fieldName] as { id?: string; name?: string; slug?: string } | undefined
  return {
    id: field?.id,
    name: field?.name,
    slug: field?.slug
  }
}

/**
 * Extract standard FK fields (includes short_name)
 */
export function extractStandardFK(expand: Record<string, unknown> | undefined): {
  id?: string
  name?: string
  short_name?: string
  slug?: string
} {
  const field = expand?.standard as { id?: string; name?: string; short_name?: string; slug?: string } | undefined
  return {
    id: field?.id,
    name: field?.name,
    short_name: field?.short_name,
    slug: field?.slug
  }
}

/**
 * Extract technology FK fields (includes logo and templates)
 */
export function extractTechnologyFK(expand: Record<string, unknown> | undefined): {
  id?: string
  name?: string
  slug?: string
  logo?: string
  quick_start_template?: string
  prerequisites_template?: string
} {
  const field = expand?.technology as {
    id?: string
    name?: string
    slug?: string
    logo?: string
    quick_start_template?: string
    prerequisites_template?: string
  } | undefined
  return {
    id: field?.id,
    name: field?.name,
    slug: field?.slug,
    logo: field?.logo,
    quick_start_template: field?.quick_start_template,
    prerequisites_template: field?.prerequisites_template
  }
}

/**
 * Extract organization/vendor FK fields (includes logo)
 */
export function extractOrgFK(expand: Record<string, unknown> | undefined, fieldName: string): {
  id?: string
  name?: string
  slug?: string
  logo?: string
} {
  const field = expand?.[fieldName] as { id?: string; name?: string; slug?: string; logo?: string } | undefined
  return {
    id: field?.id,
    name: field?.name,
    slug: field?.slug,
    logo: field?.logo
  }
}

/**
 * Extract maintainer FK fields with organization logo fallback
 */
export function extractMaintainerFK(expand: Record<string, unknown> | undefined): {
  id?: string
  name?: string
  slug?: string
  logo?: string
} {
  const maintainer = expand?.maintainer as {
    id?: string
    name?: string
    slug?: string
    logo?: string
    expand?: {
      organization?: { logo?: string }
    }
  } | undefined

  return {
    id: maintainer?.id,
    name: maintainer?.name,
    slug: maintainer?.slug,
    logo: maintainer?.logo || maintainer?.expand?.organization?.logo
  }
}
