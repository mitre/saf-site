import { z } from 'zod'
import {
  insertProfileSchema,
  insertHardeningProfileSchema,
  insertStandardSchema,
  insertOrganizationSchema,
  insertTeamSchema,
  insertToolSchema,
  insertTechnologySchema,
  insertTagSchema,
  insertCapabilitySchema
} from './schema'

/**
 * YAML File Validation Schemas
 *
 * These schemas validate the wrapper structure of YAML files.
 * Each YAML file has:
 * - _id: Unique identifier for the file
 * - _metadata: Optional metadata about the collection
 * - [collection]: Array of items (profiles, standards, etc.)
 *
 * Individual items are validated using drizzle-zod schemas from schema.ts
 */

// ============ VALIDATION PROFILES ============

export const ProfilesFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    standard: z.string().optional(),
    description: z.string().optional()
  }).optional(),
  profiles: z.array(insertProfileSchema)
})

export type ProfilesFile = z.infer<typeof ProfilesFileSchema>

// ============ HARDENING PROFILES ============

export const HardeningFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    framework: z.string().optional(),
    technology: z.string().optional(),
    description: z.string().optional(),
    lastUpdated: z.string().optional(),
    team: z.string().optional(),
    organization: z.string().optional(),
    logo: z.string().optional()
  }).optional(),
  profiles: z.array(insertHardeningProfileSchema)
})

export type HardeningFile = z.infer<typeof HardeningFileSchema>

// ============ STANDARDS ============

export const StandardsFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    description: z.string().optional()
  }).optional(),
  standards: z.array(insertStandardSchema)
})

export type StandardsFile = z.infer<typeof StandardsFileSchema>

// ============ ORGANIZATIONS ============

export const OrganizationsFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    description: z.string().optional()
  }).optional(),
  organizations: z.array(insertOrganizationSchema)
})

export type OrganizationsFile = z.infer<typeof OrganizationsFileSchema>

// ============ TEAMS ============

export const TeamsFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    description: z.string().optional()
  }).optional(),
  teams: z.array(insertTeamSchema)
})

export type TeamsFile = z.infer<typeof TeamsFileSchema>

// ============ TOOLS ============

export const ToolsFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    description: z.string().optional()
  }).optional(),
  tools: z.array(insertToolSchema)
})

export type ToolsFile = z.infer<typeof ToolsFileSchema>

// ============ TECHNOLOGIES ============

export const TechnologiesFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    description: z.string().optional()
  }).optional(),
  technologies: z.array(insertTechnologySchema)
})

export type TechnologiesFile = z.infer<typeof TechnologiesFileSchema>

// ============ TAGS ============

export const TagsFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    description: z.string().optional()
  }).optional(),
  tags: z.array(insertTagSchema)
})

export type TagsFile = z.infer<typeof TagsFileSchema>

// ============ CAPABILITIES ============

export const CapabilitiesFileSchema = z.object({
  _id: z.string(),
  _metadata: z.object({
    description: z.string().optional()
  }).optional(),
  capabilities: z.array(insertCapabilitySchema)
})

export type CapabilitiesFile = z.infer<typeof CapabilitiesFileSchema>

// ============ HELPER FUNCTIONS ============

/**
 * Validate a profiles YAML file
 */
export function validateProfilesFile(data: unknown): ProfilesFile {
  return ProfilesFileSchema.parse(data)
}

/**
 * Validate a hardening profiles YAML file
 */
export function validateHardeningFile(data: unknown): HardeningFile {
  return HardeningFileSchema.parse(data)
}

/**
 * Validate a standards YAML file
 */
export function validateStandardsFile(data: unknown): StandardsFile {
  return StandardsFileSchema.parse(data)
}

/**
 * Validate an organizations YAML file
 */
export function validateOrganizationsFile(data: unknown): OrganizationsFile {
  return OrganizationsFileSchema.parse(data)
}

/**
 * Validate a teams YAML file
 */
export function validateTeamsFile(data: unknown): TeamsFile {
  return TeamsFileSchema.parse(data)
}

/**
 * Validate a tools YAML file
 */
export function validateToolsFile(data: unknown): ToolsFile {
  return ToolsFileSchema.parse(data)
}

/**
 * Validate a technologies YAML file
 */
export function validateTechnologiesFile(data: unknown): TechnologiesFile {
  return TechnologiesFileSchema.parse(data)
}

/**
 * Validate a tags YAML file
 */
export function validateTagsFile(data: unknown): TagsFile {
  return TagsFileSchema.parse(data)
}

/**
 * Validate a capabilities YAML file
 */
export function validateCapabilitiesFile(data: unknown): CapabilitiesFile {
  return CapabilitiesFileSchema.parse(data)
}
