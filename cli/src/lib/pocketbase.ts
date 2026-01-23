/**
 * Pocketbase Client Wrapper
 *
 * Provides authenticated access to the Pocketbase API
 */

import PocketBase from 'pocketbase'
import pc from 'picocolors'

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
  } catch (error) {
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
  } catch {
    return false
  }
}

/**
 * FK Resolution Maps
 *
 * These help resolve human-readable names to Pocketbase IDs
 */
export interface FkMaps {
  organizations: Map<string, string>  // name -> id
  teams: Map<string, string>
  standards: Map<string, string>
  technologies: Map<string, string>
  targets: Map<string, string>
  categories: Map<string, string>
  capabilities: Map<string, string>
  tags: Map<string, string>
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
    tags
  ] = await Promise.all([
    pb.collection('organizations').getFullList(),
    pb.collection('teams').getFullList(),
    pb.collection('standards').getFullList(),
    pb.collection('technologies').getFullList(),
    pb.collection('targets').getFullList(),
    pb.collection('categories').getFullList(),
    pb.collection('capabilities').getFullList(),
    pb.collection('tags').getFullList()
  ])

  return {
    organizations: new Map(organizations.map(r => [r.name.toLowerCase(), r.id])),
    teams: new Map(teams.map(r => [r.name.toLowerCase(), r.id])),
    standards: new Map(standards.map(r => [r.name.toLowerCase(), r.id])),
    technologies: new Map(technologies.map(r => [r.name.toLowerCase(), r.id])),
    targets: new Map(targets.map(r => [r.name.toLowerCase(), r.id])),
    categories: new Map(categories.map(r => [r.name.toLowerCase(), r.id])),
    capabilities: new Map(capabilities.map(r => [r.name.toLowerCase(), r.id])),
    tags: new Map(tags.map(r => [r.name.toLowerCase(), r.id]))
  }
}

/**
 * Resolve a name to an ID using the FK maps
 */
export function resolveFK(maps: FkMaps, collection: keyof FkMaps, name: string): string | null {
  const map = maps[collection]
  return map.get(name.toLowerCase()) || null
}
