#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

console.log('Verifying import...\n')

// Check record counts
const tags = await pb.collection('tags').getFullList()
const orgs = await pb.collection('organizations').getFullList()
const techs = await pb.collection('technologies').getFullList()
const standards = await pb.collection('standards').getFullList()
const teams = await pb.collection('teams').getFullList()
const profiles = await pb.collection('profiles').getFullList()
const hardeningProfiles = await pb.collection('hardening_profiles').getFullList()
const tools = await pb.collection('tools').getFullList()

console.log('Record counts:')
console.log(`  Tags: ${tags.length}`)
console.log(`  Organizations: ${orgs.length}`)
console.log(`  Technologies: ${techs.length}`)
console.log(`  Standards: ${standards.length}`)
console.log(`  Teams: ${teams.length}`)
console.log(`  Validation Profiles: ${profiles.length}`)
console.log(`  Hardening Profiles: ${hardeningProfiles.length}`)
console.log(`  Tools: ${tools.length}`)

// Check a sample profile with FK expansion
console.log('\nSample profile with FK expansion:')
const sampleProfile = await pb.collection('profiles').getFirstListItem('', {
  expand: 'organization,team,technology,standard'
})
console.log(`  Name: ${sampleProfile.name}`)
console.log(`  Organization: ${(sampleProfile.expand?.organization as any)?.name}`)
console.log(`  Team: ${(sampleProfile.expand?.team as any)?.name}`)
console.log(`  Technology: ${(sampleProfile.expand?.technology as any)?.name}`)
console.log(`  Standard: ${(sampleProfile.expand?.standard as any)?.name}`)

console.log('\n✓ Verification complete')
