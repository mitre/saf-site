#!/usr/bin/env node
/**
 * Import data from content/data YAML files into SQLite database
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as YAML from 'yaml'
import * as schema from '../docs/.vitepress/database/schema.js'

// Connect to SQLite database
const client = createClient({ url: 'file:.data/saf.db' })
const db = drizzle(client, { schema })

const DATA_PATH = './content/data'

// Helper to read and parse YAML files
function loadYAML(filepath: string): any {
  const content = readFileSync(filepath, 'utf-8')
  return YAML.parse(content)
}

// Helper to get all YAML files in a directory
function getYAMLFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
      .map(f => join(dir, f))
  }
  catch (e) {
    return []
  }
}

// Helper to normalize timestamps in records
function normalizeTimestamps(records: any[]): any[] {
  return records.map((record) => {
    const normalized = { ...record }

    // Handle lastUpdated string dates
    if (normalized.lastUpdated && typeof normalized.lastUpdated === 'string') {
      normalized.lastUpdated = new Date(normalized.lastUpdated)
    }
    else if (!normalized.lastUpdated) {
      normalized.lastUpdated = new Date()
    }

    // Handle createdAt (usually missing from YAML)
    if (normalized.createdAt && typeof normalized.createdAt === 'string') {
      normalized.createdAt = new Date(normalized.createdAt)
    }
    else if (!normalized.createdAt) {
      // Use lastUpdated if available, otherwise current date
      normalized.createdAt = normalized.lastUpdated || new Date()
    }

    return normalized
  })
}

async function importData() {
  console.log('🚀 Starting import from content/data YAML files...\n')

  try {
    // Import organizations first (referenced by other tables)
    console.log('📦 Importing organizations...')
    const orgFiles = getYAMLFiles(join(DATA_PATH, 'organizations'))
    for (const file of orgFiles) {
      const data = loadYAML(file)
      if (data.organizations) {
        const normalized = normalizeTimestamps(data.organizations)
        await db.insert(schema.organizations).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.organizations.length} organizations`)
      }
    }

    // Import teams (referenced by profiles)
    console.log('📦 Importing teams...')
    const teamFiles = getYAMLFiles(join(DATA_PATH, 'teams'))
    for (const file of teamFiles) {
      const data = loadYAML(file)
      if (data.teams) {
        const normalized = normalizeTimestamps(data.teams)
        await db.insert(schema.teams).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.teams.length} teams`)
      }
    }

    // Import technologies (referenced by profiles)
    console.log('📦 Importing technologies...')
    const techFiles = getYAMLFiles(join(DATA_PATH, 'technologies'))
    for (const file of techFiles) {
      const data = loadYAML(file)
      if (data.technologies) {
        const normalized = normalizeTimestamps(data.technologies)
        await db.insert(schema.technologies).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.technologies.length} technologies`)
      }
    }

    // Import standards (referenced by profiles)
    console.log('📦 Importing standards...')
    const standardFiles = getYAMLFiles(join(DATA_PATH, 'standards'))
    for (const file of standardFiles) {
      const data = loadYAML(file)
      if (data.standards) {
        const normalized = normalizeTimestamps(data.standards)
        await db.insert(schema.standards).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.standards.length} standards`)
      }
    }

    // Import tags
    console.log('📦 Importing tags...')
    const tagFiles = getYAMLFiles(join(DATA_PATH, 'tags'))
    for (const file of tagFiles) {
      const data = loadYAML(file)
      if (data.tags) {
        const normalized = normalizeTimestamps(data.tags)
        await db.insert(schema.tags).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.tags.length} tags`)
      }
    }

    // Import capabilities
    console.log('📦 Importing capabilities...')
    const capFiles = getYAMLFiles(join(DATA_PATH, 'capabilities'))
    for (const file of capFiles) {
      const data = loadYAML(file)
      if (data.capabilities) {
        const normalized = normalizeTimestamps(data.capabilities)
        await db.insert(schema.capabilities).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.capabilities.length} capabilities`)
      }
    }

    // Import tools
    console.log('📦 Importing tools...')
    const toolFiles = getYAMLFiles(join(DATA_PATH, 'tools'))
    for (const file of toolFiles) {
      const data = loadYAML(file)
      if (data.tools) {
        const normalized = normalizeTimestamps(data.tools)
        await db.insert(schema.tools).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.tools.length} tools`)
      }
    }

    // Import validation profiles
    console.log('📦 Importing validation profiles...')
    const profileFiles = getYAMLFiles(join(DATA_PATH, 'profiles'))
    for (const file of profileFiles) {
      const data = loadYAML(file)
      if (data.profiles) {
        const normalized = normalizeTimestamps(data.profiles)
        await db.insert(schema.profiles).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.profiles.length} profiles from ${file.split('/').pop()}`)
      }
    }

    // Import hardening profiles
    console.log('📦 Importing hardening profiles...')
    const hardeningFiles = getYAMLFiles(join(DATA_PATH, 'hardening'))
    for (const file of hardeningFiles) {
      const data = loadYAML(file)
      if (data.hardeningProfiles) {
        const normalized = normalizeTimestamps(data.hardeningProfiles)
        await db.insert(schema.hardeningProfiles).values(normalized).onConflictDoNothing()
        console.log(`  ✓ Loaded ${data.hardeningProfiles.length} hardening profiles from ${file.split('/').pop()}`)
      }
    }

    console.log('\n✅ Import complete!')
    console.log('\nNext steps:')
    console.log('  1. Run: pnpm studio')
    console.log('  2. View data in Drizzle Studio')
    console.log('  3. Run: pnpm db:dump')
    console.log('  4. Commit diffable/ directory\n')
  }
  catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

importData()
