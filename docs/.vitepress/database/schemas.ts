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
