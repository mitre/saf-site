/**
 * Shared Validation Schemas
 *
 * Reusable Zod schemas for CLI validation.
 * These are the building blocks for content validation across the CLI.
 */

import { z } from 'zod'

// ============================================================================
// PATTERNS
// ============================================================================

/**
 * Slug pattern: lowercase alphanumeric with single hyphens
 */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Semver pattern: MAJOR.MINOR.PATCH[-prerelease][+build]
 * Per https://semver.org/
 */
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[0-9A-Z-]+(\.[0-9A-Z-]+)*)?(\+[0-9A-Z-]+(\.[0-9A-Z-]+)*)?$/i

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Content type enum schema
 */
export const contentTypeSchema = z.enum(['validation', 'hardening']).meta({
  id: 'content_type',
  title: 'Content Type',
  description: 'Type of security content: validation (InSpec profiles for testing) or hardening (Ansible/Chef for remediation)',
})

/**
 * Status enum schema
 */
export const statusSchema = z.enum(['active', 'beta', 'deprecated', 'draft']).meta({
  id: 'status',
  title: 'Publication Status',
  description: 'Lifecycle status: active (production-ready), beta (testing), deprecated (legacy), or draft (work-in-progress)',
})

/**
 * Automation level enum schema
 */
export const automationLevelSchema = z.enum(['full', 'partial', 'manual']).meta({
  id: 'automation_level',
  title: 'Automation Level',
  description: 'Degree of automation: full (automated execution), partial (some manual steps), or manual (fully manual)',
})

// ============================================================================
// FIELD SCHEMAS
// ============================================================================

/**
 * Slug schema - required version
 */
export const slugSchema = z.string()
  .min(1, 'Slug is required')
  .regex(SLUG_PATTERN, 'Slug must be lowercase alphanumeric with hyphens')
  .refine(s => !s.includes('--'), 'Slug cannot contain consecutive hyphens')
  .meta({
    id: 'slug',
    title: 'Slug',
    description: 'URL-friendly identifier. Lowercase alphanumeric with hyphens, no consecutive hyphens.',
  })

/**
 * Slug schema - optional version
 */
export const optionalSlugSchema = z.string()
  .regex(SLUG_PATTERN, 'Slug must be lowercase alphanumeric with hyphens')
  .refine(s => !s.includes('--'), 'Slug cannot contain consecutive hyphens')
  .optional()
  .meta({
    id: 'slug',
    title: 'Slug',
    description: 'URL-friendly identifier. Lowercase alphanumeric with hyphens, no consecutive hyphens.',
  })

/**
 * Semver schema - required version
 */
export const semverSchema = z.string()
  .regex(SEMVER_PATTERN, 'Version must be semver format (x.y.z[-prerelease][+build])')
  .meta({
    id: 'semver',
    title: 'Semantic Version',
    description: 'Version in semver format: MAJOR.MINOR.PATCH[-prerelease][+build]. See https://semver.org/',
  })

/**
 * Semver schema - optional version
 */
export const optionalSemverSchema = z.string()
  .regex(SEMVER_PATTERN, 'Version must be semver format (x.y.z[-prerelease][+build])')
  .optional()
  .meta({
    id: 'semver',
    title: 'Semantic Version',
    description: 'Version in semver format: MAJOR.MINOR.PATCH[-prerelease][+build]. See https://semver.org/',
  })

/**
 * Name schema - required
 */
export const nameSchema = z.string()
  .min(1, 'Name is required')
  .meta({
    id: 'name',
    title: 'Name',
    description: 'Display name of the content item',
  })

/**
 * Name schema - optional
 */
export const optionalNameSchema = z.string()
  .min(1)
  .optional()
  .meta({
    id: 'name',
    title: 'Name',
    description: 'Display name of the content item',
  })

/**
 * Description schema
 */
export const descriptionSchema = z.string()
  .optional()
  .meta({
    id: 'description',
    title: 'Description',
    description: 'Brief description shown in cards and search results',
  })

/**
 * GitHub URL schema
 */
export const githubUrlSchema = z.string()
  .url()
  .optional()
  .meta({
    id: 'github_url',
    title: 'GitHub URL',
    description: 'GitHub repository URL',
  })

/**
 * Control count schema
 */
export const controlCountSchema = z.number()
  .int()
  .positive()
  .optional()
  .meta({
    id: 'control_count',
    title: 'Control Count',
    description: 'Number of controls/rules in this profile',
  })
