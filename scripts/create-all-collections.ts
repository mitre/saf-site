#!/usr/bin/env tsx
/**
 * Create all 12 Pocketbase collections for MITRE SAF content management
 * Based on Drizzle schema.ts - creates collections in correct dependency order
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

// Authenticate
try {
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  console.log('✓ Authenticated\n')
}
catch (e) {
  console.error('❌ Authentication failed:', e)
  process.exit(1)
}

// Delete existing non-system collections in reverse dependency order
console.log('Cleaning up existing collections...')
try {
  const collections = await pb.collections.getFullList()

  // Delete order: junction tables → collections with FKs → base collections
  const deleteOrder = [
    'profiles_tags',
    'hardening_profiles_tags',
    'validation_to_hardening', // Junction tables first
    'profiles',
    'hardening_profiles',
    'tools',
    'teams', // Collections with FKs
    'tags',
    'organizations',
    'technologies',
    'standards',
    'capabilities', // Base collections last
  ]

  for (const collName of deleteOrder) {
    const coll = collections.find(c => c.name === collName)
    if (coll && !coll.name.startsWith('_')) {
      try {
        await pb.collections.delete(coll.id)
        console.log(`  ✓ Deleted ${coll.name}`)
      }
      catch (e: any) {
        console.log(`  ⚠️  Could not delete ${coll.name}: ${e.message}`)
      }
    }
  }
}
catch (e: any) {
  console.log(`  ⚠️  Cleanup warning: ${e.message}`)
}

console.log(`\n${'='.repeat(60)}`)
console.log('PHASE 1: Creating base collections (no FKs)')
console.log(`${'='.repeat(60)}\n`)

const collectionIds: Record<string, string> = {}

// 1. Tags
console.log('Creating tags collection...')
const tagsCollection = await pb.collections.create({
  name: 'tags',
  type: 'base',
  fields: [
    { name: 'tag_id', type: 'text', required: true },
    { name: 'description', type: 'text', required: false },
    { name: 'category', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.tags = tagsCollection.id
console.log(`  ✓ tags (ID: ${tagsCollection.id})`)

// 2. Organizations
console.log('Creating organizations collection...')
const orgCollection = await pb.collections.create({
  name: 'organizations',
  type: 'base',
  fields: [
    { name: 'org_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'description', type: 'text', required: false },
    { name: 'website', type: 'text', required: false },
    { name: 'logo', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.organizations = orgCollection.id
console.log(`  ✓ organizations (ID: ${orgCollection.id})`)

// 3. Technologies
console.log('Creating technologies collection...')
const techCollection = await pb.collections.create({
  name: 'technologies',
  type: 'base',
  fields: [
    { name: 'tech_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'description', type: 'text', required: false },
    { name: 'website', type: 'text', required: false },
    { name: 'logo', type: 'text', required: false },
    { name: 'category', type: 'text', required: false },
    { name: 'type', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.technologies = techCollection.id
console.log(`  ✓ technologies (ID: ${techCollection.id})`)

// 4. Standards
console.log('Creating standards collection...')
const standardsCollection = await pb.collections.create({
  name: 'standards',
  type: 'base',
  fields: [
    { name: 'standard_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'description', type: 'text', required: false },
    { name: 'website', type: 'text', required: false },
    { name: 'type', type: 'text', required: false },
    { name: 'category', type: 'text', required: false },
    { name: 'vendor', type: 'text', required: false },
    { name: 'version', type: 'text', required: false },
    { name: 'logo', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.standards = standardsCollection.id
console.log(`  ✓ standards (ID: ${standardsCollection.id})`)

// 5. Capabilities
console.log('Creating capabilities collection...')
const capabilitiesCollection = await pb.collections.create({
  name: 'capabilities',
  type: 'base',
  fields: [
    { name: 'capability_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'description', type: 'text', required: false },
    { name: 'category', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.capabilities = capabilitiesCollection.id
console.log(`  ✓ capabilities (ID: ${capabilitiesCollection.id})`)

console.log(`\n${'='.repeat(60)}`)
console.log('PHASE 2: Creating collections with FK relations')
console.log(`${'='.repeat(60)}\n`)

// 6. Teams (FK: organization)
console.log('Creating teams collection...')
const teamsCollection = await pb.collections.create({
  name: 'teams',
  type: 'base',
  fields: [
    { name: 'team_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'description', type: 'text', required: false },
    {
      name: 'organization',
      type: 'relation',
      required: false,
      collectionId: collectionIds.organizations,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.teams = teamsCollection.id
console.log(`  ✓ teams (ID: ${teamsCollection.id})`)

// 7. Profiles (FKs: technology, organization, team, standard)
console.log('Creating profiles collection...')
const profilesCollection = await pb.collections.create({
  name: 'profiles',
  type: 'base',
  fields: [
    { name: 'profile_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'version', type: 'text', required: false },
    { name: 'platform', type: 'text', required: false },
    { name: 'framework', type: 'text', required: false },
    {
      name: 'technology',
      type: 'relation',
      required: false,
      collectionId: collectionIds.technologies,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'vendor', type: 'text', required: false },
    {
      name: 'organization',
      type: 'relation',
      required: false,
      collectionId: collectionIds.organizations,
      cascadeDelete: false,
      maxSelect: 1,
    },
    {
      name: 'team',
      type: 'relation',
      required: false,
      collectionId: collectionIds.teams,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'github', type: 'text', required: false },
    { name: 'details', type: 'text', required: false },
    {
      name: 'standard',
      type: 'relation',
      required: false,
      collectionId: collectionIds.standards,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'standard_version', type: 'text', required: false },
    { name: 'short_description', type: 'text', required: false },
    { name: 'requirements', type: 'text', required: false },
    { name: 'category', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.profiles = profilesCollection.id
console.log(`  ✓ profiles (ID: ${profilesCollection.id})`)

// 8. Hardening Profiles (FKs: technology, organization, team, standard)
console.log('Creating hardening_profiles collection...')
const hardeningCollection = await pb.collections.create({
  name: 'hardening_profiles',
  type: 'base',
  fields: [
    { name: 'hardening_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'version', type: 'text', required: false },
    { name: 'platform', type: 'text', required: false },
    { name: 'type', type: 'text', required: false },
    {
      name: 'technology',
      type: 'relation',
      required: false,
      collectionId: collectionIds.technologies,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'vendor', type: 'text', required: false },
    {
      name: 'organization',
      type: 'relation',
      required: false,
      collectionId: collectionIds.organizations,
      cascadeDelete: false,
      maxSelect: 1,
    },
    {
      name: 'team',
      type: 'relation',
      required: false,
      collectionId: collectionIds.teams,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'github', type: 'text', required: false },
    { name: 'details', type: 'text', required: false },
    {
      name: 'standard',
      type: 'relation',
      required: false,
      collectionId: collectionIds.standards,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'standard_version', type: 'text', required: false },
    { name: 'short_description', type: 'text', required: false },
    { name: 'requirements', type: 'text', required: false },
    { name: 'category', type: 'text', required: false },
    { name: 'difficulty', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.hardening_profiles = hardeningCollection.id
console.log(`  ✓ hardening_profiles (ID: ${hardeningCollection.id})`)

// 9. Tools (FKs: technology, organization)
console.log('Creating tools collection...')
const toolsCollection = await pb.collections.create({
  name: 'tools',
  type: 'base',
  fields: [
    { name: 'tool_id', type: 'text', required: true },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'version', type: 'text', required: false },
    { name: 'description', type: 'text', required: false },
    { name: 'website', type: 'text', required: false },
    { name: 'logo', type: 'text', required: false },
    {
      name: 'technology',
      type: 'relation',
      required: false,
      collectionId: collectionIds.technologies,
      cascadeDelete: false,
      maxSelect: 1,
    },
    {
      name: 'organization',
      type: 'relation',
      required: false,
      collectionId: collectionIds.organizations,
      cascadeDelete: false,
      maxSelect: 1,
    },
    { name: 'github', type: 'text', required: false },
    { name: 'category', type: 'text', required: false },
    { name: 'status', type: 'text', required: false },
  ],
})
collectionIds.tools = toolsCollection.id
console.log(`  ✓ tools (ID: ${toolsCollection.id})`)

console.log(`\n${'='.repeat(60)}`)
console.log('PHASE 3: Creating junction tables (many-to-many)')
console.log(`${'='.repeat(60)}\n`)

// 10. Profiles Tags Junction Table
console.log('Creating profiles_tags junction table...')
const profilesTagsCollection = await pb.collections.create({
  name: 'profiles_tags',
  type: 'base',
  fields: [
    {
      name: 'profile_id',
      type: 'relation',
      required: true,
      collectionId: collectionIds.profiles,
      cascadeDelete: true,
      maxSelect: 1,
    },
    {
      name: 'tag_id',
      type: 'relation',
      required: true,
      collectionId: collectionIds.tags,
      cascadeDelete: true,
      maxSelect: 1,
    },
  ],
})
console.log(`  ✓ profiles_tags (ID: ${profilesTagsCollection.id})`)

// 11. Hardening Profiles Tags Junction Table
console.log('Creating hardening_profiles_tags junction table...')
const hardeningTagsCollection = await pb.collections.create({
  name: 'hardening_profiles_tags',
  type: 'base',
  fields: [
    {
      name: 'hardening_profile_id',
      type: 'relation',
      required: true,
      collectionId: collectionIds.hardening_profiles,
      cascadeDelete: true,
      maxSelect: 1,
    },
    {
      name: 'tag_id',
      type: 'relation',
      required: true,
      collectionId: collectionIds.tags,
      cascadeDelete: true,
      maxSelect: 1,
    },
  ],
})
console.log(`  ✓ hardening_profiles_tags (ID: ${hardeningTagsCollection.id})`)

// 12. Validation to Hardening Junction Table
console.log('Creating validation_to_hardening junction table...')
const validationHardeningCollection = await pb.collections.create({
  name: 'validation_to_hardening',
  type: 'base',
  fields: [
    {
      name: 'validation_profile_id',
      type: 'relation',
      required: true,
      collectionId: collectionIds.profiles,
      cascadeDelete: true,
      maxSelect: 1,
    },
    {
      name: 'hardening_profile_id',
      type: 'relation',
      required: true,
      collectionId: collectionIds.hardening_profiles,
      cascadeDelete: true,
      maxSelect: 1,
    },
  ],
})
console.log(`  ✓ validation_to_hardening (ID: ${validationHardeningCollection.id})`)

console.log(`\n${'='.repeat(60)}`)
console.log('✅ SUCCESS! All 12 collections created')
console.log('='.repeat(60))
console.log('\nVerify in Pocketbase UI: http://localhost:8090/_/')
console.log('\nCollections created:')
console.log('  Base: tags, organizations, technologies, standards, capabilities')
console.log('  With FKs: teams, profiles, hardening_profiles, tools')
console.log('  Junction: profiles_tags, hardening_profiles_tags, validation_to_hardening')
console.log(`${'='.repeat(60)}\n`)
