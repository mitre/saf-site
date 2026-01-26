#!/usr/bin/env tsx
/**
 * Migrate v1 data to v2 schema
 *
 * This script:
 * 1. Reads exported v1 JSON files
 * 2. Transforms data to v2 format
 * 3. Imports to v2 collections via Pocketbase API
 *
 * Run with: npx tsx scripts/migrate-v1-to-v2.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import PocketBase from 'pocketbase'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pb = new PocketBase('http://127.0.0.1:8090')
const EXPORT_DIR = path.join(__dirname, 'v1-export')

// Track ID mappings (v1 ID → v2 ID)
const idMaps: Record<string, Record<string, string>> = {
  organizations: {},
  tags: {},
  capabilities: {},
  teams: {},
  standards: {},
  technologies: {},
  tools: {},
  content: {}, // profiles + hardening_profiles → content
}

async function main() {
  await pb.collection('_superusers').authWithPassword('admin@localhost.com', 'testpassword123')
  console.log('✓ Authenticated\n')

  console.log('='.repeat(70))
  console.log('V1 → V2 DATA MIGRATION')
  console.log('='.repeat(70))

  // Phase 1: Lookup tables (no FK dependencies)
  await migrateCapabilities()
  await migrateOrganizations()
  await migrateTags()

  // Phase 2: Level 1 tables (depend on organizations)
  await migrateTeams()
  await migrateStandards()
  await migrateTechnologies()

  // Phase 3: Create categories and targets (new in v2)
  await createCategories()
  await createTargets()

  // Phase 4: Tools
  await migrateTools()

  // Phase 5: Content (profiles + hardening_profiles → unified content)
  await migrateProfiles()
  await migrateHardeningProfiles()

  // Phase 6: Junction tables
  await migrateContentTags()
  await migrateContentRelationships()

  console.log(`\n${'='.repeat(70)}`)
  console.log('MIGRATION COMPLETE')
  console.log('='.repeat(70))

  // Save ID mappings for reference
  fs.writeFileSync(
    path.join(EXPORT_DIR, 'id-mappings.json'),
    JSON.stringify(idMaps, null, 2),
  )
  console.log('\n✓ ID mappings saved to scripts/v1-export/id-mappings.json')
}

// ============================================================================
// LOOKUP TABLES
// ============================================================================

async function migrateCapabilities() {
  console.log('\n--- Migrating capabilities ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'capabilities.json'), 'utf-8'))

  for (const item of v1Data) {
    try {
      const v2Record = await pb.collection('v2_capabilities').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        icon: item.icon || '',
        color: item.color || '',
        sort_order: item.sort_order || 0,
      })
      idMaps.capabilities[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      if (error.status === 400 && error.response?.data?.slug) {
        // Duplicate slug - try to find existing
        const existing = await pb.collection('v2_capabilities').getFirstListItem(`slug="${slugify(item.name)}"`)
        idMaps.capabilities[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      }
      else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
      }
    }
  }
}

async function migrateOrganizations() {
  console.log('\n--- Migrating organizations ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'organizations.json'), 'utf-8'))

  for (const item of v1Data) {
    try {
      const v2Record = await pb.collection('v2_organizations').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        website: item.website || '',
        logo: item.logo || '',
        org_type: mapOrgType(item.org_type || item.type),
      })
      idMaps.organizations[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('v2_organizations').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.organizations[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      }
      else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
      }
    }
  }
}

async function migrateTags() {
  console.log('\n--- Migrating tags ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'tags.json'), 'utf-8'))

  for (const item of v1Data) {
    // v1 uses tag_id as the identifier, not name
    const tagName = item.name || item.tag_id || ''
    const tagSlug = item.slug || item.tag_id || slugify(tagName)

    if (!tagName) {
      console.error(`  ✗ Skipping tag with no name/tag_id: ${JSON.stringify(item)}`)
      continue
    }

    try {
      const v2Record = await pb.collection('v2_tags').create({
        name: tagName,
        slug: tagSlug,
        display_name: item.display_name || formatTagName(tagName),
        description: item.description || '',
        tag_category: mapTagCategory(item.category || item.tag_category),
        badge_color: item.badge_color || item.color || '',
      })
      idMaps.tags[item.id] = v2Record.id
      console.log(`  ✓ ${tagName}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        try {
          const existing = await pb.collection('v2_tags').getFirstListItem(`slug="${tagSlug}"`)
          idMaps.tags[item.id] = existing.id
          console.log(`  ℹ️ ${tagName} (already exists)`)
        }
        catch {
          console.error(`  ✗ ${tagName}: ${error.message}`)
        }
      }
      else {
        console.error(`  ✗ ${tagName}: ${error.message}`)
      }
    }
  }
}

function formatTagName(tagId: string): string {
  // Convert tag_id like "application-server" to "Application Server"
  return tagId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ============================================================================
// LEVEL 1 TABLES
// ============================================================================

async function migrateTeams() {
  console.log('\n--- Migrating teams ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'teams.json'), 'utf-8'))

  for (const item of v1Data) {
    try {
      const v2Record = await pb.collection('v2_teams').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        organization: item.organization ? idMaps.organizations[item.organization] : '',
        website: item.website || '',
      })
      idMaps.teams[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('v2_teams').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.teams[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      }
      else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
      }
    }
  }
}

async function migrateStandards() {
  console.log('\n--- Migrating standards ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'standards.json'), 'utf-8'))

  for (const item of v1Data) {
    try {
      const v2Record = await pb.collection('v2_standards').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        website: item.website || '',
        logo: item.logo || '',
        organization: item.organization ? idMaps.organizations[item.organization] : '',
        standard_type: mapStandardType(item.standard_type || item.type),
      })
      idMaps.standards[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('v2_standards').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.standards[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      }
      else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
      }
    }
  }
}

async function migrateTechnologies() {
  console.log('\n--- Migrating technologies ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'technologies.json'), 'utf-8'))

  for (const item of v1Data) {
    try {
      const v2Record = await pb.collection('v2_technologies').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        website: item.website || '',
        logo: item.logo || '',
        github: item.github || '',
        organization: item.organization ? idMaps.organizations[item.organization] : '',
        documentation_url: item.documentation_url || '',
      })
      idMaps.technologies[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('v2_technologies').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.technologies[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      }
      else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
      }
    }
  }
}

// ============================================================================
// NEW V2 TABLES (categories, targets)
// ============================================================================

const CATEGORIES = [
  { name: 'Operating System', slug: 'os', description: 'Desktop and server operating systems', icon: 'i-heroicons-computer-desktop' },
  { name: 'Database', slug: 'database', description: 'Relational and NoSQL databases', icon: 'i-heroicons-circle-stack' },
  { name: 'Container', slug: 'container', description: 'Container platforms and orchestration', icon: 'i-heroicons-cube' },
  { name: 'Cloud', slug: 'cloud', description: 'Cloud platforms and services', icon: 'i-heroicons-cloud' },
  { name: 'Network', slug: 'network', description: 'Network devices and infrastructure', icon: 'i-heroicons-globe-alt' },
  { name: 'Application', slug: 'application', description: 'Application servers and middleware', icon: 'i-heroicons-window' },
  { name: 'Web Server', slug: 'web-server', description: 'Web servers and reverse proxies', icon: 'i-heroicons-server' },
]

const categoryIds: Record<string, string> = {}

async function createCategories() {
  console.log('\n--- Creating categories (new in v2) ---')

  for (const cat of CATEGORIES) {
    try {
      const record = await pb.collection('v2_categories').create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        sort_order: CATEGORIES.indexOf(cat),
      })
      categoryIds[cat.slug] = record.id
      console.log(`  ✓ ${cat.name}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('v2_categories').getFirstListItem(`slug="${cat.slug}"`)
        categoryIds[cat.slug] = existing.id
        console.log(`  ℹ️ ${cat.name} (already exists)`)
      }
      else {
        console.error(`  ✗ ${cat.name}: ${error.message}`)
      }
    }
  }
}

// Map profile names to target info
function inferTargetFromProfile(profileName: string): { name: string, slug: string, category: string, vendor?: string } | null {
  const name = profileName.toLowerCase()

  // Operating Systems
  if (name.includes('rhel') || name.includes('red hat')) {
    const version = name.match(/(\d+)/)?.[1] || ''
    return { name: `Red Hat Enterprise Linux ${version}`, slug: `rhel-${version}`, category: 'os', vendor: 'red-hat' }
  }
  if (name.includes('ubuntu')) {
    const version = name.match(/(\d+\.\d+)/)?.[1] || ''
    return { name: `Ubuntu ${version}`, slug: `ubuntu-${version.replace('.', '')}`, category: 'os', vendor: 'canonical' }
  }
  if (name.includes('windows')) {
    if (name.includes('server')) {
      const version = name.match(/(\d+)/)?.[1] || ''
      return { name: `Windows Server ${version}`, slug: `windows-server-${version}`, category: 'os', vendor: 'microsoft' }
    }
    const version = name.match(/(\d+)/)?.[1] || ''
    return { name: `Windows ${version}`, slug: `windows-${version}`, category: 'os', vendor: 'microsoft' }
  }
  if (name.includes('oracle linux')) {
    const version = name.match(/(\d+)/)?.[1] || ''
    return { name: `Oracle Linux ${version}`, slug: `oracle-linux-${version}`, category: 'os', vendor: 'oracle' }
  }
  if (name.includes('suse') || name.includes('sles')) {
    const version = name.match(/(\d+)/)?.[1] || ''
    return { name: `SUSE Linux Enterprise ${version}`, slug: `sles-${version}`, category: 'os', vendor: 'suse' }
  }
  if (name.includes('amazon linux')) {
    const version = name.match(/(\d+)/)?.[1] || '2'
    return { name: `Amazon Linux ${version}`, slug: `amazon-linux-${version}`, category: 'os', vendor: 'amazon' }
  }
  if (name.includes('macos') || name.includes('mac os')) {
    return { name: 'macOS', slug: 'macos', category: 'os', vendor: 'apple' }
  }

  // Databases
  if (name.includes('mysql')) {
    const version = name.match(/(\d+\.\d+)/)?.[1] || name.match(/(\d+)/)?.[1] || ''
    return { name: `MySQL ${version}`, slug: `mysql-${version.replace('.', '')}`, category: 'database', vendor: 'oracle' }
  }
  if (name.includes('postgresql') || name.includes('postgres')) {
    const version = name.match(/(\d+)/)?.[1] || ''
    return { name: `PostgreSQL ${version}`, slug: `postgresql-${version}`, category: 'database' }
  }
  if (name.includes('mongodb')) {
    const version = name.match(/(\d+\.\d+)/)?.[1] || ''
    return { name: `MongoDB ${version}`, slug: `mongodb-${version.replace('.', '')}`, category: 'database', vendor: 'mongodb' }
  }
  if (name.includes('oracle') && name.includes('database')) {
    const version = name.match(/(\d+)/)?.[1] || ''
    return { name: `Oracle Database ${version}`, slug: `oracle-db-${version}`, category: 'database', vendor: 'oracle' }
  }
  if (name.includes('sql server') || name.includes('mssql')) {
    const version = name.match(/(\d+)/)?.[1] || ''
    return { name: `Microsoft SQL Server ${version}`, slug: `mssql-${version}`, category: 'database', vendor: 'microsoft' }
  }

  // Containers
  if (name.includes('docker')) {
    return { name: 'Docker', slug: 'docker', category: 'container', vendor: 'docker' }
  }
  if (name.includes('kubernetes') || name.includes('k8s')) {
    return { name: 'Kubernetes', slug: 'kubernetes', category: 'container' }
  }

  // Cloud
  if (name.includes('aws') || name.includes('amazon web')) {
    return { name: 'Amazon Web Services', slug: 'aws', category: 'cloud', vendor: 'amazon' }
  }
  if (name.includes('azure')) {
    return { name: 'Microsoft Azure', slug: 'azure', category: 'cloud', vendor: 'microsoft' }
  }
  if (name.includes('gcp') || name.includes('google cloud')) {
    return { name: 'Google Cloud Platform', slug: 'gcp', category: 'cloud', vendor: 'google' }
  }

  // Web Servers
  if (name.includes('nginx')) {
    return { name: 'NGINX', slug: 'nginx', category: 'web-server' }
  }
  if (name.includes('apache') && !name.includes('tomcat')) {
    return { name: 'Apache HTTP Server', slug: 'apache-httpd', category: 'web-server' }
  }
  if (name.includes('tomcat')) {
    return { name: 'Apache Tomcat', slug: 'tomcat', category: 'application' }
  }
  if (name.includes('iis')) {
    return { name: 'Microsoft IIS', slug: 'iis', category: 'web-server', vendor: 'microsoft' }
  }

  // Network
  if (name.includes('cisco')) {
    return { name: 'Cisco IOS', slug: 'cisco-ios', category: 'network', vendor: 'cisco' }
  }
  if (name.includes('palo alto')) {
    return { name: 'Palo Alto Networks', slug: 'palo-alto', category: 'network', vendor: 'palo-alto' }
  }
  if (name.includes('juniper')) {
    return { name: 'Juniper', slug: 'juniper', category: 'network', vendor: 'juniper' }
  }

  return null
}

const targetIds: Record<string, string> = {}
const createdTargets = new Set<string>()

async function createTargets() {
  console.log('\n--- Creating targets from profiles (new in v2) ---')

  // Read profiles to infer targets
  const profiles = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'profiles.json'), 'utf-8'))
  const hardening = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'hardening_profiles.json'), 'utf-8'))

  const allProfiles = [...profiles, ...hardening]

  for (const profile of allProfiles) {
    const targetInfo = inferTargetFromProfile(profile.name)
    if (targetInfo && !createdTargets.has(targetInfo.slug)) {
      createdTargets.add(targetInfo.slug)

      try {
        // Find vendor org ID if specified
        let vendorId = ''
        if (targetInfo.vendor) {
          const vendorOrg = await pb.collection('v2_organizations').getFirstListItem(`slug="${targetInfo.vendor}"`).catch(() => null)
          if (vendorOrg)
            vendorId = vendorOrg.id
        }

        const record = await pb.collection('v2_targets').create({
          name: targetInfo.name,
          slug: targetInfo.slug,
          description: '',
          category: categoryIds[targetInfo.category] || '',
          vendor: vendorId,
          website: '',
          logo: '',
        })
        targetIds[targetInfo.slug] = record.id
        console.log(`  ✓ ${targetInfo.name}`)
      }
      catch (error: any) {
        if (error.status === 400) {
          const existing = await pb.collection('v2_targets').getFirstListItem(`slug="${targetInfo.slug}"`)
          targetIds[targetInfo.slug] = existing.id
          console.log(`  ℹ️ ${targetInfo.name} (already exists)`)
        }
        else {
          console.error(`  ✗ ${targetInfo.name}: ${error.message}`)
        }
      }
    }
  }
}

// ============================================================================
// TOOLS
// ============================================================================

async function migrateTools() {
  console.log('\n--- Migrating tools ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'tools.json'), 'utf-8'))

  for (const item of v1Data) {
    const toolSlug = item.slug || item.tool_id || slugify(item.name)

    // Build the record, removing empty strings for optional FK fields
    const record: Record<string, any> = {
      name: item.name,
      slug: toolSlug,
      description: item.description || '',
      long_description: item.long_description || '',
      version: normalizeVersion(item.version),
      status: mapStatus(item.status),
      website: normalizeUrl(item.website),
      github: normalizeUrl(item.github),
      documentation_url: normalizeUrl(item.documentation_url),
      logo: item.logo || '',
      screenshot: item.screenshot || '',
      screenshots: item.screenshots || [],
      is_featured: item.is_featured || false,
      featured_order: item.featured_order || 0,
      license: item.license || '',
    }

    // Only add FK fields if they have valid mapped IDs
    if (item.organization && idMaps.organizations[item.organization]) {
      record.organization = idMaps.organizations[item.organization]
    }
    if (item.technology && idMaps.technologies[item.technology]) {
      record.technology = idMaps.technologies[item.technology]
    }

    try {
      const v2Record = await pb.collection('v2_tools').create(record)
      idMaps.tools[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      console.error(`  ✗ ${item.name}: ${error.message}`)
      if (error.response) {
        console.error(`      Response: ${JSON.stringify(error.response)}`)
      }
      if (error.status === 400) {
        try {
          const existing = await pb.collection('v2_tools').getFirstListItem(`slug="${toolSlug}"`)
          idMaps.tools[item.id] = existing.id
          console.log(`      → Found existing with slug`)
        }
        catch {
          // ignore
        }
      }
    }
  }
}

// ============================================================================
// CONTENT (profiles + hardening_profiles → unified content)
// ============================================================================

async function migrateProfiles() {
  console.log('\n--- Migrating profiles → v2_content (validation) ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'profiles.json'), 'utf-8'))

  for (const item of v1Data) {
    const profileSlug = item.slug || item.profile_id || slugify(item.name)

    try {
      // Infer target from profile name
      const targetInfo = inferTargetFromProfile(item.name)
      const targetId = targetInfo ? targetIds[targetInfo.slug] : ''

      // Build record with optional FK fields
      const contentRecord: Record<string, any> = {
        name: item.name,
        slug: profileSlug,
        description: item.short_description || item.description || '',
        long_description: item.long_description || item.requirements || '',
        version: normalizeVersion(item.version),
        content_type: 'validation',
        status: mapStatus(item.status),
        github: normalizeUrl(item.github),
        documentation_url: '', // Only set if explicit override needed; default shows README
        control_count: item.control_count || 0,
        stig_id: item.stig_id || '',
        benchmark_version: item.standard_version || item.benchmark_version || '',
        is_featured: item.is_featured || false,
        featured_order: item.featured_order || 0,
        license: item.license || '',
      }

      // Only add FK fields if they have valid mapped IDs
      if (targetId)
        contentRecord.target = targetId
      if (item.standard && idMaps.standards[item.standard]) {
        contentRecord.standard = idMaps.standards[item.standard]
      }
      if (item.technology && idMaps.technologies[item.technology]) {
        contentRecord.technology = idMaps.technologies[item.technology]
      }
      if (item.organization && idMaps.organizations[item.organization]) {
        contentRecord.vendor = idMaps.organizations[item.organization]
      }
      if (item.team && idMaps.teams[item.team]) {
        contentRecord.maintainer = idMaps.teams[item.team]
      }

      const v2Record = await pb.collection('v2_content').create(contentRecord)
      idMaps.content[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        try {
          const existing = await pb.collection('v2_content').getFirstListItem(`slug="${profileSlug}"`)
          idMaps.content[item.id] = existing.id
          console.log(`  ℹ️ ${item.name} (already exists)`)
        }
        catch {
          console.error(`  ✗ ${item.name}: ${error.message}`)
        }
      }
      else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
        if (error.response?.data) {
          console.error(`      Details: ${JSON.stringify(error.response.data)}`)
        }
      }
    }
  }
}

async function migrateHardeningProfiles() {
  console.log('\n--- Migrating hardening_profiles → v2_content (hardening) ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'hardening_profiles.json'), 'utf-8'))

  for (const item of v1Data) {
    const hardeningSlug = item.slug || item.hardening_id || slugify(item.name)

    try {
      // Infer target from profile name
      const targetInfo = inferTargetFromProfile(item.name)
      const targetId = targetInfo ? targetIds[targetInfo.slug] : ''

      // Map difficulty to automation_level
      const automationLevel = item.difficulty === 'easy'
        ? 'full'
        : item.difficulty === 'medium'
          ? 'partial'
          : item.difficulty === 'hard'
            ? 'manual'
            : mapAutomationLevel(item.automation_level)

      // Build record with optional FK fields
      const hardeningRecord: Record<string, any> = {
        name: item.name,
        slug: hardeningSlug,
        description: item.short_description || item.description || '',
        long_description: item.long_description || item.requirements || '',
        version: normalizeVersion(item.version),
        content_type: 'hardening',
        status: mapStatus(item.status),
        github: normalizeUrl(item.github),
        documentation_url: '', // Only set if explicit override needed; default shows README
        automation_level: automationLevel,
        is_featured: item.is_featured || false,
        featured_order: item.featured_order || 0,
        license: item.license || '',
      }

      // Only add FK fields if they have valid mapped IDs
      if (targetId)
        hardeningRecord.target = targetId
      if (item.standard && idMaps.standards[item.standard]) {
        hardeningRecord.standard = idMaps.standards[item.standard]
      }
      if (item.technology && idMaps.technologies[item.technology]) {
        hardeningRecord.technology = idMaps.technologies[item.technology]
      }
      if (item.organization && idMaps.organizations[item.organization]) {
        hardeningRecord.vendor = idMaps.organizations[item.organization]
      }
      if (item.team && idMaps.teams[item.team]) {
        hardeningRecord.maintainer = idMaps.teams[item.team]
      }

      const v2Record = await pb.collection('v2_content').create(hardeningRecord)
      // Use special prefix to distinguish hardening profile IDs
      idMaps.content[`h_${item.id}`] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    }
    catch (error: any) {
      if (error.status === 400) {
        try {
          const existing = await pb.collection('v2_content').getFirstListItem(`slug="${hardeningSlug}"`)
          idMaps.content[`h_${item.id}`] = existing.id
          console.log(`  ℹ️ ${item.name} (already exists)`)
        }
        catch {
          console.error(`  ✗ ${item.name}: ${error.message}`)
        }
      }
      else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
        if (error.response?.data) {
          console.error(`      Details: ${JSON.stringify(error.response.data)}`)
        }
      }
    }
  }
}

// ============================================================================
// JUNCTION TABLES
// ============================================================================

async function migrateContentTags() {
  console.log('\n--- Migrating content ↔ tags ---')

  // profiles_tags - v1 uses profile_id and tag_id
  const profilesTags = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'profiles_tags.json'), 'utf-8'))
  let count = 0
  let skipped = 0
  for (const link of profilesTags) {
    const contentId = idMaps.content[link.profile_id]
    const tagId = idMaps.tags[link.tag_id]
    if (contentId && tagId) {
      try {
        await pb.collection('v2_content_tags').create({
          content: contentId,
          tag: tagId,
        })
        count++
      }
      catch {
        // Ignore duplicates
      }
    }
    else {
      skipped++
    }
  }
  console.log(`  ✓ ${count} profile-tag links (${skipped} skipped - missing mapping)`)

  // hardening_profiles_tags - v1 uses hardening_profile_id and tag_id
  const hardeningTags = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'hardening_profiles_tags.json'), 'utf-8'))
  count = 0
  skipped = 0
  for (const link of hardeningTags) {
    const contentId = idMaps.content[`h_${link.hardening_profile_id}`]
    const tagId = idMaps.tags[link.tag_id]
    if (contentId && tagId) {
      try {
        await pb.collection('v2_content_tags').create({
          content: contentId,
          tag: tagId,
        })
        count++
      }
      catch {
        // Ignore duplicates
      }
    }
    else {
      skipped++
    }
  }
  console.log(`  ✓ ${count} hardening-tag links (${skipped} skipped - missing mapping)`)
}

async function migrateContentRelationships() {
  console.log('\n--- Migrating validation ↔ hardening relationships ---')

  const v2hLinks = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'validation_to_hardening.json'), 'utf-8'))
  let count = 0
  let skipped = 0
  for (const link of v2hLinks) {
    // v1 uses validation_profile_id and hardening_profile_id
    const validationId = idMaps.content[link.validation_profile_id]
    const hardeningId = idMaps.content[`h_${link.hardening_profile_id}`]
    if (validationId && hardeningId) {
      try {
        await pb.collection('v2_content_relationships').create({
          content: validationId,
          related_content: hardeningId,
          relationship_type: 'hardens',
        })
        count++
      }
      catch {
        // Ignore duplicates
      }
    }
    else {
      skipped++
    }
  }
  console.log(`  ✓ ${count} validation↔hardening relationships (${skipped} skipped)`)
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function mapOrgType(type: string | undefined): string {
  const map: Record<string, string> = {
    vendor: 'vendor',
    government: 'government',
    community: 'community',
    standards: 'standards_body',
    standards_body: 'standards_body',
  }
  return map[type || ''] || ''
}

function mapTagCategory(category: string | undefined): string {
  const map: Record<string, string> = {
    platform: 'platform',
    compliance: 'compliance',
    feature: 'feature',
    technology: 'technology',
    other: 'other',
  }
  return map[category || ''] || 'other'
}

function mapStandardType(type: string | undefined): string {
  const map: Record<string, string> = {
    regulatory: 'regulatory',
    industry: 'industry',
    government: 'government',
    vendor: 'vendor',
  }
  return map[type || ''] || ''
}

function mapStatus(status: string | undefined): string {
  const map: Record<string, string> = {
    active: 'active',
    beta: 'beta',
    deprecated: 'deprecated',
    draft: 'draft',
  }
  return map[status || ''] || 'active'
}

function mapAutomationLevel(level: string | undefined): string {
  const map: Record<string, string> = {
    full: 'full',
    partial: 'partial',
    manual: 'manual',
  }
  return map[level || ''] || ''
}

function normalizeUrl(url: string | undefined): string {
  if (!url)
    return ''

  // Convert relative URLs to absolute (using saf.mitre.org as base)
  if (url.startsWith('/')) {
    return `https://saf.mitre.org${url}`
  }

  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Invalid URL format - return empty
  return ''
}

function normalizeVersion(version: string | undefined): string {
  if (!version)
    return ''

  // Strip leading 'v' or 'V' prefix - versions should be just "1.0.0" not "v1.0.0"
  // The display layer (Vue components) adds the "v" prefix for presentation
  return version.replace(/^v/i, '')
}

main().catch(console.error)
