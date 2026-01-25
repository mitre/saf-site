/**
 * Pocketbase Client Wrapper
 *
 * Provides authenticated access to the Pocketbase API
 */

import type { RecordModel } from 'pocketbase'
import pc from 'picocolors'
import PocketBase from 'pocketbase'
import { z } from 'zod'
import {
  contentTypeSchema,
  controlCountSchema,
  descriptionSchema,
  githubUrlSchema,
  nameSchema,
  optionalNameSchema,
  optionalSemverSchema,
  optionalSlugSchema,
  slugSchema,
  statusSchema,
} from '@schema/schema.zod.js'

// Default credentials for local development
const DEFAULT_URL = 'http://localhost:8090'
const DEFAULT_EMAIL = 'admin@localhost.com'
const DEFAULT_PASSWORD = 'testpassword123'

let pbInstance: PocketBase | null = null

/**
 * Get authenticated Pocketbase client
 */
export async function getPocketBase(): Promise<PocketBase> {
  if (pbInstance && pbInstance.authStore.isValid) {
    return pbInstance
  }

  const url = process.env.PB_URL || DEFAULT_URL
  const email = process.env.PB_EMAIL || DEFAULT_EMAIL
  const password = process.env.PB_PASSWORD || DEFAULT_PASSWORD

  pbInstance = new PocketBase(url)

  try {
    await pbInstance.collection('_superusers').authWithPassword(email, password)
  }
  catch (error) {
    console.error(pc.red('Failed to authenticate with Pocketbase'))
    console.error(pc.dim('Make sure Pocketbase is running: cd .pocketbase && ./pocketbase serve'))
    throw error
  }

  return pbInstance
}

/**
 * Check if Pocketbase is available
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const pb = await getPocketBase()
    await pb.health.check()
    return true
  }
  catch {
    return false
  }
}

/**
 * FK Resolution Maps
 *
 * These help resolve human-readable names to Pocketbase IDs
 */
export interface FkMaps {
  organizations: Map<string, string> // name -> id
  teams: Map<string, string>
  standards: Map<string, string>
  technologies: Map<string, string>
  targets: Map<string, string>
  categories: Map<string, string>
  capabilities: Map<string, string>
  tags: Map<string, string>
}

/**
 * Create a lowercase name → ID map from records
 * Accepts Pocketbase RecordModel which has dynamic fields
 */
function createLowerCaseIdMap(records: Array<{ name?: string, id: string }>): Map<string, string> {
  return new Map(
    records
      .filter((r): r is { name: string, id: string } => typeof r.name === 'string')
      .map(r => [r.name.toLowerCase(), r.id]),
  )
}

/**
 * Load all FK lookup maps from database
 */
export async function loadFkMaps(): Promise<FkMaps> {
  const pb = await getPocketBase()

  const [
    organizations,
    teams,
    standards,
    technologies,
    targets,
    categories,
    capabilities,
    tags,
  ] = await Promise.all([
    pb.collection('organizations').getFullList(),
    pb.collection('teams').getFullList(),
    pb.collection('standards').getFullList(),
    pb.collection('technologies').getFullList(),
    pb.collection('targets').getFullList(),
    pb.collection('categories').getFullList(),
    pb.collection('capabilities').getFullList(),
    pb.collection('tags').getFullList(),
  ])

  return {
    organizations: createLowerCaseIdMap(organizations),
    teams: createLowerCaseIdMap(teams),
    standards: createLowerCaseIdMap(standards),
    technologies: createLowerCaseIdMap(technologies),
    targets: createLowerCaseIdMap(targets),
    categories: createLowerCaseIdMap(categories),
    capabilities: createLowerCaseIdMap(capabilities),
    tags: createLowerCaseIdMap(tags),
  }
}

/**
 * Resolve a name to an ID using the FK maps
 */
export function resolveFK(maps: FkMaps, collection: keyof FkMaps, name: string): string | null {
  const map = maps[collection]
  return map.get(name.toLowerCase()) || null
}

// ============================================================================
// CRUD OPERATIONS (Phase 2.2)
// ============================================================================

/**
 * Input type for creating content (camelCase from CLI)
 */
export interface CreateContentInput {
  name: string
  slug: string
  contentType: 'validation' | 'hardening'
  description?: string
  longDescription?: string
  version?: string
  status?: 'active' | 'beta' | 'deprecated' | 'draft'
  github?: string
  documentationUrl?: string
  referenceUrl?: string
  readmeUrl?: string
  readmeMarkdown?: string
  controlCount?: number
  stigId?: string
  benchmarkVersion?: string
  automationLevel?: 'full' | 'partial' | 'manual'
  isFeatured?: boolean
  featuredOrder?: number
  license?: string
  // FK references (as IDs)
  target?: string
  standard?: string
  technology?: string
  vendor?: string
  maintainer?: string
}

/**
 * Input type for updating content (all fields optional)
 */
export interface UpdateContentInput {
  name?: string
  slug?: string
  contentType?: 'validation' | 'hardening'
  description?: string
  longDescription?: string
  version?: string
  status?: 'active' | 'beta' | 'deprecated' | 'draft'
  github?: string
  documentationUrl?: string
  referenceUrl?: string
  readmeUrl?: string
  readmeMarkdown?: string
  controlCount?: number
  stigId?: string
  benchmarkVersion?: string
  automationLevel?: 'full' | 'partial' | 'manual'
  isFeatured?: boolean
  featuredOrder?: number
  license?: string
  target?: string
  standard?: string
  technology?: string
  vendor?: string
  maintainer?: string
}

/**
 * Options for listing content
 */
export interface ListContentOptions {
  contentType?: 'validation' | 'hardening'
  status?: 'active' | 'beta' | 'deprecated' | 'draft'
  expand?: string[]
  sort?: string
}

/**
 * Options for getting content by slug
 */
export interface GetContentOptions {
  expand?: string[]
}

/**
 * Convert camelCase input to snake_case for Pocketbase
 */
function toSnakeCase(input: CreateContentInput | UpdateContentInput): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  const fieldMap: Record<string, string> = {
    contentType: 'content_type',
    longDescription: 'long_description',
    documentationUrl: 'documentation_url',
    referenceUrl: 'reference_url',
    readmeUrl: 'readme_url',
    readmeMarkdown: 'readme_markdown',
    controlCount: 'control_count',
    stigId: 'stig_id',
    benchmarkVersion: 'benchmark_version',
    automationLevel: 'automation_level',
    isFeatured: 'is_featured',
    featuredOrder: 'featured_order',
  }

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      const snakeKey = fieldMap[key] || key
      result[snakeKey] = value
    }
  }

  return result
}

/**
 * Validation schema for create input
 */
const createContentValidation = z.object({
  name: nameSchema,
  slug: slugSchema,
  contentType: contentTypeSchema,
  description: descriptionSchema,
  version: optionalSemverSchema,
  status: statusSchema.optional(),
  github: githubUrlSchema,
  controlCount: controlCountSchema,
}).passthrough().meta({
  id: 'create_content_input',
  title: 'Create Content Input',
  description: 'Validation schema for creating new content via CLI',
})

/**
 * Validation schema for update input
 */
const updateContentValidation = z.object({
  name: optionalNameSchema,
  slug: optionalSlugSchema,
  contentType: contentTypeSchema.optional(),
  version: optionalSemverSchema,
  status: statusSchema.optional(),
}).passthrough().meta({
  id: 'update_content_input',
  title: 'Update Content Input',
  description: 'Validation schema for updating content via CLI',
})

/**
 * Get content by slug
 */
export async function getContentBySlug(
  slug: string,
  pb: PocketBase,
  options: GetContentOptions = {},
): Promise<RecordModel | null> {
  try {
    const queryOptions: Record<string, string> = {}

    if (options.expand?.length) {
      queryOptions.expand = options.expand.join(',')
    }

    return await pb.collection('content').getFirstListItem(
      `slug = "${slug}"`,
      queryOptions,
    )
  }
  catch {
    return null
  }
}

/**
 * List content with optional filters
 */
export async function listContent(
  options: ListContentOptions,
  pb: PocketBase,
): Promise<RecordModel[]> {
  const filters: string[] = []

  if (options.contentType) {
    filters.push(`content_type = "${options.contentType}"`)
  }

  if (options.status) {
    filters.push(`status = "${options.status}"`)
  }

  const queryOptions: Record<string, string> = {
    sort: options.sort || 'name',
  }

  if (filters.length > 0) {
    queryOptions.filter = filters.join(' && ')
  }

  if (options.expand?.length) {
    queryOptions.expand = options.expand.join(',')
  }

  return pb.collection('content').getFullList(queryOptions)
}

/**
 * Create new content record
 */
export async function createContent(
  input: CreateContentInput,
  pb: PocketBase,
): Promise<RecordModel> {
  // Validate input
  const validationResult = createContentValidation.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  // Convert to snake_case for Pocketbase
  const data = toSnakeCase(input)

  return pb.collection('content').create(data)
}

/**
 * Update existing content record
 */
export async function updateContent(
  id: string,
  input: UpdateContentInput,
  pb: PocketBase,
): Promise<RecordModel> {
  // Validate input
  const validationResult = updateContentValidation.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`)
  }

  // Convert to snake_case for Pocketbase
  const data = toSnakeCase(input)

  return pb.collection('content').update(id, data)
}
