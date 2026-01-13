#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

// Create base collection first
console.log('1. Creating base collection (organizations)...')
const orgColl = await pb.collections.create({
  name: 'test_organizations',
  type: 'base',
  fields: [
    { name: 'name', type: 'text', required: true }
  ]
})
console.log(`✓ Created: ${orgColl.id}`)

// Test 1: Relation with DIRECT properties (Python SDK pattern)
console.log('\n2. Testing: Relation with DIRECT properties...')
try {
  const profileColl = await pb.collections.create({
    name: 'test_profiles_direct',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true },
      {
        name: 'organization',
        type: 'relation',
        required: false,
        collectionId: orgColl.id,  // DIRECT
        cascadeDelete: false,       // DIRECT
        maxSelect: 1                // DIRECT
      }
    ]
  })
  console.log('✓ SUCCESS with DIRECT properties')
  console.log(`  Collection ID: ${profileColl.id}`)
  const orgField = profileColl.fields?.find(f => f.name === 'organization')
  console.log(`  Relation field:`, orgField)
  await pb.collections.delete(profileColl.id)
} catch (e: any) {
  console.log('✗ FAILED:', e.message)
}

// Cleanup
await pb.collections.delete(orgColl.id)
console.log('\n✓ Cleanup complete')
