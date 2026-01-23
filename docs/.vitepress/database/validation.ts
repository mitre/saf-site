/**
 * Entity Validation (Phase 1.3)
 *
 * Validation functions that combine Zod schema validation with convention checks.
 * Uses schemas from schemas.ts as the source of truth.
 */

import { z, ZodError } from 'zod'
import {
  organizationInputSchema,
  targetInputSchema,
  standardInputSchema,
  technologyInputSchema,
  teamInputSchema,
  tagInputSchema,
  contentInputSchema,
  type OrganizationInput,
  type TargetInput,
  type StandardInput,
  type TechnologyInput,
  type TeamInput,
  type TagInput,
  type ContentInput
} from './schemas.js'
import {
  TARGET_ABBREVIATIONS,
  STANDARD_IDENTIFIERS,
  TECHNOLOGY_PREFIXES,
  generateContentSlug,
  abbreviateTarget
} from './conventions.js'

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult<T> {
  valid: boolean
  data?: T
  errors?: ZodError
  warnings: string[]
}

export interface AuditResult {
  compliant: boolean
  issues: string[]
  suggestedSlug?: string
}

// ============================================================================
// SLUG VALIDATION
// ============================================================================

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const standardIdentifiers = Object.values(STANDARD_IDENTIFIERS)

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
 * Check slug for target abbreviation conventions (non-content entities)
 */
function checkTargetSlugConventions(slug: string, name: string): string[] {
  const warnings: string[] = []
  const nameLower = name.toLowerCase()

  // Check for common mismatches
  if (nameLower.includes('red hat') && !slug.startsWith('rhel')) {
    warnings.push('Use "rhel" instead of "red-hat" for Red Hat Enterprise Linux')
  }

  if (nameLower.includes('windows') && !slug.includes('win')) {
    warnings.push('Consider using "win" instead of "windows" for Windows Server')
  }

  if (nameLower.includes('enterprise linux') && slug.includes('enterprise-linux')) {
    warnings.push('Use "rhel" abbreviation instead of full "enterprise-linux"')
  }

  return warnings
}

// ============================================================================
// GENERIC VALIDATION
// ============================================================================

type EntityType = 'organization' | 'target' | 'standard' | 'technology' | 'team' | 'tag' | 'content'

const schemaMap = {
  organization: organizationInputSchema,
  target: targetInputSchema,
  standard: standardInputSchema,
  technology: technologyInputSchema,
  team: teamInputSchema,
  tag: tagInputSchema,
  content: contentInputSchema
} as const

/**
 * Generic entity validation
 */
export function validateEntity<T extends EntityType>(
  entityType: T,
  data: unknown
): ValidationResult<z.infer<typeof schemaMap[T]>> {
  const schema = schemaMap[entityType]

  if (!schema) {
    throw new Error(`Unknown entity type: ${entityType}`)
  }

  const warnings: string[] = []
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      valid: false,
      errors: result.error,
      warnings
    }
  }

  // Add convention warnings based on entity type
  const typedData = result.data as { slug?: string; name?: string; contentType?: string }

  if (typedData.slug && typedData.name) {
    if (entityType === 'content') {
      const slugValidation = validateSlug(typedData.slug)
      warnings.push(...slugValidation.warnings)
    } else if (entityType === 'target') {
      warnings.push(...checkTargetSlugConventions(typedData.slug, typedData.name))
    }
  }

  return {
    valid: true,
    data: result.data,
    warnings
  }
}

// ============================================================================
// ENTITY-SPECIFIC VALIDATION
// ============================================================================

/**
 * Validate organization input
 */
export function validateOrganization(data: unknown): ValidationResult<OrganizationInput> {
  return validateEntity('organization', data) as ValidationResult<OrganizationInput>
}

/**
 * Validate target input
 */
export function validateTarget(data: unknown): ValidationResult<TargetInput> {
  return validateEntity('target', data) as ValidationResult<TargetInput>
}

/**
 * Validate standard input
 */
export function validateStandard(data: unknown): ValidationResult<StandardInput> {
  return validateEntity('standard', data) as ValidationResult<StandardInput>
}

/**
 * Validate technology input
 */
export function validateTechnology(data: unknown): ValidationResult<TechnologyInput> {
  return validateEntity('technology', data) as ValidationResult<TechnologyInput>
}

/**
 * Validate team input
 */
export function validateTeam(data: unknown): ValidationResult<TeamInput> {
  return validateEntity('team', data) as ValidationResult<TeamInput>
}

/**
 * Validate tag input
 */
export function validateTag(data: unknown): ValidationResult<TagInput> {
  return validateEntity('tag', data) as ValidationResult<TagInput>
}

/**
 * Validate content input
 */
export function validateContent(data: unknown): ValidationResult<ContentInput> {
  return validateEntity('content', data) as ValidationResult<ContentInput>
}

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

/**
 * Audit a slug for convention compliance
 */
export function auditSlug(slug: string, name: string): AuditResult {
  const issues: string[] = []
  const validation = validateSlug(slug)

  issues.push(...validation.errors)
  issues.push(...validation.warnings)

  // Check if slug matches expected pattern based on name
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
    suggestedSlug: issues.length > 0 ? undefined : slug
  }
}

/**
 * Audit an entity record for convention compliance
 */
export function auditEntity(
  entityType: EntityType,
  data: { name: string; slug: string; contentType?: string; [key: string]: unknown }
): AuditResult {
  const issues: string[] = []
  let suggestedSlug: string | undefined

  // First validate the data
  const validation = validateEntity(entityType, data)

  if (!validation.valid && validation.errors) {
    // Convert Zod errors to issue strings
    for (const error of validation.errors.errors) {
      issues.push(`${error.path.join('.')}: ${error.message}`)
    }
  }

  // Add convention warnings as issues
  issues.push(...validation.warnings)

  // Check slug conventions based on entity type
  if (entityType === 'content' && data.contentType) {
    const slugAudit = auditSlug(data.slug, data.name)

    // Only add unique issues
    for (const issue of slugAudit.issues) {
      if (!issues.includes(issue)) {
        issues.push(issue)
      }
    }

    // Try to generate suggested slug for content
    if (issues.length > 0) {
      // Extract standard from name (e.g., "STIG", "CIS")
      const nameParts = data.name.split(' ')
      let standard = 'stig' // default

      for (const part of nameParts) {
        const partLower = part.toLowerCase()
        if (standardIdentifiers.includes(partLower)) {
          standard = partLower
          break
        }
      }

      // Try to generate correct slug
      const targetAbbrev = abbreviateTarget(data.name.replace(/stig|cis|pci.?dss|nist|hipaa/gi, '').trim())

      // Extract version from name
      const versionMatch = data.name.match(/(\d+(?:\.\d+)?(?:\.\d+)?)/)
      const version = versionMatch ? versionMatch[1].replace('.', '') : ''

      if (targetAbbrev) {
        suggestedSlug = version
          ? `${targetAbbrev}-${version}-${standard}`
          : `${targetAbbrev}-${standard}`
      }
    }
  } else if (entityType === 'target') {
    const targetWarnings = checkTargetSlugConventions(data.slug, data.name)
    for (const warning of targetWarnings) {
      if (!issues.includes(warning)) {
        issues.push(warning)
      }
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
    suggestedSlug
  }
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// Re-export schemas that were previously in this file
export { contentInputSchema as contentSchema } from './schemas.js'
export { z } from 'zod'
