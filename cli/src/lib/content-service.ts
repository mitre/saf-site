/**
 * Content Service (Phase 2.3)
 *
 * Bridges GitHub repository data and Pocketbase content records.
 * Handles building content records, resolving FKs, and diffing changes.
 */

import type { InspecProfile, RepoInfo } from './github.js'
import type { CreateContentInput, FkMaps } from './pocketbase.js'
import { extractControlCount, generateSlug } from './github.js'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input data from GitHub repository
 */
export interface RepoData {
  repoInfo: RepoInfo
  inspecProfile?: InspecProfile
  readme?: string
  contentType: 'validation' | 'hardening'
  automationLevel?: 'full' | 'partial' | 'manual'
}

/**
 * Human-readable FK names for resolution
 */
export interface ContentFKNames {
  vendor?: string
  standard?: string
  technology?: string
  target?: string
  maintainer?: string
}

/**
 * Resolved FK IDs
 */
export interface ResolvedFKs {
  vendor?: string
  standard?: string
  technology?: string
  target?: string
  maintainer?: string
}

/**
 * Single field change
 */
export interface FieldChange<T = unknown> {
  old: T
  new: T
}

/**
 * Content diff result
 */
export interface ContentDiff {
  hasChanges: boolean
  changes: Record<string, FieldChange>
}

// ============================================================================
// BUILD CONTENT FROM REPO
// ============================================================================

/**
 * Build a CreateContentInput from GitHub repository data
 */
export function buildContentFromRepo(repoData: RepoData): CreateContentInput {
  const { repoInfo, inspecProfile, readme, contentType, automationLevel } = repoData

  // Determine name: inspec title > repo description > repo name
  let name: string
  if (inspecProfile?.title) {
    name = inspecProfile.title
  }
  else if (repoInfo.description) {
    name = repoInfo.description
  }
  else {
    name = repoInfo.repo
  }

  // Generate slug from repo name
  const slug = generateSlug(repoInfo.repo)

  // Extract version from inspec.yml
  const version = inspecProfile?.version

  // Use inspec summary or repo description
  const description = inspecProfile?.summary || repoInfo.description || undefined

  // Extract control count from README
  const controlCount = readme ? extractControlCount(readme) : undefined

  // Get license from inspec.yml or repo
  const license = inspecProfile?.license || repoInfo.license || undefined

  // Build the content input
  const content: CreateContentInput = {
    name,
    slug,
    contentType,
    status: 'active',
    github: repoInfo.htmlUrl,
  }

  // Add optional fields if present
  if (description)
    content.description = description
  if (version)
    content.version = version
  if (license)
    content.license = license
  if (controlCount)
    content.controlCount = controlCount
  if (readme)
    content.readmeMarkdown = readme
  if (automationLevel)
    content.automationLevel = automationLevel

  return content
}

// ============================================================================
// RESOLVE CONTENT FKS
// ============================================================================

/**
 * FK field configuration for resolution
 * Maps fkNames field to the corresponding fkMaps collection
 */
const FK_FIELD_CONFIG: Array<{ field: keyof ContentFKNames, mapKey: keyof FkMaps }> = [
  { field: 'vendor', mapKey: 'organizations' },
  { field: 'standard', mapKey: 'standards' },
  { field: 'technology', mapKey: 'technologies' },
  { field: 'target', mapKey: 'targets' },
  { field: 'maintainer', mapKey: 'teams' },
]

/**
 * Resolve a single FK name to its ID
 */
function resolveSingleFK(
  name: string | undefined,
  fkMap: Map<string, string>,
): string | undefined {
  if (!name)
    return undefined
  return fkMap.get(name.toLowerCase())
}

/**
 * Resolve human-readable FK names to Pocketbase IDs
 */
export function resolveContentFKs(fkNames: ContentFKNames, fkMaps: FkMaps): ResolvedFKs {
  const result: ResolvedFKs = {}

  for (const { field, mapKey } of FK_FIELD_CONFIG) {
    const id = resolveSingleFK(fkNames[field], fkMaps[mapKey])
    if (id)
      result[field] = id
  }

  return result
}

/**
 * Check for unresolved FKs and return warning messages
 */
export function checkUnresolvedFKs(
  fkNames: ContentFKNames,
  resolvedFKs: ResolvedFKs,
): string[] {
  const warnings: string[] = []

  for (const { field } of FK_FIELD_CONFIG) {
    if (fkNames[field] && !resolvedFKs[field]) {
      warnings.push(`Could not resolve ${field}: "${fkNames[field]}"`)
    }
  }

  return warnings
}

// ============================================================================
// DIFF CONTENT
// ============================================================================

/**
 * Field mapping from Pocketbase snake_case to camelCase
 */
const snakeToCamelMap: Record<string, string> = {
  content_type: 'contentType',
  long_description: 'longDescription',
  documentation_url: 'documentationUrl',
  reference_url: 'referenceUrl',
  readme_url: 'readmeUrl',
  readme_markdown: 'readmeMarkdown',
  control_count: 'controlCount',
  stig_id: 'stigId',
  benchmark_version: 'benchmarkVersion',
  automation_level: 'automationLevel',
  is_featured: 'isFeatured',
  featured_order: 'featuredOrder',
}

/**
 * Compare existing Pocketbase content with updated input and return differences
 */
export function diffContent(
  existing: Record<string, unknown>,
  updated: Partial<CreateContentInput>,
): ContentDiff {
  const changes: Record<string, FieldChange> = {}

  // Fields to compare (camelCase from CreateContentInput)
  const fieldsToCompare = [
    'name',
    'slug',
    'contentType',
    'description',
    'longDescription',
    'version',
    'status',
    'github',
    'documentationUrl',
    'referenceUrl',
    'readmeUrl',
    'readmeMarkdown',
    'controlCount',
    'stigId',
    'benchmarkVersion',
    'automationLevel',
    'isFeatured',
    'featuredOrder',
    'license',
    'target',
    'standard',
    'technology',
    'vendor',
    'maintainer',
  ]

  // Build reverse mapping (camelCase to snake_case)
  const camelToSnakeMap: Record<string, string> = {}
  for (const [snake, camel] of Object.entries(snakeToCamelMap)) {
    camelToSnakeMap[camel] = snake
  }

  for (const field of fieldsToCompare) {
    // Get updated value (if provided)
    const updatedValue = updated[field as keyof CreateContentInput]

    // Skip if not provided in update
    if (updatedValue === undefined)
      continue

    // Get existing value (may be snake_case)
    const snakeField = camelToSnakeMap[field] || field
    const existingValue = existing[snakeField] ?? existing[field]

    // Compare values
    if (existingValue !== updatedValue) {
      changes[field] = {
        old: existingValue,
        new: updatedValue,
      }
    }
  }

  return {
    hasChanges: Object.keys(changes).length > 0,
    changes,
  }
}
