#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

async function inspectCollections() {
  try {
    await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
    const collections = await pb.collections.getFullList()

    for (const collection of collections.filter(c => !c.name.startsWith('_'))) {
      console.log(`\n${collection.name}:`)
      console.log(JSON.stringify(collection, null, 2))
    }
  }
  catch (error) {
    console.error('Error:', error)
  }
}

inspectCollections()
