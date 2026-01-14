#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

const profiles = await pb.collection('profiles').getFullList({ sort: 'name' })

console.log('First 15 transformed profiles:\n')
profiles.slice(0, 15).forEach(p => {
  console.log(`${p.name}`)
  console.log(`  target_type: ${p.target_type}`)
  console.log(`  target_subtype: ${p.target_subtype}`)
  console.log(`  os_family: ${p.os_family}`)
  console.log(`  category: ${p.category}`)
  console.log(`  vendor: ${p.vendor}`)
  console.log(`  maintainer: ${p.profile_maintainer}`)
  console.log('')
})
