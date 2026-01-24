#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

const profiles = await pb.collection('profiles').getFullList()

const keyProfiles = [
  'Red Hat 8 STIG',
  'Windows 2019 STIG',
  'VMware ESXI 6.7 STIG',
  'Oracle MySQL 8.0 STIG',
  'Docker CE CIS',
  'AWS RDS MySQL 5.7 CIS',
  'GCP CIS Benchmark',
]

console.log('Key Profile Verification:\n')
keyProfiles.forEach((name) => {
  const profile = profiles.find(p => p.name === name)
  if (profile) {
    console.log(`${profile.name}`)
    console.log(`  target_type: ${profile.target_type}`)
    console.log(`  target_subtype: ${profile.target_subtype}`)
    console.log(`  os_family: ${profile.os_family}`)
    console.log(`  category: ${profile.category}`)
    console.log(`  vendor: ${profile.vendor}`)
    console.log('')
  }
  else {
    console.log(`⚠️  Profile not found: ${name}\n`)
  }
})
