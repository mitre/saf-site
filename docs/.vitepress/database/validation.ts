/**
 * Content Validation
 *
 * Enforces naming conventions at the data layer
 */

import { z } from 'zod'
import { TARGET_ABBREVIATIONS, STANDARD_IDENTIFIERS, TECHNOLOGY_PREFIXES } from './conventions.js'

// Build regex patterns from our canonical mappings
const targetAbbreviations = Object.values(TARGET_ABBREVIATIONS)
const standardIdentifiers = Object.values(STANDARD_IDENTIFIERS)
const technologyPrefixes = Object.values(TECHNOLOGY_PREFIXES)

/**
 * Slug validation pattern
 *
 * Valid formats:
 * - {target}-{standard}           e.g., rhel-9-stig
 * - {target}-{version}-{standard} e.g., rhel-9-stig, ubuntu-2204-cis
 * - {tech}-{target}-{standard}    e.g., ansible-rhel-9-stig
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Validate a slug follows conventions
 */
export function validateSlug(slug: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic format check
  if (!SLUG_PATTERN.test(slug)) {
    errors.push('Slug must be lowercase alphanumeric with hyphens only')
    return { valid: false, errors, warnings }
  }

  // Check for common anti-patterns
  if (slug.includes('--')) {
    errors.push('Slug contains consecutive hyphens')
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    errors.push('Slug cannot start or end with hyphen')
  }

  // Check for non-standard abbreviations
  const parts = slug.split('-')

  // Check if slug ends with a known standard
  const lastPart = parts[parts.length - 1]
  const secondLastPart = parts.length > 1 ? parts[parts.length - 2] : null

  // Standards can be hyphenated (pci-dss, nist-800-53)
  const possibleStandards = [
    lastPart,
    secondLastPart ? `${secondLastPart}-${lastPart}` : null,
    parts.length > 2 ? `${parts[parts.length - 3]}-${secondLastPart}-${lastPart}` : null
  ].filter(Boolean) as string[]

  const hasValidStandard = possibleStandards.some(s => standardIdentifiers.includes(s))

  if (!hasValidStandard) {
    warnings.push(`Slug should end with a known standard identifier: ${standardIdentifiers.join(', ')}`)
  }

  // Check for old-style naming (red-hat instead of rhel)
  if (slug.includes('red-hat')) {
    warnings.push('Use "rhel" instead of "red-hat" for Red Hat Enterprise Linux')
  }

  if (slug.includes('windows') && !slug.includes('win-')) {
    warnings.push('Consider using "win" instead of "windows" for Windows Server')
  }

  if (slug.includes('enterprise-linux')) {
    warnings.push('Use "rhel" abbreviation instead of full "enterprise-linux"')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Zod schema for content slugs
 */
export const slugSchema = z.string()
  .min(3, 'Slug must be at least 3 characters')
  .max(100, 'Slug must be at most 100 characters')
  .regex(SLUG_PATTERN, 'Slug must be lowercase alphanumeric with hyphens')
  .refine(
    (slug) => !slug.includes('--'),
    'Slug cannot contain consecutive hyphens'
  )
  .refine(
    (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
    'Slug cannot start or end with hyphen'
  )

/**
 * Zod schema for content type
 */
export const contentTypeSchema = z.enum(['validation', 'hardening'])

/**
 * Zod schema for content status
 */
export const statusSchema = z.enum(['active', 'beta', 'deprecated', 'draft'])

/**
 * Full content validation schema
 */
export const contentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: slugSchema,
  description: z.string().optional(),
  content_type: contentTypeSchema,
  status: statusSchema.default('active'),
  version: z.string().optional(),

  // FKs - validated as non-empty strings (actual FK validation done at DB level)
  target: z.string().min(1).optional(),
  standard: z.string().min(1).optional(),
  technology: z.string().min(1).optional(),
  vendor: z.string().min(1).optional(),
  maintainer: z.string().min(1).optional(),

  // URLs
  github: z.string().url().optional().or(z.literal('')),
  documentation_url: z.string().url().optional().or(z.literal('')),
  reference_url: z.string().url().optional().or(z.literal('')),

  // Metadata
  control_count: z.number().int().positive().optional(),
  license: z.string().optional(),
})

/**
 * Validate content data before insert/update
 */
export function validateContent(data: unknown): {
  valid: boolean
  data?: z.infer<typeof contentSchema>
  errors?: z.ZodError
  warnings: string[]
} {
  const warnings: string[] = []

  // Parse with Zod
  const result = contentSchema.safeParse(data)

  if (!result.success) {
    return {
      valid: false,
      errors: result.error,
      warnings
    }
  }

  // Additional convention checks
  const slugValidation = validateSlug(result.data.slug)
  warnings.push(...slugValidation.warnings)

  if (!slugValidation.valid) {
    return {
      valid: false,
      errors: new z.ZodError(
        slugValidation.errors.map(msg => ({
          code: 'custom',
          path: ['slug'],
          message: msg
        }))
      ),
      warnings
    }
  }

  return {
    valid: true,
    data: result.data,
    warnings
  }
}

/**
 * Audit existing content records for convention compliance
 */
export function auditSlug(slug: string, name: string): {
  compliant: boolean
  issues: string[]
  suggestedSlug?: string
} {
  const issues: string[] = []
  const validation = validateSlug(slug)

  issues.push(...validation.errors)
  issues.push(...validation.warnings)

  // Check if slug matches expected pattern based on name
  // This is a basic heuristic - the CLI can suggest better slugs
  const nameLower = name.toLowerCase()

  // Check for common mismatches
  if (nameLower.includes('red hat') && !slug.startsWith('rhel')) {
    issues.push('Expected slug to start with "rhel" for Red Hat content')
  }

  if (nameLower.includes('windows') && !slug.includes('win')) {
    issues.push('Expected slug to include "win" for Windows content')
  }

  return {
    compliant: issues.length === 0,
    issues,
    suggestedSlug: issues.length > 0 ? undefined : slug // TODO: Generate suggestion
  }
}
