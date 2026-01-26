#!/usr/bin/env tsx
/**
 * Verify taxonomy transformation results
 * Shows sample profiles with new taxonomy fields and distribution statistics
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

// Authenticate
try {
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  console.log('✓ Authenticated as admin\n')
}
catch (e) {
  console.error('❌ Authentication failed:', e)
  process.exit(1)
}

console.log('='.repeat(60))
console.log('TAXONOMY TRANSFORMATION VERIFICATION')
console.log('='.repeat(60))

// Get all profiles
const profiles = await pb.collection('profiles').getFullList()
const hardeningProfiles = await pb.collection('hardening_profiles').getFullList()
const allProfiles = [...profiles, ...hardeningProfiles]

// Check coverage
const withTargetType = allProfiles.filter(p => p.target_type).length
const withOsFamily = allProfiles.filter(p => p.os_family).length
const withMaintainer = allProfiles.filter(p => p.profile_maintainer).length

console.log(`\nCoverage (${allProfiles.length} total profiles):`)
console.log(`  target_type:        ${withTargetType}/${allProfiles.length} (${((withTargetType / allProfiles.length) * 100).toFixed(1)}%)`)
console.log(`  os_family:          ${withOsFamily}/${allProfiles.length} (${((withOsFamily / allProfiles.length) * 100).toFixed(1)}%)`)
console.log(`  profile_maintainer: ${withMaintainer}/${allProfiles.length} (${((withMaintainer / allProfiles.length) * 100).toFixed(1)}%)`)

// Target Type distribution
console.log('\nTarget Type Distribution:')
const targetTypes = new Map<string, number>()
allProfiles.forEach((p) => {
  if (p.target_type) {
    targetTypes.set(p.target_type, (targetTypes.get(p.target_type) || 0) + 1)
  }
})
Array.from(targetTypes.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type.padEnd(30)} ${count}`)
  })

// OS Family distribution
console.log('\nOS Family Distribution:')
const osFamilies = new Map<string, number>()
allProfiles.forEach((p) => {
  if (p.os_family) {
    osFamilies.set(p.os_family, (osFamilies.get(p.os_family) || 0) + 1)
  }
})
Array.from(osFamilies.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([family, count]) => {
    console.log(`  ${family.padEnd(30)} ${count}`)
  })

// Sample profiles from different categories
console.log('\nSample Transformed Profiles:')
console.log('='.repeat(60))

const samples = [
  profiles.find(p => p.name.includes('Red Hat 8')),
  profiles.find(p => p.name.includes('Windows 2019')),
  profiles.find(p => p.name.includes('VMware ESXi')),
  profiles.find(p => p.name.includes('MySQL')),
  profiles.find(p => p.name.includes('AWS CIS')),
].filter(Boolean)

samples.forEach((profile) => {
  if (!profile)
    return
  console.log(`\n${profile.name}`)
  console.log(`  Target Type:        ${profile.target_type || 'N/A'}`)
  console.log(`  Target Subtype:     ${profile.target_subtype || 'N/A'}`)
  console.log(`  OS Family:          ${profile.os_family || 'N/A'}`)
  console.log(`  Category:           ${profile.category || 'N/A'}`)
  console.log(`  Vendor:             ${profile.vendor || 'N/A'}`)
  console.log(`  Profile Maintainer: ${profile.profile_maintainer || 'N/A'}`)
})

console.log(`\n${'='.repeat(60)}`)
if (withTargetType === allProfiles.length && withOsFamily === allProfiles.length) {
  console.log('✓ Transformation complete! All profiles have new taxonomy fields.')
}
else {
  console.log('⚠️  Some profiles missing taxonomy fields. Check transformation rules.')
}
