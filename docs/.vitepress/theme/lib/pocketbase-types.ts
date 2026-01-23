/**
 * Shared Pocketbase Types
 *
 * Type definitions for Pocketbase records used by data loaders.
 * Single source of truth to avoid duplication across loaders.
 */

/**
 * Pocketbase content record with FK expansions
 */
export interface PBContent {
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
    target?: PBTarget
    standard?: PBStandard
    technology?: PBTechnology
    vendor?: PBOrganization
    maintainer?: PBTeam
  }
}

/**
 * Pocketbase target record
 */
export interface PBTarget {
  id: string
  name: string
  slug: string
  category?: string
}

/**
 * Pocketbase standard record
 */
export interface PBStandard {
  id: string
  name: string
  short_name?: string
  slug: string
  standard_type?: string
}

/**
 * Pocketbase technology record
 */
export interface PBTechnology {
  id: string
  name: string
  slug: string
  logo?: string
  quick_start_template?: string
  prerequisites_template?: string
}

/**
 * Pocketbase organization record
 */
export interface PBOrganization {
  id: string
  name: string
  slug: string
  logo?: string
  org_type?: string
}

/**
 * Pocketbase team record
 */
export interface PBTeam {
  id: string
  name: string
  slug: string
  logo?: string
  organization?: string
  expand?: {
    organization?: PBOrganization
  }
}
