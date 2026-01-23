/**
 * SAF Site Entity Schemas
 *
 * Zod validation schemas for all database entities.
 * Single source of truth for runtime validation.
 *
 * TypeScript types are inferred from these schemas using z.infer<>
 */

import { z } from 'zod'

// ============================================================================
// SHARED PATTERNS
// ============================================================================

/**
 * Slug pattern - lowercase alphanumeric with hyphens
 */
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Base slug schema with convention enforcement
 */
const slugSchema = z.string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be at most 100 characters')
  .regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens')
  .refine(
    (slug) => !slug.includes('--'),
    'Slug cannot contain consecutive hyphens'
  )

/**
 * Optional URL schema
 */
const urlSchema = z.string().url().optional()

/**
 * Semver pattern (loose - allows 1.0.0, 0.1.0, etc.)
 */
const semverPattern = /^\d+\.\d+\.\d+$/

// ============================================================================
// ENUMS
// ============================================================================

export const orgTypeEnum = z.enum(['vendor', 'government', 'community', 'standards_body'])
export const standardTypeEnum = z.enum(['regulatory', 'industry', 'government'])
export const tagCategoryEnum = z.enum(['platform', 'compliance', 'feature', 'technology'])
export const contentTypeEnum = z.enum(['validation', 'hardening'])
export const statusEnum = z.enum(['active', 'beta', 'deprecated', 'draft'])
export const automationLevelEnum = z.enum(['full', 'partial', 'manual'])

// ============================================================================
// ORGANIZATION SCHEMA
// ============================================================================

export const organizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  slug: slugSchema,
  description: z.string().optional(),
  website: urlSchema,
  logo: urlSchema,
  orgType: orgTypeEnum.optional()
})

export const organizationInputSchema = organizationSchema.omit({ id: true })

// ============================================================================
// TARGET SCHEMA
// ============================================================================

export const targetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  slug: slugSchema,
  description: z.string().optional(),
  category: z.string().optional(), // FK to categories
  vendor: z.string().optional(),   // FK to organizations
  website: urlSchema,
  logo: urlSchema
})

export const targetInputSchema = targetSchema.omit({ id: true })

// ============================================================================
// STANDARD SCHEMA
// ============================================================================

export const standardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  shortName: z.string().optional(),
  slug: slugSchema,
  description: z.string().optional(),
  website: urlSchema,
  logo: urlSchema,
  organization: z.string().optional(), // FK to organizations
  standardType: standardTypeEnum.optional()
})

export const standardInputSchema = standardSchema.omit({ id: true })

// ============================================================================
// TECHNOLOGY SCHEMA
// ============================================================================

export const technologySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  slug: slugSchema,
  description: z.string().optional(),
  website: urlSchema,
  logo: urlSchema,
  github: urlSchema,
  organization: z.string().optional(), // FK to organizations
  documentationUrl: urlSchema,
  quickStartTemplate: z.string().optional(),
  prerequisitesTemplate: z.string().optional()
})

export const technologyInputSchema = technologySchema.omit({ id: true })

// ============================================================================
// TEAM SCHEMA
// ============================================================================

export const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  slug: slugSchema,
  description: z.string().optional(),
  organization: z.string().optional(), // FK to organizations
  website: urlSchema,
  logo: urlSchema
})

export const teamInputSchema = teamSchema.omit({ id: true })

// ============================================================================
// TAG SCHEMA
// ============================================================================

export const tagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  slug: slugSchema,
  displayName: z.string().optional(),
  description: z.string().optional(),
  tagCategory: tagCategoryEnum.optional(),
  badgeColor: z.string().optional()
})

export const tagInputSchema = tagSchema.omit({ id: true })

// ============================================================================
// CONTENT SCHEMA
// ============================================================================

export const contentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(200),
  slug: slugSchema,
  description: z.string().optional(),
  longDescription: z.string().optional(),
  version: z.string().regex(semverPattern, 'Version must be semver format (x.y.z)').optional(),

  // Classification
  contentType: contentTypeEnum,
  status: statusEnum.optional().default('active'),

  // Foreign Keys
  target: z.string().optional(),
  standard: z.string().optional(),
  technology: z.string().optional(),
  vendor: z.string().optional(),
  maintainer: z.string().optional(),

  // Links
  github: urlSchema,
  documentationUrl: urlSchema,
  referenceUrl: urlSchema,
  readmeUrl: urlSchema,
  readmeMarkdown: z.string().optional(),

  // Domain-specific (validation profiles)
  controlCount: z.number().int().positive().optional(),
  stigId: z.string().optional(),
  benchmarkVersion: z.string().optional(),

  // Domain-specific (hardening)
  automationLevel: automationLevelEnum.optional(),

  // Featured/Curation
  isFeatured: z.boolean().optional(),
  featuredOrder: z.number().int().optional(),

  // Metadata
  license: z.string().optional(),
  releaseDate: z.date().optional(),
  deprecatedAt: z.date().optional()
})

export const contentInputSchema = contentSchema.omit({ id: true })

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Organization = z.infer<typeof organizationSchema>
export type OrganizationInput = z.infer<typeof organizationInputSchema>

export type Target = z.infer<typeof targetSchema>
export type TargetInput = z.infer<typeof targetInputSchema>

export type Standard = z.infer<typeof standardSchema>
export type StandardInput = z.infer<typeof standardInputSchema>

export type Technology = z.infer<typeof technologySchema>
export type TechnologyInput = z.infer<typeof technologyInputSchema>

export type Team = z.infer<typeof teamSchema>
export type TeamInput = z.infer<typeof teamInputSchema>

export type Tag = z.infer<typeof tagSchema>
export type TagInput = z.infer<typeof tagInputSchema>

export type ContentRecord = z.infer<typeof contentSchema>
export type ContentInput = z.infer<typeof contentInputSchema>

// ============================================================================
// POCKETBASE RECORD SCHEMAS (Phase 1.2)
// ============================================================================

/**
 * Base Pocketbase record metadata
 * All Pocketbase records include these fields
 */
export const pbRecordSchema = z.object({
  id: z.string(),
  created: z.string(),  // ISO timestamp string from Pocketbase
  updated: z.string(),  // ISO timestamp string from Pocketbase
  collectionId: z.string(),
  collectionName: z.string(),
  expand: z.record(z.unknown()).optional()
})

/**
 * Pocketbase organization record (snake_case fields)
 */
export const pbOrganizationSchema = pbRecordSchema.extend({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  org_type: z.string().nullable().optional()  // snake_case from Pocketbase
})

/**
 * Pocketbase target record (snake_case fields)
 */
export const pbTargetSchema = pbRecordSchema.extend({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),  // FK as string ID
  vendor: z.string().nullable().optional(),    // FK as string ID
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional()
})

/**
 * Pocketbase standard record (snake_case fields)
 */
export const pbStandardSchema = pbRecordSchema.extend({
  name: z.string(),
  short_name: z.string().nullable().optional(),  // snake_case
  slug: z.string(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),  // FK as string ID
  standard_type: z.string().nullable().optional()  // snake_case
})

/**
 * Pocketbase technology record (snake_case fields)
 */
export const pbTechnologySchema = pbRecordSchema.extend({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  documentation_url: z.string().nullable().optional(),  // snake_case
  quick_start_template: z.string().nullable().optional(),
  prerequisites_template: z.string().nullable().optional()
})

/**
 * Pocketbase team record (snake_case fields)
 */
export const pbTeamSchema = pbRecordSchema.extend({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional()
})

/**
 * Pocketbase content record (snake_case fields)
 * This is the main content schema for validation profiles and hardening content
 */
export const pbContentSchema = pbRecordSchema.extend({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  long_description: z.string().nullable().optional(),  // snake_case
  version: z.string().nullable().optional(),

  // Classification
  content_type: z.string(),  // snake_case: 'validation' | 'hardening'
  status: z.string().nullable().optional(),

  // Foreign Keys (as string IDs)
  target: z.string().nullable().optional(),
  standard: z.string().nullable().optional(),
  technology: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  maintainer: z.string().nullable().optional(),

  // Links
  github: z.string().nullable().optional(),
  documentation_url: z.string().nullable().optional(),  // snake_case
  reference_url: z.string().nullable().optional(),
  readme_url: z.string().nullable().optional(),
  readme_markdown: z.string().nullable().optional(),

  // Domain-specific (validation profiles)
  control_count: z.number().nullable().optional(),  // snake_case
  stig_id: z.string().nullable().optional(),
  benchmark_version: z.string().nullable().optional(),

  // Domain-specific (hardening)
  automation_level: z.string().nullable().optional(),  // snake_case

  // Featured/Curation
  is_featured: z.boolean().nullable().optional(),  // snake_case
  featured_order: z.number().nullable().optional(),

  // Metadata
  license: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),  // ISO date string
  deprecated_at: z.string().nullable().optional()
})

/**
 * Content with expanded FK relations
 * Used when fetching content with ?expand=target,standard,vendor,etc.
 */
export const pbContentWithExpand = pbContentSchema.extend({
  expand: z.object({
    target: pbTargetSchema.optional(),
    standard: pbStandardSchema.optional(),
    technology: pbTechnologySchema.optional(),
    vendor: pbOrganizationSchema.optional(),
    maintainer: pbTeamSchema.optional()
  }).optional()
})

// ============================================================================
// POCKETBASE TYPE EXPORTS
// ============================================================================

export type PocketbaseRecord = z.infer<typeof pbRecordSchema>
export type PBOrganization = z.infer<typeof pbOrganizationSchema>
export type PBTarget = z.infer<typeof pbTargetSchema>
export type PBStandard = z.infer<typeof pbStandardSchema>
export type PBTechnology = z.infer<typeof pbTechnologySchema>
export type PBTeam = z.infer<typeof pbTeamSchema>
export type PBContent = z.infer<typeof pbContentSchema>
export type PBContentExpanded = z.infer<typeof pbContentWithExpand>
