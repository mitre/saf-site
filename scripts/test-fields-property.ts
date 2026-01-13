#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

console.log('Testing: fields property...')
try {
  const testColl = await pb.collections.create({
    name: 'test_fields',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true }
    ]
  })
  console.log('✓ SUCCESS with fields property')
  console.log(`  Collection ID: ${testColl.id}`)
  console.log(`  Fields:`, testColl.fields)
  await pb.collections.delete(testColl.id)
} catch (e: any) {
  console.log('✗ FAILED:', e.message)
}
