#!/usr/bin/env tsx
/**
 * Phase 1: Add taxonomy fields to profiles and hardening_profiles collections
 *
 * Adds 4 new fields to support the new taxonomy structure:
 * - target_type: Operating System, Database, Web Server, Container, Virtualization, Cloud Service
 * - target_subtype: Linux, MySQL, Apache, Docker, ESXi, AWS, etc.
 * - os_family: Linux, Windows, Cross-Platform, Cloud-Native, N/A
 * - profile_maintainer: MITRE SAF, VMware, Google, Community
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

// Authenticate
try {
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  console.log('✓ Authenticated as admin\n')
} catch (e) {
  console.error('❌ Authentication failed:', e)
  process.exit(1)
}

// New taxonomy fields to add
const newFields = [
  {
    name: 'target_type',
    type: 'text',
    required: false,
    options: { max: 100 }
  },
  {
    name: 'target_subtype',
    type: 'text',
    required: false,
    options: { max: 100 }
  },
  {
    name: 'os_family',
    type: 'text',
    required: false,
    options: { max: 50 }
  },
  {
    name: 'profile_maintainer',
    type: 'text',
    required: false,
    options: { max: 100 }
  }
]

console.log('='.repeat(60))
console.log('PHASE 1: Adding taxonomy fields to collections')
console.log('='.repeat(60) + '\n')

// Function to add fields to a collection
async function addFieldsToCollection(collectionName: string) {
  try {
    console.log(`Processing ${collectionName} collection...`)

    // Get current collection
    const collections = await pb.collections.getFullList()
    const collection = collections.find(c => c.name === collectionName)

    if (!collection) {
      console.error(`  ❌ Collection '${collectionName}' not found`)
      return false
    }

    console.log(`  ✓ Found collection (ID: ${collection.id})`)

    // Get existing fields
    const existingFields = collection.fields || []
    const existingFieldNames = existingFields.map((f: any) => f.name)

    // Check which fields already exist
    const fieldsToAdd = newFields.filter(field => !existingFieldNames.includes(field.name))
    const existingNewFields = newFields.filter(field => existingFieldNames.includes(field.name))

    if (existingNewFields.length > 0) {
      console.log(`  ℹ️  Fields already exist: ${existingNewFields.map(f => f.name).join(', ')}`)
    }

    if (fieldsToAdd.length === 0) {
      console.log(`  ✓ All taxonomy fields already present\n`)
      return true
    }

    // Merge existing fields with new fields
    const updatedFields = [...existingFields, ...fieldsToAdd]

    // Update collection with new fields
    await pb.collections.update(collection.id, {
      fields: updatedFields
    })

    console.log(`  ✓ Added fields: ${fieldsToAdd.map(f => f.name).join(', ')}`)
    console.log(`  ✓ Total fields: ${updatedFields.length}\n`)

    return true
  } catch (e: any) {
    console.error(`  ❌ Failed to update ${collectionName}:`, e.message)
    return false
  }
}

// Update both collections
console.log('1. Adding taxonomy fields to profiles collection...\n')
const profilesSuccess = await addFieldsToCollection('profiles')

console.log('2. Adding taxonomy fields to hardening_profiles collection...\n')
const hardeningSuccess = await addFieldsToCollection('hardening_profiles')

// Summary
console.log('='.repeat(60))
console.log('SUMMARY')
console.log('='.repeat(60))
console.log(`profiles:           ${profilesSuccess ? '✓ Success' : '❌ Failed'}`)
console.log(`hardening_profiles: ${hardeningSuccess ? '✓ Success' : '❌ Failed'}`)
console.log('')

if (profilesSuccess && hardeningSuccess) {
  console.log('✓ Phase 1 complete! Taxonomy fields added to both collections.')
  console.log('\nNew fields available:')
  console.log('  • target_type      - What is being secured (OS, Database, Web Server, etc.)')
  console.log('  • target_subtype   - Specific technology (Linux, MySQL, Apache, etc.)')
  console.log('  • os_family        - Broad OS category (Linux, Windows, Cross-Platform, etc.)')
  console.log('  • profile_maintainer - Who maintains the profile (MITRE SAF, VMware, etc.)')
  console.log('\nNext: Phase 2 - Data transformation (transform-taxonomy-data.ts)')
  process.exit(0)
} else {
  console.log('❌ Phase 1 failed - please check errors above')
  process.exit(1)
}
