/**
 * SAF Content Catalog - Generated Zod Schemas
 *
 * Auto-generated from Drizzle schema using drizzle-zod.
 * This is the single source of truth for runtime validation.
 *
 * DO NOT EDIT MANUALLY - edit schema.ts and regenerate.
 *
 * Usage:
 *   import { contentInsertSchema, contentSelectSchema } from './schema.zod'
 *   const validated = contentInsertSchema.parse(data)
 */

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  // Lookup tables
  capabilities,
  categories,
  // Main content tables
  content,
  contentReleases,
  courseResources,
  courses,
  courseSessions,
  distributionReleases,
  distributions,
  distributionTypes,
  media,
  mediaTypes,
  organizations,
  registries,
  resourceTypes,
  standards,
  tags,
  targets,
  teams,
  technologies,
  toolReleases,
  tools,
  toolTypes,
} from './schema.js'

// ============================================================================
// SHARED PATTERNS & SCHEMAS
// ============================================================================

/**
 * Slug pattern - lowercase alphanumeric with hyphens
 * Must not contain consecutive hyphens
 */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Semver pattern: MAJOR.MINOR.PATCH[-prerelease][+build]
 * Per https://semver.org/
 */
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[0-9A-Z-]+(\.[0-9A-Z-]+)*)?(\+[0-9A-Z-]+(\.[0-9A-Z-]+)*)?$/i

/**
 * Slug schema - standalone for direct use
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be at most 100 characters')
  .regex(SLUG_PATTERN, 'Slug must be lowercase alphanumeric with hyphens')
  .refine(s => !s.includes('--'), 'Slug cannot contain consecutive hyphens')

/**
 * Semver schema - standalone for direct use
 */
export const semverSchema = z
  .string()
  .regex(SEMVER_PATTERN, 'Version must be semver format (x.y.z[-prerelease][+build])')

/**
 * Optional semver schema
 */
export const optionalSemverSchema = semverSchema.optional()

/**
 * URL schema
 */
export const urlSchema = z.string().url('Must be a valid URL')

/**
 * Optional URL schema
 */
export const optionalUrlSchema = urlSchema.optional().or(z.literal(''))

/**
 * Name schema - required
 */
export const nameSchema = z.string().min(1, 'Name is required')

/**
 * Description schema - optional
 */
export const descriptionSchema = z.string().optional()

/**
 * Control count schema
 */
export const controlCountSchema = z.number().int().positive().optional()

/**
 * Optional slug schema
 */
export const optionalSlugSchema = slugSchema.optional()

/**
 * Optional name schema
 */
export const optionalNameSchema = z.string().min(1).optional()

/**
 * GitHub URL schema (alias for optionalUrlSchema)
 */
export const githubUrlSchema = optionalUrlSchema

// ============================================================================
// ENUM SCHEMAS (derived from Drizzle schema)
// ============================================================================

export const contentTypeSchema = z.enum(['validation', 'hardening'])
export const statusSchema = z.enum(['active', 'beta', 'deprecated', 'draft'])
export const automationLevelSchema = z.enum(['full', 'partial', 'manual'])
export const relationshipTypeSchema = z.enum(['validates', 'hardens', 'complements'])
export const orgTypeSchema = z.enum(['vendor', 'government', 'community', 'standards_body'])
export const standardTypeSchema = z.enum(['regulatory', 'industry', 'government'])
export const tagCategorySchema = z.enum(['platform', 'compliance', 'feature', 'technology'])

// ============================================================================
// LOOKUP TABLE SCHEMAS
// ============================================================================

// --- Capabilities ---
export const capabilityInsertSchema = createInsertSchema(capabilities, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const capabilitySelectSchema = createSelectSchema(capabilities)

// --- Categories ---
export const categoryInsertSchema = createInsertSchema(categories, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const categorySelectSchema = createSelectSchema(categories)

// --- Organizations ---
export const organizationInsertSchema = createInsertSchema(organizations, {
  id: z.string().optional(), // PB auto-generates ID
  name: z.string().min(1, 'Name is required'),
  slug: slugSchema,
  website: optionalUrlSchema,
  orgType: orgTypeSchema.optional(),
})
export const organizationSelectSchema = createSelectSchema(organizations)

// --- Teams ---
export const teamInsertSchema = createInsertSchema(teams, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  website: optionalUrlSchema,
})
export const teamSelectSchema = createSelectSchema(teams)

// --- Standards ---
export const standardInsertSchema = createInsertSchema(standards, {
  id: z.string().optional(), // PB auto-generates ID
  name: z.string().min(1, 'Name is required'),
  slug: slugSchema,
  website: optionalUrlSchema,
  standardType: standardTypeSchema.optional(),
})
export const standardSelectSchema = createSelectSchema(standards)

// --- Technologies ---
export const technologyInsertSchema = createInsertSchema(technologies, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  website: optionalUrlSchema,
  github: optionalUrlSchema,
  documentationUrl: optionalUrlSchema,
})
export const technologySelectSchema = createSelectSchema(technologies)

// --- Targets ---
export const targetInsertSchema = createInsertSchema(targets, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  website: optionalUrlSchema,
})
export const targetSelectSchema = createSelectSchema(targets)

// --- Tags ---
export const tagInsertSchema = createInsertSchema(tags, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const tagSelectSchema = createSelectSchema(tags)

// --- Tool Types ---
export const toolTypeInsertSchema = createInsertSchema(toolTypes, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const toolTypeSelectSchema = createSelectSchema(toolTypes)

// --- Distribution Types ---
export const distributionTypeInsertSchema = createInsertSchema(distributionTypes, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const distributionTypeSelectSchema = createSelectSchema(distributionTypes)

// --- Registries ---
export const registryInsertSchema = createInsertSchema(registries, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  website: optionalUrlSchema,
})
export const registrySelectSchema = createSelectSchema(registries)

// --- Resource Types ---
export const resourceTypeInsertSchema = createInsertSchema(resourceTypes, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const resourceTypeSelectSchema = createSelectSchema(resourceTypes)

// --- Media Types ---
export const mediaTypeInsertSchema = createInsertSchema(mediaTypes, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const mediaTypeSelectSchema = createSelectSchema(mediaTypes)

// ============================================================================
// MAIN CONTENT TABLE SCHEMAS
// ============================================================================

// --- Content (validation profiles + hardening content) ---
export const contentInsertSchema = createInsertSchema(content, {
  id: z.string().optional(), // PB auto-generates ID
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
  slug: slugSchema,
  contentType: contentTypeSchema,
  status: statusSchema.optional(),
  automationLevel: automationLevelSchema.optional(),
  version: optionalSemverSchema,
  github: optionalUrlSchema,
  documentationUrl: optionalUrlSchema,
  referenceUrl: optionalUrlSchema,
  readmeUrl: optionalUrlSchema,
})
export const contentSelectSchema = createSelectSchema(content)

// --- Tools ---
export const toolInsertSchema = createInsertSchema(tools, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  version: optionalSemverSchema,
  website: optionalUrlSchema,
  github: optionalUrlSchema,
  documentationUrl: optionalUrlSchema,
})
export const toolSelectSchema = createSelectSchema(tools)

// --- Courses ---
export const courseInsertSchema = createInsertSchema(courses, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  website: optionalUrlSchema,
  registrationUrl: optionalUrlSchema,
  materialsUrl: optionalUrlSchema,
})
export const courseSelectSchema = createSelectSchema(courses)

// --- Course Resources ---
export const courseResourceInsertSchema = createInsertSchema(courseResources, {
  id: z.string().optional(), // PB auto-generates ID
  url: urlSchema,
})
export const courseResourceSelectSchema = createSelectSchema(courseResources)

// --- Course Sessions ---
export const courseSessionInsertSchema = createInsertSchema(courseSessions, {
  id: z.string().optional(), // PB auto-generates ID
  meetingUrl: optionalUrlSchema,
  recordingUrl: optionalUrlSchema,
})
export const courseSessionSelectSchema = createSelectSchema(courseSessions)

// --- Media ---
export const mediaInsertSchema = createInsertSchema(media, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  url: optionalUrlSchema,
})
export const mediaSelectSchema = createSelectSchema(media)

// --- Distributions ---
export const distributionInsertSchema = createInsertSchema(distributions, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  version: optionalSemverSchema,
  registryUrl: optionalUrlSchema,
  github: optionalUrlSchema,
  documentationUrl: optionalUrlSchema,
})
export const distributionSelectSchema = createSelectSchema(distributions)

// ============================================================================
// RELEASE TABLE SCHEMAS
// ============================================================================

// --- Content Releases ---
export const contentReleaseInsertSchema = createInsertSchema(contentReleases, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
})
export const contentReleaseSelectSchema = createSelectSchema(contentReleases)

// --- Tool Releases ---
export const toolReleaseInsertSchema = createInsertSchema(toolReleases, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  downloadUrl: optionalUrlSchema,
})
export const toolReleaseSelectSchema = createSelectSchema(toolReleases)

// --- Distribution Releases ---
export const distributionReleaseInsertSchema = createInsertSchema(distributionReleases, {
  id: z.string().optional(), // PB auto-generates ID
  slug: slugSchema,
  registryUrl: optionalUrlSchema,
  downloadUrl: optionalUrlSchema,
})
export const distributionReleaseSelectSchema = createSelectSchema(distributionReleases)

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

// Insert types
export type CapabilityInsert = z.infer<typeof capabilityInsertSchema>
export type CategoryInsert = z.infer<typeof categoryInsertSchema>
export type OrganizationInsert = z.infer<typeof organizationInsertSchema>
export type TeamInsert = z.infer<typeof teamInsertSchema>
export type StandardInsert = z.infer<typeof standardInsertSchema>
export type TechnologyInsert = z.infer<typeof technologyInsertSchema>
export type TargetInsert = z.infer<typeof targetInsertSchema>
export type TagInsert = z.infer<typeof tagInsertSchema>
export type ToolTypeInsert = z.infer<typeof toolTypeInsertSchema>
export type DistributionTypeInsert = z.infer<typeof distributionTypeInsertSchema>
export type RegistryInsert = z.infer<typeof registryInsertSchema>
export type ResourceTypeInsert = z.infer<typeof resourceTypeInsertSchema>
export type MediaTypeInsert = z.infer<typeof mediaTypeInsertSchema>
export type ContentInsert = z.infer<typeof contentInsertSchema>
export type ToolInsert = z.infer<typeof toolInsertSchema>
export type CourseInsert = z.infer<typeof courseInsertSchema>
export type CourseResourceInsert = z.infer<typeof courseResourceInsertSchema>
export type CourseSessionInsert = z.infer<typeof courseSessionInsertSchema>
export type MediaInsert = z.infer<typeof mediaInsertSchema>
export type DistributionInsert = z.infer<typeof distributionInsertSchema>
export type ContentReleaseInsert = z.infer<typeof contentReleaseInsertSchema>
export type ToolReleaseInsert = z.infer<typeof toolReleaseInsertSchema>
export type DistributionReleaseInsert = z.infer<typeof distributionReleaseInsertSchema>

// Select types
export type CapabilitySelect = z.infer<typeof capabilitySelectSchema>
export type CategorySelect = z.infer<typeof categorySelectSchema>
export type OrganizationSelect = z.infer<typeof organizationSelectSchema>
export type TeamSelect = z.infer<typeof teamSelectSchema>
export type StandardSelect = z.infer<typeof standardSelectSchema>
export type TechnologySelect = z.infer<typeof technologySelectSchema>
export type TargetSelect = z.infer<typeof targetSelectSchema>
export type TagSelect = z.infer<typeof tagSelectSchema>
export type ToolTypeSelect = z.infer<typeof toolTypeSelectSchema>
export type DistributionTypeSelect = z.infer<typeof distributionTypeSelectSchema>
export type RegistrySelect = z.infer<typeof registrySelectSchema>
export type ResourceTypeSelect = z.infer<typeof resourceTypeSelectSchema>
export type MediaTypeSelect = z.infer<typeof mediaTypeSelectSchema>
export type ContentSelect = z.infer<typeof contentSelectSchema>
export type ToolSelect = z.infer<typeof toolSelectSchema>
export type CourseSelect = z.infer<typeof courseSelectSchema>
export type CourseResourceSelect = z.infer<typeof courseResourceSelectSchema>
export type CourseSessionSelect = z.infer<typeof courseSessionSelectSchema>
export type MediaSelect = z.infer<typeof mediaSelectSchema>
export type DistributionSelect = z.infer<typeof distributionSelectSchema>
export type ContentReleaseSelect = z.infer<typeof contentReleaseSelectSchema>
export type ToolReleaseSelect = z.infer<typeof toolReleaseSelectSchema>
export type DistributionReleaseSelect = z.infer<typeof distributionReleaseSelectSchema>

// Enum types
export type ContentType = z.infer<typeof contentTypeSchema>
export type Status = z.infer<typeof statusSchema>
export type AutomationLevel = z.infer<typeof automationLevelSchema>
export type RelationshipType = z.infer<typeof relationshipTypeSchema>
export type OrgType = z.infer<typeof orgTypeSchema>
export type StandardType = z.infer<typeof standardTypeSchema>
export type TagCategory = z.infer<typeof tagCategorySchema>
