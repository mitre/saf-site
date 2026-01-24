#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

async function listCollections() {
  try {
    await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
    const collections = await pb.collections.getFullList()
    console.log(`Found ${collections.length} collections:\n`)
    collections.forEach(c => console.log(`  - ${c.name} (${c.id})`))
  }
  catch (error) {
    console.error('Error:', error)
  }
}

listCollections()
