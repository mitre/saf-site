#!/usr/bin/env tsx
/**
 * Delete all Pocketbase collections
 * Run: pnpm tsx scripts/delete-pocketbase-collections.ts
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

const adminEmail = 'admin@localhost.com'
const adminPassword = 'test1234567'

async function deleteAllCollections() {
  try {
    // Login as admin
    console.log('Authenticating as admin...')
    await pb.admins.authWithPassword(adminEmail, adminPassword)
    console.log('✓ Authenticated\n')

    // Get all collections (exclude system collections starting with _)
    const collections = await pb.collections.getFullList()
    const customCollections = collections.filter(c => !c.name.startsWith('_'))
    console.log(`Found ${customCollections.length} custom collections to delete\n`)

    // Delete in reverse order to handle dependencies
    for (const collection of customCollections.reverse()) {
      console.log(`Deleting ${collection.name}...`)
      try {
        await pb.collections.delete(collection.id)
        console.log(`✓ ${collection.name} deleted`)
      } catch (error: any) {
        console.log(`⚠️  Skipping ${collection.name}: ${error.message}`)
      }
    }

    console.log('\n✅ All collections deleted!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

deleteAllCollections()
