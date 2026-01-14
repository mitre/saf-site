#!/usr/bin/env tsx
/**
 * Validate transformation results against taxonomy design
 * Compares actual data against docs/taxonomy/taxonomy-visual.md examples
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')

const profiles = await pb.collection('profiles').getFullList()
const hardening = await pb.collection('hardening_profiles').getFullList()
const all = [...profiles, ...hardening]

console.log('='.repeat(80))
console.log('VALIDATION: Transformation vs Design')
console.log('='.repeat(80))

// Define expected taxonomy according to design docs
const EXPECTED_TARGET_TYPES = [
  'Operating System',
  'Database',
  'Web Server',
  'Application Server',
  'Runtime Environment',
  'Container',
  'Container Orchestration',
  'Virtualization',
  'Cloud Service',
  'Cloud Platform',
  'Security Tool',
  'DevOps Platform'
]

const EXPECTED_OS_FAMILIES = [
  'Linux',
  'Windows',
  'Cross-Platform',
  'Cloud-Native',
  'N/A'
]

const EXPECTED_CATEGORIES = [
  'Operating Systems',
  'Databases',
  'Web Infrastructure',
  'Application Platforms',
  'Container Platforms',
  'Virtualization',
  'Cloud Infrastructure',
  'Security & Identity'
]

// Issues tracker
const issues: Array<{profile: string, issue: string, current: string, expected: string}> = []

// 1. Validate Target Types
console.log('\n1. TARGET TYPE VALIDATION:')
const actualTargetTypes = new Set(all.map(p => p.target_type))
const unexpectedTypes = Array.from(actualTargetTypes).filter(t => !EXPECTED_TARGET_TYPES.includes(t))
if (unexpectedTypes.length > 0) {
  console.log('  ⚠️  Unexpected target types found:')
  unexpectedTypes.forEach(t => {
    const count = all.filter(p => p.target_type === t).length
    console.log(`    - "${t}" (${count} profiles)`)
  })
} else {
  console.log('  ✓ All target types are valid')
}

// 2. Check specific profile examples from design
console.log('\n2. DESIGN EXAMPLE VALIDATION:')

const examples = [
  {
    name: 'Red Hat Enterprise Linux 8 STIG',
    searchName: 'Red Hat 8 STIG',
    expected: {
      target_type: 'Operating System',
      target_subtype: 'Linux',
      os_family: 'Linux',
      category: 'Operating Systems',
      vendor: 'Red Hat'
    }
  },
  {
    name: 'VMware ESXi 6.7 STIG',
    searchName: 'VMware ESXI 6.7 STIG',
    expected: {
      target_type: 'Virtualization',
      target_subtype: 'Hypervisor',
      os_family: 'N/A',
      category: 'Virtualization',
      vendor: 'VMware'
    }
  },
  {
    name: 'Oracle MySQL 8.0 STIG',
    searchName: 'Oracle MySQL 8.0 STIG',
    expected: {
      target_type: 'Database',
      target_subtype: 'MySQL',
      os_family: 'Cross-Platform',
      category: 'Databases',
      vendor: 'Oracle'
    }
  },
  {
    name: 'AWS RDS MySQL 5.7 CIS',
    searchName: 'AWS RDS MySQL 5.7 CIS',
    expected: {
      target_type: 'Cloud Service',
      target_subtype: 'Database',
      os_family: 'Cloud-Native',
      category: 'Cloud Infrastructure',
      vendor: 'AWS'
    }
  },
  {
    name: 'Docker CE CIS',
    searchName: 'Docker CE CIS',
    expected: {
      target_type: 'Container',
      target_subtype: 'Docker',
      os_family: 'Cross-Platform',
      category: 'Container Platforms',
      vendor: 'Docker'
    }
  }
]

examples.forEach(example => {
  const profile = all.find(p => p.name === example.searchName)
  if (!profile) {
    console.log(`  ⚠️  Profile not found: ${example.name}`)
    return
  }

  let hasIssues = false
  const profileIssues: string[] = []

  Object.entries(example.expected).forEach(([field, expectedValue]) => {
    if (profile[field] !== expectedValue) {
      hasIssues = true
      profileIssues.push(`${field}: "${profile[field]}" (expected: "${expectedValue}")`)
      issues.push({
        profile: profile.name,
        issue: field,
        current: profile[field] || 'MISSING',
        expected: expectedValue
      })
    }
  })

  if (hasIssues) {
    console.log(`  ❌ ${profile.name}`)
    profileIssues.forEach(issue => console.log(`     ${issue}`))
  } else {
    console.log(`  ✓ ${profile.name}`)
  }
})

// 3. Check for specific known issues
console.log('\n3. KNOWN ISSUE CHECKS:')

// JBoss should be Application Server
const jboss = all.find(p => p.name.includes('JBoss'))
if (jboss) {
  if (jboss.target_type !== 'Application Server') {
    console.log(`  ❌ ${jboss.name}`)
    console.log(`     target_type: "${jboss.target_type}" (expected: "Application Server")`)
    issues.push({
      profile: jboss.name,
      issue: 'target_type',
      current: jboss.target_type,
      expected: 'Application Server'
    })
  } else {
    console.log(`  ✓ ${jboss.name}`)
  }
}

// vCenter profiles should have target_subtype = vCenter
const vcenterProfiles = all.filter(p => p.name.includes('vCenter'))
vcenterProfiles.forEach(p => {
  if (p.target_subtype !== 'vCenter') {
    console.log(`  ❌ ${p.name}`)
    console.log(`     target_subtype: "${p.target_subtype}" (expected: "vCenter")`)
    issues.push({
      profile: p.name,
      issue: 'target_subtype',
      current: p.target_subtype,
      expected: 'vCenter'
    })
  } else {
    console.log(`  ✓ ${p.name}`)
  }
})

// AWS RDS should be Cloud Service not Cloud Database Service
const awsRdsProfiles = all.filter(p => p.name.includes('AWS RDS'))
awsRdsProfiles.forEach(p => {
  if (p.target_type === 'Cloud Database Service') {
    console.log(`  ❌ ${p.name}`)
    console.log(`     target_type: "${p.target_type}" (expected: "Cloud Service")`)
    console.log(`     target_subtype: "${p.target_subtype}" (expected: "Database")`)
    issues.push({
      profile: p.name,
      issue: 'target_type',
      current: p.target_type,
      expected: 'Cloud Service'
    })
  }
})

// 4. Summary
console.log('\n' + '='.repeat(80))
console.log('SUMMARY')
console.log('='.repeat(80))
console.log(`Total profiles: ${all.length}`)
console.log(`Profiles with issues: ${new Set(issues.map(i => i.profile)).size}`)
console.log(`Total issues found: ${issues.length}`)

if (issues.length > 0) {
  console.log('\nISSUES TO FIX:')
  const byProfile = new Map<string, typeof issues>()
  issues.forEach(issue => {
    if (!byProfile.has(issue.profile)) {
      byProfile.set(issue.profile, [])
    }
    byProfile.get(issue.profile)!.push(issue)
  })

  Array.from(byProfile.entries()).forEach(([profile, profileIssues]) => {
    console.log(`\n  ${profile}:`)
    profileIssues.forEach(issue => {
      console.log(`    ${issue.issue}: "${issue.current}" → "${issue.expected}"`)
    })
  })
}

process.exit(issues.length > 0 ? 1 : 0)
