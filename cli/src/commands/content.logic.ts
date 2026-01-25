/**
 * Content Command Logic (Phase 3.1)
 *
 * Pure business logic for preparing content records.
 * No I/O - all side effects are passed as dependencies.
 */

import type { ContentDiff, ContentFKNames, RepoData } from '../lib/content-service.js'
import type { InspecProfile, RepoInfo } from '../lib/github.js'
import type { CreateContentInput, FkMaps, UpdateContentInput } from '../lib/pocketbase.js'
import { validateSlug } from '@schema/validation.js'
import {
  buildContentFromRepo,
  checkUnresolvedFKs,

  diffContent,

  resolveContentFKs,
} from '../lib/content-service.js'
import {
  semverSchema,
  slugSchema,
  statusSchema,
} from '@schema/schema.zod.js'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Service dependencies (for testing/mocking)
 */
export interface ServiceDeps {
  parseGitHubUrl: (url: string) => { owner: string, repo: string } | null
  fetchRepoInfo: (owner: string, repo: string) => Promise<RepoInfo>
  fetchInspecYml: (owner: string, repo: string, branch?: string) => Promise<InspecProfile | null>
  fetchReadme: (owner: string, repo: string, branch?: string) => Promise<string | null>
}

/**
 * Input for prepareContentAdd
 */
export interface PrepareAddInput {
  githubUrl: string
  contentType: 'validation' | 'hardening'
  fkNames?: ContentFKNames
  overrides?: Partial<CreateContentInput>
}

/**
 * Result from prepareContentAdd
 */
export interface PrepareAddResult {
  success: boolean
  content?: CreateContentInput
  repoInfo?: RepoInfo
  inspecProfile?: InspecProfile | null
  warnings: string[]
  errors: string[]
}

/**
 * Input for prepareContentUpdate
 */
export interface PrepareUpdateInput {
  updates: Partial<UpdateContentInput>
}

/**
 * Result from prepareContentUpdate
 */
export interface PrepareUpdateResult {
  success: boolean
  hasChanges: boolean
  updates?: Partial<UpdateContentInput>
  diff?: ContentDiff
  warnings: string[]
  errors: string[]
}

// Validation schemas imported from @schema/schema.zod.js

// ============================================================================
// PREPARE CONTENT ADD
// ============================================================================

/**
 * Prepare content record from GitHub repository
 *
 * Orchestrates:
 * 1. Parse and validate GitHub URL
 * 2. Fetch repo info, inspec.yml, README
 * 3. Build content from repo data
 * 4. Resolve FK names to IDs
 * 5. Apply user overrides
 * 6. Validate final record
 *
 * Returns structured result with content, warnings, and errors.
 */
export async function prepareContentAdd(
  input: PrepareAddInput,
  fkMaps: FkMaps,
  deps: ServiceDeps,
): Promise<PrepareAddResult> {
  const warnings: string[] = []
  const errors: string[] = []

  // 1. Parse GitHub URL
  const parsed = deps.parseGitHubUrl(input.githubUrl)
  if (!parsed) {
    return {
      success: false,
      warnings: [],
      errors: ['Invalid GitHub URL'],
    }
  }

  // 2. Fetch repository data
  let repoInfo: RepoInfo
  let inspecProfile: InspecProfile | null = null
  let readme: string | null = null

  try {
    repoInfo = await deps.fetchRepoInfo(parsed.owner, parsed.repo)
  }
  catch (error) {
    return {
      success: false,
      warnings: [],
      errors: [`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`],
    }
  }

  try {
    inspecProfile = await deps.fetchInspecYml(parsed.owner, parsed.repo, repoInfo.defaultBranch)
    if (!inspecProfile) {
      warnings.push('No inspec.yml found - using defaults')
    }
  }
  catch {
    warnings.push('Failed to fetch inspec.yml - using defaults')
  }

  try {
    readme = await deps.fetchReadme(parsed.owner, parsed.repo, repoInfo.defaultBranch)
    if (!readme) {
      warnings.push('No README found')
    }
  }
  catch {
    warnings.push('Failed to fetch README')
  }

  // 3. Build content from repo data
  const repoData: RepoData = {
    repoInfo,
    inspecProfile: inspecProfile || undefined,
    readme: readme || undefined,
    contentType: input.contentType,
    automationLevel: input.overrides?.automationLevel,
  }

  let content = buildContentFromRepo(repoData)

  // 4. Resolve FK names to IDs
  if (input.fkNames) {
    const resolvedFKs = resolveContentFKs(input.fkNames, fkMaps)

    // Check for unresolved FKs and warn
    warnings.push(...checkUnresolvedFKs(input.fkNames, resolvedFKs))

    // Merge resolved FKs
    content = {
      ...content,
      ...resolvedFKs,
    }
  }

  // 5. Apply user overrides
  if (input.overrides) {
    content = {
      ...content,
      ...input.overrides,
    }
  }

  // 6. Validate final record
  // Validate slug
  if (content.slug) {
    const slugResult = slugSchema.safeParse(content.slug)
    if (!slugResult.success) {
      errors.push(`Slug validation failed: ${slugResult.error.issues[0].message}`)
    }
    else {
      // Check slug conventions
      const slugValidation = validateSlug(content.slug)
      warnings.push(...slugValidation.warnings)
    }
  }

  // Validate version if provided
  if (content.version) {
    const versionResult = semverSchema.safeParse(content.version)
    if (!versionResult.success) {
      errors.push(`Version validation failed: ${versionResult.error.issues[0].message}`)
    }
  }

  // Validate status if provided
  if (content.status) {
    const statusResult = statusSchema.safeParse(content.status)
    if (!statusResult.success) {
      errors.push(`Status validation failed: ${statusResult.error.issues[0].message}`)
    }
  }

  // Return result
  if (errors.length > 0) {
    return {
      success: false,
      repoInfo,
      inspecProfile,
      warnings,
      errors,
    }
  }

  return {
    success: true,
    content,
    repoInfo,
    inspecProfile,
    warnings,
    errors: [],
  }
}

// ============================================================================
// PREPARE CONTENT UPDATE
// ============================================================================

/**
 * Prepare content update with validation and diff
 *
 * Orchestrates:
 * 1. Validate update fields
 * 2. Compute diff against existing
 * 3. Return only changed fields
 */
export function prepareContentUpdate(
  existing: Record<string, unknown>,
  input: PrepareUpdateInput,
): PrepareUpdateResult {
  const warnings: string[] = []
  const errors: string[] = []
  const { updates } = input

  // 1. Validate update fields
  if (updates.slug) {
    const slugResult = slugSchema.safeParse(updates.slug)
    if (!slugResult.success) {
      errors.push(`Slug validation failed: ${slugResult.error.issues[0].message}`)
    }
    else {
      // Check slug conventions
      const slugValidation = validateSlug(updates.slug)
      warnings.push(...slugValidation.warnings)
    }
  }

  if (updates.version) {
    const versionResult = semverSchema.safeParse(updates.version)
    if (!versionResult.success) {
      errors.push(`Version validation failed: ${versionResult.error.issues[0].message}`)
    }
  }

  if (updates.status) {
    const statusResult = statusSchema.safeParse(updates.status)
    if (!statusResult.success) {
      errors.push(`Status validation failed: ${statusResult.error.issues[0].message}`)
    }
  }

  // Return early on validation errors
  if (errors.length > 0) {
    return {
      success: false,
      hasChanges: false,
      warnings,
      errors,
    }
  }

  // 2. Compute diff
  const diff = diffContent(existing, updates as Partial<CreateContentInput>)

  // 3. Build updates with only changed fields
  const changedUpdates: Partial<UpdateContentInput> = {}
  for (const field of Object.keys(diff.changes)) {
    const change = diff.changes[field]
    changedUpdates[field as keyof UpdateContentInput] = change.new as any
  }

  return {
    success: true,
    hasChanges: diff.hasChanges,
    updates: diff.hasChanges ? changedUpdates : undefined,
    diff,
    warnings,
    errors: [],
  }
}
