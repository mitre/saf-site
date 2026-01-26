#!/usr/bin/env tsx
/**
 * Create Pocketbase collections from our Drizzle schema
 * Run: pnpm tsx scripts/create-pocketbase-schema.ts
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

const adminEmail = 'admin@localhost.com'
const adminPassword = 'test1234567'

async function createCollections() {
  try {
    // Login as admin
    console.log('Authenticating as admin...')
    await pb.admins.authWithPassword(adminEmail, adminPassword)
    console.log('✓ Authenticated\n')

    console.log('PHASE 1: Creating base collections without relations...\n')

    // 1. Tags
    console.log('Creating tags...')
    await pb.collections.create({
      name: 'tags',
      type: 'base',
      fields: [
        { name: 'description', type: 'text', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, max: 50 },
      ],
    })

    // 2. Organizations
    console.log('Creating organizations...')
    await pb.collections.create({
      name: 'organizations',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'website', type: 'url', required: false },
        { name: 'logo', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    // 3. Teams (without relation initially)
    console.log('Creating teams...')
    await pb.collections.create({
      name: 'teams',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    // 4. Technologies
    console.log('Creating technologies...')
    await pb.collections.create({
      name: 'technologies',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'website', type: 'url', required: false },
        { name: 'logo', type: 'text', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'type', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    // 5. Standards
    console.log('Creating standards...')
    await pb.collections.create({
      name: 'standards',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'website', type: 'url', required: false },
        { name: 'type', type: 'text', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'vendor', type: 'text', required: false },
        { name: 'version', type: 'text', required: false },
        { name: 'logo', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    // 6. Validation Profiles (without relations)
    console.log('Creating profiles...')
    await pb.collections.create({
      name: 'profiles',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'version', type: 'text', required: false },
        { name: 'platform', type: 'text', required: false },
        { name: 'framework', type: 'text', required: false },
        { name: 'vendor', type: 'text', required: false },
        { name: 'github', type: 'url', required: false },
        { name: 'details', type: 'text', required: false },
        { name: 'standard_version', type: 'text', required: false },
        { name: 'short_description', type: 'text', required: false },
        { name: 'requirements', type: 'text', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    // 7. Hardening Profiles (without relations)
    console.log('Creating hardening_profiles...')
    await pb.collections.create({
      name: 'hardening_profiles',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'version', type: 'text', required: false },
        { name: 'platform', type: 'text', required: false },
        { name: 'type', type: 'text', required: false },
        { name: 'vendor', type: 'text', required: false },
        { name: 'github', type: 'url', required: false },
        { name: 'details', type: 'text', required: false },
        { name: 'standard_version', type: 'text', required: false },
        { name: 'short_description', type: 'text', required: false },
        { name: 'requirements', type: 'text', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'difficulty', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    // 8. Tools (without relations)
    console.log('Creating tools...')
    await pb.collections.create({
      name: 'tools',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'version', type: 'text', required: false },
        { name: 'description', type: 'text', required: false },
        { name: 'website', type: 'url', required: false },
        { name: 'logo', type: 'text', required: false },
        { name: 'github', type: 'url', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    // 9. Capabilities
    console.log('Creating capabilities...')
    await pb.collections.create({
      name: 'capabilities',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'status', type: 'text', required: true, options: { max: 50 } },
      ],
    })

    console.log('\n✅ Phase 1 complete! All base collections created.')
    console.log('\nNote: Foreign key relations need to be added manually in the admin UI.')
    console.log('The following relations are needed:')
    console.log('  - teams.organization → organizations')
    console.log('  - profiles.technology → technologies')
    console.log('  - profiles.organization → organizations')
    console.log('  - profiles.team → teams')
    console.log('  - profiles.standard → standards')
    console.log('  - hardening_profiles.technology → technologies')
    console.log('  - hardening_profiles.organization → organizations')
    console.log('  - hardening_profiles.team → teams')
    console.log('  - hardening_profiles.standard → standards')
    console.log('  - tools.technology → technologies')
    console.log('  - tools.organization → organizations')
    console.log('\nRefresh your admin UI at http://localhost:8090/_/')
  }
  catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createCollections()
