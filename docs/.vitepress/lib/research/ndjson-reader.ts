/**
 * NDJSON Reader for Diffable Export
 *
 * Reads data from sqlite-diffable NDJSON exports when Pocketbase is not available.
 * Used for static builds (Cloudflare Pages, CI) where we can't run Pocketbase.
 */
import fs from 'node:fs'
import path from 'node:path'

const DIFFABLE_PATH = path.resolve(process.cwd(), '.pocketbase/pb_data/diffable')

/**
 * Metadata structure from sqlite-diffable
 */
interface CollectionMetadata {
  name: string
  columns: string[]
  schema: string
}

/**
 * Read and parse an NDJSON file with its metadata
 */
export function readNdjson<T extends Record<string, unknown>>(
  collectionName: string,
): T[] {
  const metadataPath = path.join(DIFFABLE_PATH, `${collectionName}.metadata.json`)
  const ndjsonPath = path.join(DIFFABLE_PATH, `${collectionName}.ndjson`)

  if (!fs.existsSync(metadataPath) || !fs.existsSync(ndjsonPath)) {
    console.warn(`NDJSON files not found for collection: ${collectionName}`)
    return []
  }

  const metadata: CollectionMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
  const ndjsonContent = fs.readFileSync(ndjsonPath, 'utf-8').trim()

  if (!ndjsonContent) {
    return []
  }

  const lines = ndjsonContent.split('\n')
  const records: T[] = []

  for (const line of lines) {
    if (!line.trim())
      continue

    try {
      const values: unknown[] = JSON.parse(line)
      const record = {} as Record<string, unknown>

      // Map array values to column names
      metadata.columns.forEach((col, index) => {
        record[col] = values[index]
      })

      records.push(record as T)
    }
    catch (error) {
      console.error(`Failed to parse NDJSON line in ${collectionName}:`, error)
    }
  }

  return records
}

/**
 * Build a lookup map by ID for quick FK resolution
 */
export function buildIdMap<T extends { id: string }>(records: T[]): Map<string, T> {
  return new Map(records.map(r => [r.id, r]))
}

/**
 * Check if diffable data is available
 */
export function isDiffableAvailable(): boolean {
  return fs.existsSync(path.join(DIFFABLE_PATH, 'content.ndjson'))
}

// Collection-specific types for FK data
export interface NdjsonOrganization {
  id: string
  name: string
  slug: string
  logo: string
  description: string
  org_type: string
  website: string
}

export interface NdjsonTechnology {
  id: string
  name: string
  slug: string
  logo: string
  description: string
  organization: string
  quick_start_template: string
  prerequisites_template: string
}

export interface NdjsonStandard {
  id: string
  name: string
  short_name: string
  slug: string
  logo: string
  description: string
  organization: string
}

export interface NdjsonTarget {
  id: string
  name: string
  slug: string
  logo: string
  description: string
  category: string
  vendor: string
}

export interface NdjsonTeam {
  id: string
  name: string
  slug: string
  logo: string
  description: string
  organization: string
}

export interface NdjsonContent {
  id: string
  name: string
  slug: string
  description: string
  long_description: string
  content_type: 'validation' | 'hardening'
  status: string
  version: string
  github: string
  documentation_url: string
  reference_url: string
  readme_url: string
  readme_markdown: string
  control_count: number
  stig_id: string
  benchmark_version: string
  is_featured: boolean
  // FK IDs
  target: string
  standard: string
  technology: string
  vendor: string
  maintainer: string
}

/**
 * Load all content with FK resolution from NDJSON files
 */
export function loadContentFromNdjson() {
  // Read all collections
  const content = readNdjson<NdjsonContent>('content')
  const organizations = readNdjson<NdjsonOrganization>('organizations')
  const technologies = readNdjson<NdjsonTechnology>('technologies')
  const standards = readNdjson<NdjsonStandard>('standards')
  const targets = readNdjson<NdjsonTarget>('targets')
  const teams = readNdjson<NdjsonTeam>('teams')

  // Build lookup maps
  const orgMap = buildIdMap(organizations)
  const techMap = buildIdMap(technologies)
  const standardMap = buildIdMap(standards)
  const targetMap = buildIdMap(targets)
  const teamMap = buildIdMap(teams)

  // Transform content with FK resolution
  return content.map((record) => {
    const target = targetMap.get(record.target)
    const standard = standardMap.get(record.standard)
    const technology = techMap.get(record.technology)
    const vendor = orgMap.get(record.vendor)
    const maintainer = teamMap.get(record.maintainer)

    // For maintainer logo, fall back to organization logo
    let maintainerLogo = maintainer?.logo
    if (!maintainerLogo && maintainer?.organization) {
      maintainerLogo = orgMap.get(maintainer.organization)?.logo
    }

    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      long_description: record.long_description,
      version: record.version,
      content_type: record.content_type,
      status: record.status,
      // Target
      target: target?.id,
      target_name: target?.name,
      target_slug: target?.slug,
      // Standard
      standard: standard?.id,
      standard_name: standard?.name,
      standard_short_name: standard?.short_name,
      standard_slug: standard?.slug,
      // Technology
      technology: technology?.id,
      technology_name: technology?.name,
      technology_slug: technology?.slug,
      technology_logo: technology?.logo,
      quick_start_template: technology?.quick_start_template,
      prerequisites_template: technology?.prerequisites_template,
      // Vendor
      vendor: vendor?.id,
      vendor_name: vendor?.name,
      vendor_slug: vendor?.slug,
      vendor_logo: vendor?.logo,
      // Maintainer
      maintainer: maintainer?.id,
      maintainer_name: maintainer?.name,
      maintainer_slug: maintainer?.slug,
      maintainer_logo: maintainerLogo,
      // Links
      github_url: record.github,
      documentation_url: record.documentation_url,
      reference_url: record.reference_url,
      readme_url: record.readme_url,
      readme_markdown: record.readme_markdown,
      // Domain-specific
      control_count: record.control_count,
      stig_id: record.stig_id,
      benchmark_version: record.benchmark_version,
      is_featured: record.is_featured,
    }
  })
}
