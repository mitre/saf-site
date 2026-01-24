#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

const profiles = await pb.collection('profiles').getFullList()
const hardening = await pb.collection('hardening_profiles').getFullList()
const all = [...profiles, ...hardening]

console.log('='.repeat(80))
console.log('TAXONOMY ANALYSIS: Design vs Reality')
console.log('='.repeat(80))

// 1. Target Type distribution
console.log('\n1. TARGET TYPES (what we got):')
const targetTypes = new Map<string, number>()
all.forEach((p) => {
  if (p.target_type) {
    targetTypes.set(p.target_type, (targetTypes.get(p.target_type) || 0) + 1)
  }
})
Array.from(targetTypes.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type.padEnd(30)} ${count}`)
  })

// 2. OS Family distribution
console.log('\n2. OS FAMILY (what we got):')
const osFamilies = new Map<string, number>()
all.forEach((p) => {
  if (p.os_family) {
    osFamilies.set(p.os_family, (osFamilies.get(p.os_family) || 0) + 1)
  }
})
Array.from(osFamilies.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([family, count]) => {
    console.log(`  ${family.padEnd(30)} ${count}`)
  })

// 3. Category distribution
console.log('\n3. CATEGORIES (what we got):')
const categories = new Map<string, number>()
all.forEach((p) => {
  if (p.category) {
    categories.set(p.category, (categories.get(p.category) || 0) + 1)
  }
})
Array.from(categories.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(30)} ${count}`)
  })

// 4. Issues to review
console.log('\n4. POTENTIAL ISSUES:')

// Find duplicates
const nameCount = new Map<string, number>()
all.forEach((p) => {
  nameCount.set(p.name, (nameCount.get(p.name) || 0) + 1)
})
const duplicates = Array.from(nameCount.entries()).filter(([_, count]) => count > 1)
if (duplicates.length > 0) {
  console.log('\n  DUPLICATES:')
  duplicates.forEach(([name, count]) => {
    console.log(`    - ${name} (${count} entries)`)
  })
}

// Find potential miscategorizations
console.log('\n  POTENTIAL MISCATEGORIZATIONS:')
all.forEach((p) => {
  // JBoss should be Application Server not OS
  if (p.name.includes('JBoss') && p.target_type === 'Operating System') {
    console.log(`    - ${p.name}: target_type="${p.target_type}" (should be "Application Server"?)`)
  }

  // vCenter variations
  if (p.name.includes('vCenter') && p.target_subtype === 'vSphere') {
    console.log(`    - ${p.name}: target_subtype="${p.target_subtype}" (should be "vCenter"?)`)
  }
})

console.log(`\n${'='.repeat(80)}`)
