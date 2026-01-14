#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

const profiles = await pb.collection('profiles').getFullList({ sort: 'category,name' })
const hardening = await pb.collection('hardening_profiles').getFullList({ sort: 'category,name' })

console.log('='.repeat(80))
console.log('COMPLETE TAXONOMY TRANSFORMATION REVIEW')
console.log('='.repeat(80))

// Group by category
const byCategory = new Map<string, any[]>()

;[...profiles, ...hardening].forEach(p => {
  const category = p.category || 'UNCATEGORIZED'
  if (!byCategory.has(category)) {
    byCategory.set(category, [])
  }
  byCategory.get(category)!.push(p)
})

// Sort categories
const sortedCategories = Array.from(byCategory.keys()).sort()

sortedCategories.forEach(category => {
  const items = byCategory.get(category)!
  console.log(`\n${'='.repeat(80)}`)
  console.log(`CATEGORY: ${category} (${items.length} profiles)`)
  console.log('='.repeat(80))

  items.forEach(p => {
    console.log(`\n${p.name}`)
    console.log(`  Target Type:    ${p.target_type || 'MISSING'}`)
    console.log(`  Target Subtype: ${p.target_subtype || 'MISSING'}`)
    console.log(`  OS Family:      ${p.os_family || 'MISSING'}`)
    console.log(`  Vendor:         ${p.vendor || 'MISSING'}`)
    console.log(`  Maintainer:     ${p.profile_maintainer || 'MISSING'}`)
  })
})

console.log(`\n${'='.repeat(80)}`)
console.log(`TOTAL: ${profiles.length + hardening.length} profiles`)
console.log('='.repeat(80))
