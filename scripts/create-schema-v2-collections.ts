#!/usr/bin/env tsx
/**
 * Create Pocketbase collections for Schema v2
 *
 * This script creates all collections defined in schema-v2.ts
 * Run with: npx tsx scripts/create-schema-v2-collections.ts
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

async function main() {
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  console.log('✓ Authenticated\n')

  console.log('='.repeat(70))
  console.log('SCHEMA V2 - Creating Collections')
  console.log('='.repeat(70))

  // Track created collections for FK references
  const collectionIds: Record<string, string> = {}

  // ========================================================================
  // LOOKUP TABLES (no FK dependencies)
  // ========================================================================

  // Capabilities
  collectionIds.capabilities = await createCollection('capabilities', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'color', type: 'text', options: { max: 50 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], ['name'])

  // Categories
  collectionIds.categories = await createCollection('categories', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], ['name'])

  // Organizations
  collectionIds.organizations = await createCollection('organizations', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'org_type', type: 'select', options: {
      values: ['vendor', 'government', 'community', 'standards_body']
    }}
  ])

  // Tags
  collectionIds.tags = await createCollection('tags', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'tag_category', type: 'select', options: {
      values: ['platform', 'compliance', 'feature', 'other']
    }}
  ], ['name'])

  // Tool Types
  collectionIds.tool_types = await createCollection('tool_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], ['name'])

  // Distribution Types
  collectionIds.distribution_types = await createCollection('distribution_types', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text', options: { max: 100 } },
    { name: 'sort_order', type: 'number', options: { min: 0 } }
  ], ['name'])

  // Registries
  collectionIds.registries = await createCollection('registries', [
    { name: 'name', type: 'text', required: true, options: { max: 100 } },
    { name: 'display_name', type: 'text', options: { max: 100 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' }
  ], ['name'])

  // ========================================================================
  // TABLES WITH FK DEPENDENCIES (Level 1)
  // ========================================================================

  // Teams (depends on organizations)
  collectionIds.teams = await createCollection('teams', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'website', type: 'url' }
  ])

  // Standards (depends on organizations)
  collectionIds.standards = await createCollection('standards', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'standard_type', type: 'select', options: {
      values: ['regulatory', 'industry', 'government', 'vendor']
    }}
  ])

  // Technologies (depends on organizations)
  collectionIds.technologies = await createCollection('technologies', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' },
    { name: 'github', type: 'url' },
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'documentation_url', type: 'url' }
  ])

  // Targets (depends on categories, organizations)
  collectionIds.targets = await createCollection('targets', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'category', type: 'relation', collectionId: collectionIds.categories, maxSelect: 1 },
    { name: 'vendor', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'website', type: 'url' },
    { name: 'logo', type: 'text' }
  ])

  // ========================================================================
  // MAIN CONTENT TABLES (Level 2)
  // ========================================================================

  // Content (unified profiles)
  collectionIds.content = await createCollection('content', [
    { name: 'name', type: 'text', required: true, options: { max: 300 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50 } },

    // Classification
    { name: 'content_type', type: 'select', required: true, options: {
      values: ['validation', 'hardening']
    }},
    { name: 'status', type: 'select', options: {
      values: ['active', 'beta', 'deprecated', 'draft']
    }},

    // Foreign Keys
    { name: 'target', type: 'relation', collectionId: collectionIds.targets, maxSelect: 1 },
    { name: 'standard', type: 'relation', collectionId: collectionIds.standards, maxSelect: 1 },
    { name: 'technology', type: 'relation', collectionId: collectionIds.technologies, maxSelect: 1 },
    { name: 'vendor', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'maintainer', type: 'relation', collectionId: collectionIds.teams, maxSelect: 1 },

    // Links
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } },
    { name: 'release_date', type: 'date' }
  ])

  // Tools
  collectionIds.tools = await createCollection('tools', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'long_description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50 } },

    // Classification
    { name: 'tool_type', type: 'relation', collectionId: collectionIds.tool_types, maxSelect: 1 },
    { name: 'status', type: 'select', options: {
      values: ['active', 'beta', 'deprecated', 'draft']
    }},

    // Foreign Keys
    { name: 'organization', type: 'relation', collectionId: collectionIds.organizations, maxSelect: 1 },
    { name: 'technology', type: 'relation', collectionId: collectionIds.technologies, maxSelect: 1 },

    // Links
    { name: 'website', type: 'url' },
    { name: 'github', type: 'url' },
    { name: 'documentation_url', type: 'url' },
    { name: 'logo', type: 'text' },

    // Metadata
    { name: 'license', type: 'text', options: { max: 100 } }
  ])

  // Distributions
  collectionIds.distributions = await createCollection('distributions', [
    { name: 'name', type: 'text', required: true, options: { max: 200 } },
    { name: 'description', type: 'text' },
    { name: 'version', type: 'text', options: { max: 50 } },

    // Classification
    { name: 'status', type: 'select', options: {
      values: ['active', 'beta', 'deprecated', 'draft']
    }},

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
  ])

  // ========================================================================
  // JUNCTION TABLES (Level 3)
  // ========================================================================

  // Content ↔ Capabilities
  await createCollection('content_capabilities', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1 },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1 }
  ])

  // Content ↔ Tags
  await createCollection('content_tags', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1 },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1 }
  ])

  // Content ↔ Content (relationships)
  await createCollection('content_relationships', [
    { name: 'content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1 },
    { name: 'related_content', type: 'relation', required: true, collectionId: collectionIds.content, maxSelect: 1 },
    { name: 'relationship_type', type: 'select', required: true, options: {
      values: ['validates', 'hardens', 'complements']
    }}
  ])

  // Tools ↔ Capabilities
  await createCollection('tool_capabilities', [
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1 },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1 }
  ])

  // Tools ↔ Tags
  await createCollection('tool_tags', [
    { name: 'tool', type: 'relation', required: true, collectionId: collectionIds.tools, maxSelect: 1 },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1 }
  ])

  // Distributions ↔ Capabilities
  await createCollection('distribution_capabilities', [
    { name: 'distribution', type: 'relation', required: true, collectionId: collectionIds.distributions, maxSelect: 1 },
    { name: 'capability', type: 'relation', required: true, collectionId: collectionIds.capabilities, maxSelect: 1 }
  ])

  // Distributions ↔ Tags
  await createCollection('distribution_tags', [
    { name: 'distribution', type: 'relation', required: true, collectionId: collectionIds.distributions, maxSelect: 1 },
    { name: 'tag', type: 'relation', required: true, collectionId: collectionIds.tags, maxSelect: 1 }
  ])

  // ========================================================================
  // SUMMARY
  // ========================================================================

  console.log('\n' + '='.repeat(70))
  console.log('SUMMARY')
  console.log('='.repeat(70))
  console.log('\nLookup Tables (no dependencies):')
  console.log('  • capabilities - SAF pillars (Validate, Harden, Normalize, Plan, Visualize)')
  console.log('  • categories - Target groupings (OS, Database, Container, etc.)')
  console.log('  • organizations - Companies/agencies (MITRE, DISA, AWS, VMware)')
  console.log('  • tags - Flexible labels (linux, windows, cloud)')
  console.log('  • tool_types - Tool classification (application, cli, library)')
  console.log('  • distribution_types - Distribution methods (helm_chart, npm, docker)')
  console.log('  • registries - Package registries (Artifact Hub, Docker Hub, npmjs)')

  console.log('\nWith FK Dependencies (Level 1):')
  console.log('  • teams → organizations')
  console.log('  • standards → organizations')
  console.log('  • technologies → organizations')
  console.log('  • targets → categories, organizations')

  console.log('\nMain Content Tables (Level 2):')
  console.log('  • content → targets, standards, technologies, organizations, teams')
  console.log('  • tools → tool_types, organizations, technologies')
  console.log('  • distributions → tools, distribution_types, registries')

  console.log('\nJunction Tables:')
  console.log('  • content_capabilities, content_tags, content_relationships')
  console.log('  • tool_capabilities, tool_tags')
  console.log('  • distribution_capabilities, distribution_tags')

  console.log('\n✓ Schema v2 collections created successfully!')
}

// Helper function to create a collection
async function createCollection(
  name: string,
  fields: any[],
  indexes?: string[]
): Promise<string> {
  try {
    // Check if collection exists
    const existing = await pb.collections.getList(1, 100)
    const found = existing.items.find(c => c.name === name)

    if (found) {
      console.log(`  ℹ️  ${name} already exists (ID: ${found.id})`)
      return found.id
    }

    // Create collection
    const collection = await pb.collections.create({
      name,
      type: 'base',
      fields,
      indexes: indexes?.map(field => `CREATE UNIQUE INDEX idx_${name}_${field} ON ${name} (${field})`) || []
    })

    console.log(`  ✓ Created ${name} (ID: ${collection.id})`)
    return collection.id
  } catch (error: any) {
    console.error(`  ✗ Failed to create ${name}:`, error.message)
    throw error
  }
}

main().catch(console.error)
