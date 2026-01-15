#!/usr/bin/env tsx
/**
 * Seed Database - Create schema and populate data
 * 
 * This script:
 * 1. Creates all Pocketbase collections with proper fields and indexes
 * 2. Populates reference data from v1-export JSON files
 * 3. Populates content data (profiles, tools, etc.)
 * 
 * Usage:
 *   npx tsx scripts/seed-database.ts              # Full setup (schema + data)
 *   npx tsx scripts/seed-database.ts --schema-only   # Only create collections
 *   npx tsx scripts/seed-database.ts --data-only     # Only populate data
 * 
 * Prerequisites:
 *   - Pocketbase running: cd .pocketbase && ./pocketbase serve
 *   - v1-export/ directory with JSON data files (for data population)
 * 
 * For restoring from git (recommended):
 *   Use: pnpm setup:force (uses sqlite-diffable to restore from diffable/)
 * 
 * Schema source of truth: docs/.vitepress/database/schema.ts (Drizzle)
 */

import PocketBase from 'pocketbase'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pb = new PocketBase('http://127.0.0.1:8090')
const EXPORT_DIR = path.join(__dirname, 'v1-export')

// Parse command line args
const args = process.argv.slice(2)
const schemaOnly = args.includes('--schema-only')
const dataOnly = args.includes('--data-only')

// Track collection IDs for FK references during schema creation
const collectionIds: Record<string, string> = {}

// Track ID mappings during data population
const idMaps: Record<string, Record<string, string>> = {
  organizations: {},
  tags: {},
  capabilities: {},
  teams: {},
  standards: {},
  technologies: {},
  categories: {},
  targets: {},
  tools: {},
  content: {},
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function normalizeVersion(version: string | undefined): string {
  if (!version) return ''

  // Strip leading 'v' or 'V' prefix - versions should be just "1.0.0" not "v1.0.0"
  // The display layer (Vue components) adds the "v" prefix for presentation
  return version.replace(/^[vV]/, '')
}

interface IndexConfig {
  unique?: string[]       // Fields that need UNIQUE indexes
  regular?: string[]      // Fields that need regular indexes (FKs, filters)
  composite?: string[][]  // Composite indexes (array of field arrays)
}

async function createCollection(
  name: string,
  fields: any[],
  indexConfig?: IndexConfig
): Promise<string> {
  try {
    // Check if collection exists
    const existing = await pb.collections.getList(1, 100)
    const found = existing.items.find(c => c.name === name)

    if (found) {
      console.log(`  ℹ️  ${name} already exists (ID: ${found.id})`)
      return found.id
    }

    // Build indexes array
    const indexes: string[] = []

    if (indexConfig?.unique) {
      for (const field of indexConfig.unique) {
        indexes.push(`CREATE UNIQUE INDEX idx_${name}_${field} ON ${name} (${field})`)
      }
    }

    if (indexConfig?.regular) {
      for (const field of indexConfig.regular) {
        indexes.push(`CREATE INDEX idx_${name}_${field} ON ${name} (${field})`)
      }
    }

    if (indexConfig?.composite) {
      for (const fields of indexConfig.composite) {
        const fieldList = fields.join(', ')
        const indexName = fields.join('_')
        indexes.push(`CREATE INDEX idx_${name}_${indexName} ON ${name} (${fieldList})`)
      }
    }

    // Create collection
    const collection = await pb.collections.create({
      name,
      type: 'base',
      fields,
      indexes
    })

    console.log(`  ✓ Created ${name} (ID: ${collection.id})`)
    if (indexes.length > 0) {
      console.log(`      ${indexes.length} indexes created`)
    }
    return collection.id
  } catch (error: any) {
    console.error(`  ✗ Failed to create ${name}:`, error.message)
    if (error.response?.data) {
      console.error(`      Details:`, JSON.stringify(error.response.data, null, 2))
    }
    throw error
  }
}


// ============================================================================
// MAIN ENTRY POINT  
// ============================================================================

async function main() {
  // Authenticate with Pocketbase
  await pb.collection('_superusers').authWithPassword('admin@localhost.com', 'testpassword123')
  console.log('✓ Authenticated\n')

  if (!dataOnly) {
    console.log('='.repeat(70))
    console.log('PHASE 1: CREATING SCHEMA')
    console.log('='.repeat(70))
    await createSchema()
  }

  if (!schemaOnly) {
    console.log('\n' + '='.repeat(70))
    console.log('PHASE 2: POPULATING DATA')
    console.log('='.repeat(70))
    await populateData()
  }

  console.log('\n' + '='.repeat(70))
  console.log('✓ SEED COMPLETE')
  console.log('='.repeat(70))

  // Save ID mappings for reference
  if (!schemaOnly) {
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'id-mappings.json'),
      JSON.stringify(idMaps, null, 2)
    )
    console.log('\n✓ ID mappings saved to scripts/v1-export/id-mappings.json')
  }
}

async function createSchema() {
  // ========================================================================
  // LOOKUP TABLES (no FK dependencies)
  // ========================================================================

  // Capabilities
  collectionIds.capabilities = await createCollection('capabilities', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'color', type: 'text', options: { max: 50 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['name', 'slug']
  })

  // Categories
  collectionIds.categories = await createCollection('categories', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['name', 'slug']
  })

  // Organizations
  collectionIds.organizations = await createCollection('organizations', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'org_type', type: 'select', values: ['vendor', 'government', 'community', 'standards_body'] }
  ], {
    unique: ['slug'],
    regular: ['org_type']
  })

  // Tags
  collectionIds.tags = await createCollection('tags', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'tag_category', type: 'select', values: ['platform', 'compliance', 'feature', 'technology', 'other'] },
    { name: 'badge_color', type: 'text', options: { max: 50 } }
  ], {
    unique: ['name', 'slug'],
    regular: ['tag_category']
  })

  // Tool Types
  collectionIds.tool_types = await createCollection('tool_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['name', 'slug']
  })

  // Distribution Types
  collectionIds.distribution_types = await createCollection('distribution_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['name', 'slug']
  })

  // Registries
  collectionIds.registries = await createCollection('registries', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' }
  ], {
    unique: ['name', 'slug']
  })

  // Resource Types (for course learning resources)
  collectionIds.resource_types = await createCollection('resource_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['name', 'slug']
  })

  // Media Types (for SAF media library)
  collectionIds.media_types = await createCollection('media_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['name', 'slug']
  })

  // ========================================================================
  // TABLES WITH FK DEPENDENCIES (Level 1)
  // ========================================================================

  // Teams (depends on organizations)
  collectionIds.teams = await createCollection('teams', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'website', type: 'url' }
  ], {
    unique: ['slug'],
    regular: ['organization']
  })

  // Standards (depends on organizations)
  collectionIds.standards = await createCollection('standards', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'short_name', type: 'text', options: { max: 50 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'standard_type', type: 'select', values: ['regulatory', 'industry', 'government', 'vendor'] }
  ], {
    unique: ['slug'],
    regular: ['organization', 'standard_type']
  })

  // Technologies (depends on organizations)
  collectionIds.technologies = await createCollection('technologies', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'github', type: 'url' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'documentation_url', type: 'url' }
  ], {
    unique: ['slug'],
    regular: ['organization']
  })

  // Targets (depends on categories, organizations)
  collectionIds.targets = await createCollection('targets', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'category', type: 'relation', collectionId: collectionIds.categories, maxSelect: 1 },
    { name: 'vendor', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' }
  ], {
    unique: ['slug'],
    regular: ['category', 'vendor']
  })

  // ========================================================================
  // MAIN CONTENT TABLES (Level 2)
  // ========================================================================

  // Content (unified profiles)
  collectionIds.content = await createCollection('content', [
    { name: 'name', type: 'text', required: true, options: { max: 300 } },
    { name: 'slug', type: 'text', required: true, options: { max: 150 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50, pattern: '^[0-9].*$' } },  // No "v" prefix - frontend adds it

    // Classification
    { name: 'content_type', type: 'select', required: true, values: ['validation', 'hardening'] },
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'target', type: 'relation', collectionId: collectionIds.targets, maxSelect: 1 },
    { name: 'standard', type: 'relation', collectionId: collectionIds.standards, maxSelect: 1 },
    { name: 'technology', type: 'relation', collectionId: collectionIds.technologies, maxSelect: 1 },
    { name: 'vendor', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'maintainer', type: 'relation', collectionId: collectionIds.teams, maxSelect: 1 },

    // Links
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },

    // Domain-specific (validation profiles)
    { name: 'control_count', type: 'number', options: { min: 0 } },
    { name: 'stig_id', type: 'text', options: { max: 50 } },
    { name: 'benchmark_version', type: 'text', options: { max: 50 } },

    // Domain-specific (hardening)
    { name: 'automation_level', type: 'select', values: ['full', 'partial', 'manual'] },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } },
    { name: 'release_date', type: 'date' },
    { name: 'deprecated_at', type: 'date' }
  ], {
    unique: ['slug'],
    regular: ['content_type', 'status', 'target', 'standard', 'technology', 'vendor', 'maintainer', 'is_featured']
  })

  // Tools
  collectionIds.tools = await createCollection('tools', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50, pattern: '^[0-9].*$' } },  // No "v" prefix - frontend adds it

    // Classification
    { name: 'tool_type', type: 'relation', collectionId: collectionIds.tool_types, maxSelect: 1 },
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'technology', type: 'relation', collectionId: collectionIds.technologies, maxSelect: 1 },

    // Links
    { name: 'website', type: 'url' },
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },
    { name: 'logo', type: 'text' },

    // Media
    { name: 'screenshot', type: 'text' },
    { name: 'screenshots', type: 'json' },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } }
  ], {
    unique: ['slug'],
    regular: ['tool_type', 'status', 'organization', 'technology', 'is_featured']
  })

  // Distributions
  collectionIds.distributions = await createCollection('distributions', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50, pattern: '^[0-9].*$' } },  // No "v" prefix - frontend adds it

    // Classification
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'tool', type: 'relation', collectionId: collectionIds.tools, maxSelect: 1 },
    { name: 'distribution_type', type: 'relation', collectionId: collectionIds.distribution_types, maxSelect: 1 },
    { name: 'registry', type: 'relation', collectionId: collectionIds.registries, maxSelect: 1 },

    // Links
    { name: 'registry_url', type: 'url' },
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },

    // Installation
    { name: 'install_command', type: 'text' },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } }
  ], {
    unique: ['slug'],
    regular: ['status', 'tool', 'distribution_type', 'registry']
  })

  // Courses (training classes and educational content)
  collectionIds.courses = await createCollection('courses', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'slug', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },

    // Classification
    { name: 'course_type', type: 'select', values: ['class', 'workshop', 'tutorial', 'webinar'] },
    { name: 'level', type: 'select', values: ['beginner', 'intermediate', 'advanced'] },
    { name: 'status', type: 'select', values: ['active', 'beta', 'deprecated', 'draft'] },

    // Foreign Keys
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },

    // Links
    { name: 'website', type: 'url' },
    { name: 'registration_url', type: 'url' },
    { name: 'materials_url', type: 'url' },
    { name: 'logo', type: 'text' },

    // Duration & Pricing
    { name: 'duration_minutes', type: 'number', options: { min: 0 } },
    { name: 'is_free', type: 'bool' },
    { name: 'price_usd', type: 'number', options: { min: 0 } },

    // Audience
    { name: 'target_audience', type: 'text' },

    // Registration
    { name: 'registration_active', type: 'bool' },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['slug'],
    regular: ['course_type', 'level', 'status', 'organization', 'is_featured']
  })

  // Course Resources (learning materials for courses)
  collectionIds.course_resources = await createCollection('course_resources', [
    { name: 'title', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'url', type: 'url', required: true },

    // Foreign Keys
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'resource_type', type: 'relation', required: true, collectionId: collectionIds.resource_types, maxSelect: 1 },

    // Display
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], {
    regular: ['course', 'resource_type']
  })

  // Course Sessions (scheduled training dates - past and future)
  collectionIds.course_sessions = await createCollection('course_sessions', [
    { name: 'title', type: 'text', options: { max: 200 } },  // Optional override like "Spring 2026 Cohort"

    // Foreign Keys
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },

    // Schedule
    { name: 'start_date', type: 'date', required: true },
    { name: 'end_date', type: 'date' },
    { name: 'timezone', type: 'text', options: { max: 50 } },

    // Location
    { name: 'location_type', type: 'select', values: ['virtual', 'in_person', 'hybrid'] },
    { name: 'location', type: 'text' },  // Room/venue or video platform
    { name: 'meeting_url', type: 'url' },

    // Capacity
    { name: 'instructor', type: 'text', options: { max: 200 } },
    { name: 'max_attendees', type: 'number', options: { min: 0 } },

    // Recording (YouTube or other)
    { name: 'recording_url', type: 'url' },

    // Status
    { name: 'status', type: 'select', values: ['scheduled', 'in_progress', 'completed', 'cancelled'] }
  ], {
    regular: ['course', 'start_date', 'status', 'location_type']
  })

  // Media (SAF media library - presentations, PDFs, videos, etc.)
  collectionIds.media = await createCollection('media', [
    { name: 'name', type: 'text', required: true, options: { max: 300 } },
    { name: 'slug', type: 'text', required: true, options: { max: 150 } },
    { name: 'description', type: 'text' },

    // Classification
    { name: 'media_type', type: 'relation', required: true, collectionId: collectionIds.media_types, maxSelect: 1 },

    // Author/Source
    { name: 'author', type: 'text', options: { max: 200 } },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'published_at', type: 'date' },

    // Content - URL or File (one or both)
    { name: 'url', type: 'url' },                          // External link (YouTube, SlideShare, etc.)
    { name: 'file', type: 'file', options: {              // Binary upload (PDF, PPT, etc.)
      maxSelect: 1,
      maxSize: 52428800  // 50MB
    }},
    { name: 'file_size', type: 'number', options: { min: 0 } },
    { name: 'thumbnail', type: 'file', options: {
      maxSelect: 1,
      maxSize: 2097152,  // 2MB
      mimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    }},

    // Event context (optional - for conference talks, webinars)
    { name: 'event_name', type: 'text', options: { max: 200 } },
    { name: 'event_date', type: 'date' },

    // Featured/Curation
    { name: 'is_featured', type: 'bool' },
    { name: 'featured_order', type: 'number', options: { min: 0 } }
  ], {
    unique: ['slug'],
    regular: ['media_type', 'organization', 'published_at', 'is_featured']
  })

  // Releases (version history - polymorphic)
  collectionIds.releases = await createCollection('releases', [
    { name: 'slug', type: 'text', required: true, options: { max: 150 } },

    // Polymorphic reference
    { name: 'entity_type', type: 'select', required: true, values: ['content', 'tool', 'distribution'] },
    { name: 'entity_id', type: 'text', required: true, options: { max: 50 } },

    // Version info
    { name: 'version', type: 'text', required: true, options: { max: 50 } },
    { name: 'release_date', type: 'date' },
    { name: 'release_notes', type: 'text' },

    // Download/verification
    { name: 'download_url', type: 'url' },
    { name: 'sha256', type: 'text', options: { max: 64 } },

    // Status
    { name: 'is_latest', type: 'bool' }
  ], {
    unique: ['slug'],
    regular: ['entity_type', 'entity_id', 'is_latest'],
    composite: [['entity_type', 'entity_id', 'is_latest']]  // For "get latest" queries
  })

  // ========================================================================
  // JUNCTION TABLES (Level 3) - with cascadeDelete
  // ========================================================================

  // Content ↔ Capabilities
  await createCollection('content_capabilities', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['content', 'capability']
  })

  // Content ↔ Tags
  await createCollection('content_tags', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['content', 'tag']
  })

  // Content ↔ Content (relationships)
  await createCollection('content_relationships', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'related_content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1, cascadeDelete: true },
    { name: 'relationship_type', type: 'select', required: true, values: ['validates', 'hardens', 'complements'] }
  ], {
    regular: ['content', 'related_content', 'relationship_type']
  })

  // Tools ↔ Capabilities
  await createCollection('tool_capabilities', [
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['tool', 'capability']
  })

  // Tools ↔ Tags
  await createCollection('tool_tags', [
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['tool', 'tag']
  })

  // Distributions ↔ Capabilities
  await createCollection('distribution_capabilities', [
    { name: 'distribution', type: 'relation', required: true, collectionId: collectionIds.distributions, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['distribution', 'capability']
  })

  // Distributions ↔ Tags
  await createCollection('distribution_tags', [
    { name: 'distribution', type: 'relation', required: true, collectionId: collectionIds.distributions, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['distribution', 'tag']
  })

  // Courses ↔ Capabilities
  await createCollection('course_capabilities', [
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['course', 'capability']
  })

  // Courses ↔ Tools
  await createCollection('course_tools', [
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['course', 'tool']
  })

  // Courses ↔ Tags
  await createCollection('course_tags', [
    { name: 'course', type: 'relation', required: true, collectionId: collectionIds.courses, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['course', 'tag']
  })

  // Media ↔ Capabilities
  await createCollection('media_capabilities', [
    { name: 'media', type: 'relation', required: true, collectionId: collectionIds.media, maxSelect: 1, cascadeDelete: true },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['media', 'capability']
  })

  // Media ↔ Tags
  await createCollection('media_tags', [
    { name: 'media', type: 'relation', required: true, collectionId: collectionIds.media, maxSelect: 1, cascadeDelete: true },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1, cascadeDelete: true }
  ], {
    regular: ['media', 'tag']
  })

  // ========================================================================
  // SUMMARY
  // ========================================================================


}

async function populateData() {
  // Check if export directory exists
  if (!fs.existsSync(EXPORT_DIR)) {
    console.log('⚠️  v1-export/ directory not found. Skipping data population.')
    console.log('   To populate data, create scripts/v1-export/ with JSON files.')
    return
  }

  // Phase 1: Lookup tables (no FK dependencies)
  await migrateCapabilities()
  await migrateOrganizations()
  await migrateTags()

  // Phase 2: Level 1 tables (depend on organizations)
  await migrateTeams()
  await migrateStandards()
  await migrateTechnologies()

  // Phase 3: Create categories and targets
  await createCategories()
  await createTargets()

  // Phase 4: Tools
  await migrateTools()

  // Phase 5: Content (profiles + hardening)
  await migrateProfiles()
  await migrateHardeningProfiles()

  // Phase 6: Junction tables
  await migrateContentTags()
  await migrateContentRelationships()
}

// ============================================================================
// DATA POPULATION FUNCTIONS
// ============================================================================

async function migrateCapabilities() {
  console.log('\n--- Migrating capabilities ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'capabilities.json'), 'utf-8'))

  for (const item of v1Data) {
    try {
      const v2Record = await pb.collection('capabilities').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        icon: item.icon || '',
        color: item.color || '',
        sort_order: item.sort_order || 0
      })
      idMaps.capabilities[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      if (error.status === 400 && error.response?.data?.slug) {
        // Duplicate slug - try to find existing
        const existing = await pb.collection('capabilities').getFirstListItem(`slug="${slugify(item.name)}"`)
        idMaps.capabilities[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      } else {
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
      const v2Record = await pb.collection('organizations').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        website: item.website || '',
        logo: item.logo || '',
        org_type: mapOrgType(item.org_type || item.type)
      })
      idMaps.organizations[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('organizations').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.organizations[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      } else {
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
      const v2Record = await pb.collection('tags').create({
        name: tagName,
        slug: tagSlug,
        display_name: item.display_name || formatTagName(tagName),
        description: item.description || '',
        tag_category: mapTagCategory(item.category || item.tag_category),
        badge_color: item.badge_color || item.color || ''
      })
      idMaps.tags[item.id] = v2Record.id
      console.log(`  ✓ ${tagName}`)
    } catch (error: any) {
      if (error.status === 400) {
        try {
          const existing = await pb.collection('tags').getFirstListItem(`slug="${tagSlug}"`)
          idMaps.tags[item.id] = existing.id
          console.log(`  ℹ️ ${tagName} (already exists)`)
        } catch {
          console.error(`  ✗ ${tagName}: ${error.message}`)
        }
      } else {
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
      const v2Record = await pb.collection('teams').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        organization: item.organization ? idMaps.organizations[item.organization] : '',
        website: item.website || ''
      })
      idMaps.teams[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('teams').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.teams[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      } else {
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
      const v2Record = await pb.collection('standards').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        website: item.website || '',
        logo: item.logo || '',
        organization: item.organization ? idMaps.organizations[item.organization] : '',
        standard_type: mapStandardType(item.standard_type || item.type)
      })
      idMaps.standards[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('standards').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.standards[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      } else {
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
      const v2Record = await pb.collection('technologies').create({
        name: item.name,
        slug: item.slug || slugify(item.name),
        description: item.description || '',
        website: item.website || '',
        logo: item.logo || '',
        github: item.github || '',
        organization: item.organization ? idMaps.organizations[item.organization] : '',
        documentation_url: item.documentation_url || ''
      })
      idMaps.technologies[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('technologies').getFirstListItem(`slug="${item.slug || slugify(item.name)}"`)
        idMaps.technologies[item.id] = existing.id
        console.log(`  ℹ️ ${item.name} (already exists)`)
      } else {
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
      const record = await pb.collection('categories').create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        sort_order: CATEGORIES.indexOf(cat)
      })
      categoryIds[cat.slug] = record.id
      console.log(`  ✓ ${cat.name}`)
    } catch (error: any) {
      if (error.status === 400) {
        const existing = await pb.collection('categories').getFirstListItem(`slug="${cat.slug}"`)
        categoryIds[cat.slug] = existing.id
        console.log(`  ℹ️ ${cat.name} (already exists)`)
      } else {
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
          const vendorOrg = await pb.collection('organizations').getFirstListItem(`slug="${targetInfo.vendor}"`)
            .catch(() => null)
          if (vendorOrg) vendorId = vendorOrg.id
        }

        const record = await pb.collection('targets').create({
          name: targetInfo.name,
          slug: targetInfo.slug,
          description: '',
          category: categoryIds[targetInfo.category] || '',
          vendor: vendorId,
          website: '',
          logo: ''
        })
        targetIds[targetInfo.slug] = record.id
        console.log(`  ✓ ${targetInfo.name}`)
      } catch (error: any) {
        if (error.status === 400) {
          const existing = await pb.collection('targets').getFirstListItem(`slug="${targetInfo.slug}"`)
          targetIds[targetInfo.slug] = existing.id
          console.log(`  ℹ️ ${targetInfo.name} (already exists)`)
        } else {
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
      license: item.license || ''
    }

    // Only add FK fields if they have valid mapped IDs
    if (item.organization && idMaps.organizations[item.organization]) {
      record.organization = idMaps.organizations[item.organization]
    }
    if (item.technology && idMaps.technologies[item.technology]) {
      record.technology = idMaps.technologies[item.technology]
    }

    try {
      const v2Record = await pb.collection('tools').create(record)
      idMaps.tools[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      console.error(`  ✗ ${item.name}: ${error.message}`)
      if (error.response) {
        console.error(`      Response: ${JSON.stringify(error.response)}`)
      }
      if (error.status === 400) {
        try {
          const existing = await pb.collection('tools').getFirstListItem(`slug="${toolSlug}"`)
          idMaps.tools[item.id] = existing.id
          console.log(`      → Found existing with slug`)
        } catch {
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
  console.log('\n--- Migrating profiles → content (validation) ---')
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
        license: item.license || ''
      }

      // Only add FK fields if they have valid mapped IDs
      if (targetId) contentRecord.target = targetId
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

      const v2Record = await pb.collection('content').create(contentRecord)
      idMaps.content[item.id] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      if (error.status === 400) {
        try {
          const existing = await pb.collection('content').getFirstListItem(`slug="${profileSlug}"`)
          idMaps.content[item.id] = existing.id
          console.log(`  ℹ️ ${item.name} (already exists)`)
        } catch {
          console.error(`  ✗ ${item.name}: ${error.message}`)
        }
      } else {
        console.error(`  ✗ ${item.name}: ${error.message}`)
        if (error.response?.data) {
          console.error(`      Details: ${JSON.stringify(error.response.data)}`)
        }
      }
    }
  }
}

async function migrateHardeningProfiles() {
  console.log('\n--- Migrating hardening_profiles → content (hardening) ---')
  const v1Data = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'hardening_profiles.json'), 'utf-8'))

  for (const item of v1Data) {
    const hardeningSlug = item.slug || item.hardening_id || slugify(item.name)

    try {
      // Infer target from profile name
      const targetInfo = inferTargetFromProfile(item.name)
      const targetId = targetInfo ? targetIds[targetInfo.slug] : ''

      // Map difficulty to automation_level
      const automationLevel = item.difficulty === 'easy' ? 'full'
        : item.difficulty === 'medium' ? 'partial'
        : item.difficulty === 'hard' ? 'manual'
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
        license: item.license || ''
      }

      // Only add FK fields if they have valid mapped IDs
      if (targetId) hardeningRecord.target = targetId
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

      const v2Record = await pb.collection('content').create(hardeningRecord)
      // Use special prefix to distinguish hardening profile IDs
      idMaps.content[`h_${item.id}`] = v2Record.id
      console.log(`  ✓ ${item.name}`)
    } catch (error: any) {
      if (error.status === 400) {
        try {
          const existing = await pb.collection('content').getFirstListItem(`slug="${hardeningSlug}"`)
          idMaps.content[`h_${item.id}`] = existing.id
          console.log(`  ℹ️ ${item.name} (already exists)`)
        } catch {
          console.error(`  ✗ ${item.name}: ${error.message}`)
        }
      } else {
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
        await pb.collection('content_tags').create({
          content: contentId,
          tag: tagId
        })
        count++
      } catch {
        // Ignore duplicates
      }
    } else {
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
        await pb.collection('content_tags').create({
          content: contentId,
          tag: tagId
        })
        count++
      } catch {
        // Ignore duplicates
      }
    } else {
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
        await pb.collection('content_relationships').create({
          content: validationId,
          related_content: hardeningId,
          relationship_type: 'hardens'
        })
        count++
      } catch {
        // Ignore duplicates
      }
    } else {
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
    'vendor': 'vendor',
    'government': 'government',
    'community': 'community',
    'standards': 'standards_body',
    'standards_body': 'standards_body'
  }
  return map[type || ''] || ''
}

function mapTagCategory(category: string | undefined): string {
  const map: Record<string, string> = {
    'platform': 'platform',
    'compliance': 'compliance',
    'feature': 'feature',
    'technology': 'technology',
    'other': 'other'
  }
  return map[category || ''] || 'other'
}

function mapStandardType(type: string | undefined): string {
  const map: Record<string, string> = {
    'regulatory': 'regulatory',
    'industry': 'industry',
    'government': 'government',
    'vendor': 'vendor'
  }
  return map[type || ''] || ''
}

function mapStatus(status: string | undefined): string {
  const map: Record<string, string> = {
    'active': 'active',
    'beta': 'beta',
    'deprecated': 'deprecated',
    'draft': 'draft'
  }
  return map[status || ''] || 'active'
}

function mapAutomationLevel(level: string | undefined): string {
  const map: Record<string, string> = {
    'full': 'full',
    'partial': 'partial',
    'manual': 'manual'
  }
  return map[level || ''] || ''
}

function normalizeUrl(url: string | undefined): string {
  if (!url) return ''

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
  if (!version) return ''

  // Strip leading 'v' or 'V' prefix - versions should be just "1.0.0" not "v1.0.0"
  // The display layer (Vue components) adds the "v" prefix for presentation
  return version.replace(/^[vV]/, '')
}

main().catch(console.error)
