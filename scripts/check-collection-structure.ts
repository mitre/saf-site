#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

const collections = await pb.collections.getFullList()
const testColl = collections.find(c => c.name === 'organizations')

if (testColl) {
  console.log('\nRaw collection object for "organizations":')
  console.log(JSON.stringify(testColl, null, 2))
} else {
  console.log('organizations collection not found')
}
