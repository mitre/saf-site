#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

const collections = await pb.collections.getFullList()
const ourCollections = collections.filter(c => !c.name.startsWith('_'))

console.log(`\nCreated collections (${ourCollections.length}):`)
console.log('='.repeat(60))

for (const c of ourCollections) {
  const fieldCount = c.fields?.length || 0
  const relFields = c.fields?.filter(f => f.type === 'relation') || []
  const relCount = relFields.length

  console.log(`\n${c.name}`)
  console.log(`  ID: ${c.id}`)
  console.log(`  Fields: ${fieldCount} total (${relCount} relations)`)

  if (relCount > 0) {
    console.log(`  Relations:`)
    for (const rel of relFields) {
      const targetColl = collections.find(tc => tc.id === rel.collectionId)
      console.log(`    - ${rel.name} → ${targetColl?.name || 'unknown'}`)
    }
  }
}

console.log('\n' + '='.repeat(60))
console.log('✓ Verification complete')
