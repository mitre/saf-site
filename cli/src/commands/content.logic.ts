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
} from '../lib/validation-schemas.js'

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

/**
 * Service dependencies for content sync (for testing/mocking)
 */
export interface SyncDeps {
  parseGitHubUrl: (url: string) => { owner: string, repo: string } | null
  fetchInspecYml: (owner: string, repo: string, branch?: string, path?: string) => Promise<InspecProfile | null>
  fetchLatestRelease: (owner: string, repo: string) => Promise<{ tagName: string, publishedAt: string | null, htmlUrl: string } | null>
  fetchLatestTag: (owner: string, repo: string) => Promise<{ tagName: string } | null>
}

/**
 * The subset of a content record the sync planner needs
 */
export interface SyncableRecord {
  id: string
  slug: string
  name: string
  github: string
  version: string | null
}

/**
 * Result of planning a sync for one content record
 */
export interface ContentSyncPlan {
  id: string
  slug: string
  status: 'up-to-date' | 'drift' | 'warning' | 'error'
  currentVersion: string | null
  inspecVersion: string | null
  releaseTag: string | null
  messages: string[]
  update?: { version: string, releaseDate?: string }
  release?: { slug: string, version: string, releaseDate?: string }
}

/**
 * Write operations executeSyncPlans needs (for testing/mocking)
 */
export interface SyncWriteDeps {
  updateContent: (id: string, updates: { version: string, releaseDate?: string }) => Promise<unknown>
  upsertRelease: (entityId: string, release: { slug: string, version: string, releaseDate?: string }) => Promise<unknown>
}

/**
 * Counts of what executeSyncPlans did (or would do)
 */
export interface SyncSummary {
  total: number
  upToDate: number
  drift: number
  applied: number
  warnings: number
  errors: number
}

// Validation schemas imported from ../lib/validation-schemas.js

// Monorepo profile URLs point at a subdirectory: /owner/repo/tree/branch/path
const GITHUB_TREE_URL_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)\/?$/

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

// ============================================================================
// CONTENT SYNC
// ============================================================================

/**
 * Strip a leading v/V from a release tag so it compares against
 * the schema's unprefixed semver convention
 */
function normalizeTag(tag: string): string {
  return tag.replace(/^v/i, '')
}

/**
 * Plan a sync for one content record.
 *
 * Version source of truth is inspec.yml's `version`; the latest
 * release/tag is recorded alongside and a disagreement between the two
 * is surfaced as a warning rather than silently resolved. Monorepo
 * profiles (github URLs pointing at /tree/<branch>/<path>) read
 * inspec.yml from the subdirectory and skip the release lookup, since
 * repo-level releases don't describe a single nested profile.
 */
export async function planContentSync(
  record: SyncableRecord,
  deps: SyncDeps,
): Promise<ContentSyncPlan> {
  const plan: ContentSyncPlan = {
    id: record.id,
    slug: record.slug,
    status: 'up-to-date',
    currentVersion: record.version,
    inspecVersion: null,
    releaseTag: null,
    messages: [],
  }

  // Resolve where inspec.yml lives (monorepo subdirectory vs repo root)
  const treeMatch = GITHUB_TREE_URL_REGEX.exec(record.github)
  let owner: string
  let repo: string
  let branch: string | undefined
  let path: string | undefined

  if (treeMatch) {
    [, owner, repo, branch, path] = treeMatch
  }
  else {
    const parsed = deps.parseGitHubUrl(record.github)
    if (!parsed) {
      plan.status = 'error'
      plan.messages.push(`Cannot parse GitHub URL: ${record.github}`)
      return plan
    }
    ;({ owner, repo } = parsed)
  }

  let releaseDate: string | undefined

  try {
    const inspecProfile = await deps.fetchInspecYml(owner, repo, branch, path)
    plan.inspecVersion = inspecProfile?.version ?? null

    // Releases/tags describe the whole repo — meaningless for one profile
    // nested in a monorepo, so only consult them for root-level profiles
    if (!treeMatch) {
      const release = await deps.fetchLatestRelease(owner, repo)
      if (release) {
        plan.releaseTag = normalizeTag(release.tagName)
        releaseDate = release.publishedAt ?? undefined
      }
      else {
        const tag = await deps.fetchLatestTag(owner, repo)
        if (tag)
          plan.releaseTag = normalizeTag(tag.tagName)
      }
    }
  }
  catch (error) {
    plan.status = 'error'
    plan.messages.push(error instanceof Error ? error.message : String(error))
    return plan
  }

  if (!plan.inspecVersion) {
    plan.status = 'warning'
    plan.messages.push('inspec.yml has no version field — cannot determine the canonical version')
    return plan
  }

  if (!semverSchema.safeParse(plan.inspecVersion).success) {
    plan.status = 'warning'
    plan.messages.push(`inspec.yml version "${plan.inspecVersion}" is not semver — fix the profile before syncing`)
    return plan
  }

  if (plan.releaseTag && plan.releaseTag !== plan.inspecVersion) {
    plan.status = 'warning'
    plan.messages.push(`Version mismatch: inspec.yml says ${plan.inspecVersion} but the latest release/tag is ${plan.releaseTag} — resolve upstream before syncing`)
    return plan
  }

  if (plan.inspecVersion === record.version) {
    plan.status = 'up-to-date'
    return plan
  }

  plan.status = 'drift'
  plan.messages.push(`${record.version ?? '(none)'} → ${plan.inspecVersion}`)
  plan.update = { version: plan.inspecVersion, releaseDate }
  plan.release = {
    slug: `${record.slug}-v${plan.inspecVersion.replace(/\./g, '-')}`,
    version: plan.inspecVersion,
    releaseDate,
  }
  return plan
}

/**
 * Apply sync plans (or just tally them in dry-run mode).
 *
 * Drift plans get their content update and release upsert; a failed
 * write counts as an error and processing continues with the rest.
 */
export async function executeSyncPlans(
  plans: ContentSyncPlan[],
  writes: SyncWriteDeps,
  options: { dryRun: boolean },
): Promise<SyncSummary> {
  const summary: SyncSummary = {
    total: plans.length,
    upToDate: 0,
    drift: 0,
    applied: 0,
    warnings: 0,
    errors: 0,
  }

  for (const plan of plans) {
    switch (plan.status) {
      case 'up-to-date':
        summary.upToDate++
        break
      case 'warning':
        summary.warnings++
        break
      case 'error':
        summary.errors++
        break
      case 'drift': {
        summary.drift++
        if (options.dryRun || !plan.update || !plan.release)
          break
        try {
          await writes.updateContent(plan.id, plan.update)
          await writes.upsertRelease(plan.id, plan.release)
          summary.applied++
        }
        catch (error) {
          summary.errors++
          plan.messages.push(`Write failed: ${error instanceof Error ? error.message : String(error)}`)
        }
        break
      }
    }
  }

  return summary
}
