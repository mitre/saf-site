#!/usr/bin/env tsx
/**
 * Import missing libraries from scraped old site data
 *
 * This script:
 * 1. Reads scraped-libraries-formatted.json
 * 2. Imports missing validation and hardening libraries to Pocketbase
 * 3. Infers FK relationships (vendor, technology, standard, target) from name/GitHub
 *
 * Run with: npx tsx scripts/import-scraped-libraries.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import PocketBase from 'pocketbase'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pb = new PocketBase('http://127.0.0.1:8090')

interface ScrapedLibrary {
  id: string
  name: string
  name_long: string
  github: string
  content_type: 'validation' | 'hardening'
}

interface LookupCache {
  organizations: Map<string, string> // name → id
  technologies: Map<string, string>
  standards: Map<string, string>
  targets: Map<string, string>
  teams: Map<string, string>
}

const cache: LookupCache = {
  organizations: new Map(),
  technologies: new Map(),
  standards: new Map(),
  targets: new Map(),
  teams: new Map(),
}

async function main() {
  await pb.collection('_superusers').authWithPassword('admin@localhost.com', 'testpassword123')
  console.log('✓ Authenticated\n')

  // Load lookup tables
  await loadLookupTables()

  // Load scraped data
  const scrapedPath = path.join(__dirname, 'scraped-libraries-formatted.json')
  const scraped = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'))

  const missingValidation = scraped.missing_from_db.validation as ScrapedLibrary[]
  const missingHardening = scraped.missing_from_db.hardening as ScrapedLibrary[]

  console.log('='.repeat(70))
  console.log('IMPORTING MISSING LIBRARIES')
  console.log('='.repeat(70))
  console.log(`\nValidation: ${missingValidation.length} to import`)
  console.log(`Hardening:  ${missingHardening.length} to import\n`)

  let importedCount = 0
  let skippedCount = 0
  let errorCount = 0
  let draftCount = 0

  // Import validation libraries
  console.log('\n--- Importing Validation Libraries ---')
  for (const item of missingValidation) {
    const result = await importLibrary(item)
    if (result === 'imported')
      importedCount++
    else if (result === 'draft')
      draftCount++
    else if (result === 'skipped')
      skippedCount++
    else
      errorCount++
  }

  // Import hardening libraries
  console.log('\n--- Importing Hardening Libraries ---')
  for (const item of missingHardening) {
    const result = await importLibrary(item)
    if (result === 'imported')
      importedCount++
    else if (result === 'draft')
      draftCount++
    else if (result === 'skipped')
      skippedCount++
    else
      errorCount++
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log('IMPORT COMPLETE')
  console.log('='.repeat(70))
  console.log(`\n✓ Imported: ${importedCount}`)
  console.log(`📝 Draft:    ${draftCount}`)
  console.log(`ℹ️ Skipped:  ${skippedCount}`)
  console.log(`✗ Errors:   ${errorCount}`)
  console.log(`\nTotal processed: ${importedCount + draftCount + skippedCount + errorCount}`)

  if (draftCount > 0) {
    console.log(`\n⚠️  ${draftCount} items marked as draft (contains DRAFT:, [WIP], or WIP in name)`)
  }
}

async function loadLookupTables() {
  console.log('Loading lookup tables...')

  const orgs = await pb.collection('organizations').getFullList()
  orgs.forEach(o => cache.organizations.set(o.name.toLowerCase(), o.id))

  const techs = await pb.collection('technologies').getFullList()
  techs.forEach(t => cache.technologies.set(t.name.toLowerCase(), t.id))

  const standards = await pb.collection('standards').getFullList()
  standards.forEach(s => cache.standards.set(s.name.toLowerCase(), s.id))

  const targets = await pb.collection('targets').getFullList()
  targets.forEach(t => cache.targets.set(t.name.toLowerCase(), t.id))

  const teams = await pb.collection('teams').getFullList()
  teams.forEach(t => cache.teams.set(t.name.toLowerCase(), t.id))

  console.log(`  ✓ ${cache.organizations.size} organizations`)
  console.log(`  ✓ ${cache.technologies.size} technologies`)
  console.log(`  ✓ ${cache.standards.size} standards`)
  console.log(`  ✓ ${cache.targets.size} targets`)
  console.log(`  ✓ ${cache.teams.size} teams`)
}

async function importLibrary(item: ScrapedLibrary): Promise<'imported' | 'skipped' | 'error' | 'draft'> {
  try {
    // Generate slug from name
    const slug = slugify(item.name)

    // Check if already exists
    try {
      await pb.collection('content').getFirstListItem(`slug="${slug}"`)
      console.log(`  ℹ️ ${item.name} (already exists)`)
      return 'skipped'
    }
    catch (err: any) {
      if (err.status !== 404)
        throw err
    }

    // Detect draft status from name markers
    const draftMarkers = ['draft:', '[wip]', 'wip']
    const isDraft = draftMarkers.some(marker => item.name.toLowerCase().includes(marker))

    // Infer relationships from name and GitHub
    const relationships = inferRelationships(item)

    // Create content record
    await pb.collection('content').create({
      name: item.name,
      slug,
      github: item.github || '',
      content_type: item.content_type,
      description: item.name_long || item.name,
      status: isDraft ? 'draft' : 'active',
      vendor: relationships.vendor || '',
      technology: relationships.technology || '',
      standard: relationships.standard || '',
      target: relationships.target || '',
      maintainer: relationships.maintainer || '',
      is_featured: false,
    })

    const statusIcon = isDraft ? '📝' : '✓'
    const statusLabel = isDraft ? '(draft)' : ''
    console.log(`  ${statusIcon} ${item.name} ${statusLabel}`)
    return isDraft ? 'draft' : 'imported'
  }
  catch (error: any) {
    const details = error.response?.data ? JSON.stringify(error.response.data) : error.message
    console.error(`  ✗ ${item.name}: ${details}`)
    return 'error'
  }
}

function inferRelationships(item: ScrapedLibrary) {
  const name = item.name.toLowerCase()
  const github = (item.github || '').toLowerCase()

  // Infer technology from GitHub URL
  let technology = ''
  if (github.includes('ansible') || name.includes('ansible'))
    technology = cache.technologies.get('ansible') || ''
  else if (github.includes('chef') || name.includes('chef'))
    technology = cache.technologies.get('chef') || ''
  else if (github.includes('terraform') || name.includes('terraform'))
    technology = cache.technologies.get('terraform') || ''
  else if (github.includes('powercli') || name.includes('powercli'))
    technology = cache.technologies.get('powercli') || ''
  else if (github.includes('keycloak') || name.includes('keycloak'))
    technology = cache.technologies.get('keycloak') || ''
  else if (item.content_type === 'validation')
    technology = cache.technologies.get('inspec') || '' // Default for validation

  // Infer vendor/maintainer
  let vendor = ''
  let maintainer = ''
  if (github.includes('github.com/mitre/')) {
    vendor = cache.organizations.get('mitre') || ''
    maintainer = cache.teams.get('mitre saf team') || ''
  }
  else if (github.includes('github.com/vmware/')) {
    vendor = cache.organizations.get('vmware') || ''
  }
  else if (github.includes('github.com/ansible-lockdown/')) {
    vendor = cache.organizations.get('ansible lockdown') || ''
  }
  else if (github.includes('public.cyber.mil')) {
    vendor = cache.organizations.get('disa') || ''
  }

  // Infer standard from name
  let standard = ''
  if (name.includes('stig'))
    standard = cache.standards.get('disa stig') || cache.standards.get('stig') || ''
  else if (name.includes('cis'))
    standard = cache.standards.get('cis benchmark') || cache.standards.get('cis') || ''
  else if (name.includes('scg'))
    standard = cache.standards.get('srg') || ''

  // Infer target from name (simplified - you may want to expand this)
  let target = ''
  if (name.includes('red hat 9') || name.includes('rhel 9'))
    target = cache.targets.get('red hat enterprise linux 9') || ''
  else if (name.includes('red hat 8') || name.includes('rhel 8'))
    target = cache.targets.get('red hat enterprise linux 8') || ''
  else if (name.includes('red hat 7') || name.includes('rhel 7'))
    target = cache.targets.get('red hat enterprise linux 7') || ''
  else if (name.includes('ubuntu 20'))
    target = cache.targets.get('ubuntu 20.04') || ''
  else if (name.includes('ubuntu 18'))
    target = cache.targets.get('ubuntu 18.04') || ''
  else if (name.includes('ubuntu 16'))
    target = cache.targets.get('ubuntu 16.04') || ''
  else if (name.includes('windows 10'))
    target = cache.targets.get('microsoft windows 10') || ''
  else if (name.includes('windows 2019') || name.includes('windows server 2019'))
    target = cache.targets.get('microsoft windows server 2019') || ''
  else if (name.includes('windows 2016') || name.includes('windows server 2016'))
    target = cache.targets.get('microsoft windows server 2016') || ''
  else if (name.includes('windows 2012') || name.includes('windows server 2012'))
    target = cache.targets.get('microsoft windows server 2012') || ''
  else if (name.includes('docker'))
    target = cache.targets.get('docker') || cache.targets.get('docker ce') || ''
  else if (name.includes('kubernetes'))
    target = cache.targets.get('kubernetes') || ''
  else if (name.includes('nginx'))
    target = cache.targets.get('nginx') || ''
  else if (name.includes('apache'))
    target = cache.targets.get('apache') || cache.targets.get('apache http server') || ''
  else if (name.includes('tomcat'))
    target = cache.targets.get('apache tomcat') || ''
  else if (name.includes('mongodb'))
    target = cache.targets.get('mongodb') || ''
  else if (name.includes('postgresql') || name.includes('postgres'))
    target = cache.targets.get('postgresql') || ''
  else if (name.includes('vmware'))
    target = '' // VMware targets vary widely
  else if (name.includes('aws'))
    target = cache.targets.get('aws') || ''
  else if (name.includes('azure'))
    target = cache.targets.get('azure') || cache.targets.get('microsoft azure') || ''

  return {
    technology,
    vendor,
    maintainer,
    standard,
    target,
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

main().catch(console.error)
