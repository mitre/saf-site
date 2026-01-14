#!/usr/bin/env tsx
/**
 * Phase 2: Transform taxonomy data for all profiles
 *
 * Uses pattern matching to populate the 4 new taxonomy fields based on profile names.
 * Transforms 78 validation + 5 hardening profiles with 40+ transformation rules.
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

// Authenticate
try {
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  console.log('✓ Authenticated as admin\n')
} catch (e) {
  console.error('❌ Authentication failed:', e)
  process.exit(1)
}

interface TransformationRule {
  pattern: RegExp | string
  target_type: string
  target_subtype: string
  os_family: string
  category: string
  vendor?: string
  profile_maintainer?: string
  description?: string
}

const transformationRules: TransformationRule[] = [
  // Operating Systems - Linux
  {
    pattern: /Red Hat.*[678]/i,
    target_type: 'Operating System',
    target_subtype: 'Linux',
    os_family: 'Linux',
    category: 'Operating Systems',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Ubuntu (16\.04|18\.04|20\.04)/i,
    target_type: 'Operating System',
    target_subtype: 'Linux',
    os_family: 'Linux',
    category: 'Operating Systems',
    vendor: 'Canonical',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /VMware Photon OS/i,
    target_type: 'Operating System',
    target_subtype: 'Linux',
    os_family: 'Linux',
    category: 'Operating Systems',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },

  // Operating Systems - Windows
  {
    pattern: /Windows (10|2012|2016|2019)/i,
    target_type: 'Operating System',
    target_subtype: 'Windows',
    os_family: 'Windows',
    category: 'Operating Systems',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },

  // Cloud Databases - AWS RDS (MUST come before generic DB rules)
  {
    pattern: /AWS.*RDS/i,
    target_type: 'Cloud Database Service',
    target_subtype: 'RDS',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },

  // Databases - SQL Server
  {
    pattern: /MSQL 2014|SQL Server/i,
    target_type: 'Database',
    target_subtype: 'SQL Server',
    os_family: 'Windows',
    category: 'Databases',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },

  // Databases - MySQL
  {
    pattern: /MySQL/i,
    target_type: 'Database',
    target_subtype: 'MySQL',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },

  // Databases - PostgreSQL
  {
    pattern: /PostgreSQL/i,
    target_type: 'Database',
    target_subtype: 'PostgreSQL',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },

  // Databases - Oracle
  {
    pattern: /Oracle Database/i,
    target_type: 'Database',
    target_subtype: 'Oracle Database',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },

  // Databases - MongoDB
  {
    pattern: /MongoDB/i,
    target_type: 'Database',
    target_subtype: 'MongoDB',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'MongoDB',
    profile_maintainer: 'MITRE SAF'
  },

  // Web Servers
  {
    pattern: /Apache (HTTP )?(Server|Site|Web Server)/i,
    target_type: 'Web Server',
    target_subtype: 'Apache',
    os_family: 'Cross-Platform',
    category: 'Web Infrastructure',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /NGINX/i,
    target_type: 'Web Server',
    target_subtype: 'NGINX',
    os_family: 'Cross-Platform',
    category: 'Web Infrastructure',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /IIS/i,
    target_type: 'Web Server',
    target_subtype: 'IIS',
    os_family: 'Windows',
    category: 'Web Infrastructure',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },

  // Application Servers
  {
    pattern: /Tomcat/i,
    target_type: 'Application Server',
    target_subtype: 'Tomcat',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Apache Software Foundation',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /JBoss/i,
    target_type: 'Application Server',
    target_subtype: 'JBoss',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  },

  // Runtime Environments
  {
    pattern: /JRE [78]/i,
    target_type: 'Runtime Environment',
    target_subtype: 'Java',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },

  // Containers - Docker
  {
    pattern: /Docker/i,
    target_type: 'Container',
    target_subtype: 'Docker',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'Docker',
    profile_maintainer: 'MITRE SAF'
  },

  // Containers - Kubernetes
  {
    pattern: /Kubernetes CIS/i,
    target_type: 'Container Orchestration',
    target_subtype: 'Kubernetes',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'CNCF',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Kubernetes/i,
    target_type: 'Container Orchestration',
    target_subtype: 'Kubernetes',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'CNCF',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /K3s/i,
    target_type: 'Container Orchestration',
    target_subtype: 'K3s',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'SUSE',
    profile_maintainer: 'MITRE SAF'
  },

  // Virtualization - VMware (order matters - most specific first)
  {
    pattern: /VMware vSphere VM/i,
    target_type: 'Virtual Machine',
    target_subtype: 'vSphere VM',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware ESXi/i,
    target_type: 'Hypervisor',
    target_subtype: 'ESXi',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware vSphere/i,
    target_type: 'Virtualization Management',
    target_subtype: 'vSphere',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware VCSA|vCenter/i,
    target_type: 'Virtualization Management',
    target_subtype: 'vCenter',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware NSX/i,
    target_type: 'Network Virtualization',
    target_subtype: 'NSX',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware (Aria|Cloud Foundation|Cloud Director)/i,
    target_type: 'Cloud Management',
    target_subtype: 'VMware Cloud',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware Horizon/i,
    target_type: 'VDI',
    target_subtype: 'Horizon',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware Identity Manager/i,
    target_type: 'Identity Management',
    target_subtype: 'vIDM',
    os_family: 'N/A',
    category: 'Security & Identity',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },

  // Cloud Services - AWS (order matters)
  {
    pattern: /AWS.*S3/i,
    target_type: 'Cloud Storage Service',
    target_subtype: 'S3',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /AWS CIS/i,
    target_type: 'Cloud Platform',
    target_subtype: 'AWS',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },

  // Cloud Services - GCP
  {
    pattern: /GCP|Google Cloud/i,
    target_type: 'Cloud Platform',
    target_subtype: 'GCP',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Google',
    profile_maintainer: 'Google'
  },
  {
    pattern: /GKE/i,
    target_type: 'Cloud Container Service',
    target_subtype: 'GKE',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Google',
    profile_maintainer: 'Google'
  },

  // Cloud Services - Azure
  {
    pattern: /Azure/i,
    target_type: 'Cloud Platform',
    target_subtype: 'Azure',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },

  // DevSecOps
  {
    pattern: /GitHub/i,
    target_type: 'DevOps Platform',
    target_subtype: 'GitHub',
    os_family: 'Cloud-Native',
    category: 'Security & Identity',
    vendor: 'GitHub',
    profile_maintainer: 'MITRE SAF'
  },

  // Security Tools
  {
    pattern: /Red Hat CVE Scan/i,
    target_type: 'Security Tool',
    target_subtype: 'CVE Scanner',
    os_family: 'Linux',
    category: 'Security & Identity',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  }
]

async function transformCollection(collectionName: string) {
  console.log(`\nTransforming ${collectionName} collection...`)
  console.log('='.repeat(60))

  const records = await pb.collection(collectionName).getFullList()

  let matched = 0
  let unmatched = 0
  const unmatchedRecords: any[] = []

  for (const record of records) {
    // Find first matching rule
    const rule = transformationRules.find(r => {
      if (typeof r.pattern === 'string') {
        return record.name.includes(r.pattern)
      }
      return r.pattern.test(record.name)
    })

    if (rule) {
      // Apply transformation
      await pb.collection(collectionName).update(record.id, {
        target_type: rule.target_type,
        target_subtype: rule.target_subtype,
        os_family: rule.os_family,
        category: rule.category,
        vendor: rule.vendor || record.vendor,
        profile_maintainer: rule.profile_maintainer || 'MITRE SAF'
      })
      matched++
      console.log(`✓ ${record.name}`)
    } else {
      // No match found
      unmatched++
      unmatchedRecords.push({
        id: record.id,
        name: record.name,
        current_platform: record.platform,
        current_category: record.category,
        current_vendor: record.vendor
      })
      console.log(`⚠️  ${record.name} (no match)`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`Summary for ${collectionName}:`)
  console.log(`  Total records:  ${records.length}`)
  console.log(`  Matched:        ${matched} (${((matched / records.length) * 100).toFixed(1)}%)`)
  console.log(`  Unmatched:      ${unmatched} (${((unmatched / records.length) * 100).toFixed(1)}%)`)

  if (unmatchedRecords.length > 0) {
    console.log('\n⚠️  Unmatched records (require manual review):')
    unmatchedRecords.forEach(r => {
      console.log(`    - ${r.name}`)
      console.log(`      Platform: ${r.current_platform}, Category: ${r.current_category}`)
    })
  }

  return {
    total: records.length,
    matched,
    unmatched,
    unmatchedRecords
  }
}

console.log('='.repeat(60))
console.log('PHASE 2: Data Transformation')
console.log('='.repeat(60))

// Transform both collections
const profilesResult = await transformCollection('profiles')
const hardeningResult = await transformCollection('hardening_profiles')

// Final summary
console.log('\n' + '='.repeat(60))
console.log('FINAL SUMMARY')
console.log('='.repeat(60))
console.log(`\nValidation Profiles:`)
console.log(`  Total:     ${profilesResult.total}`)
console.log(`  Matched:   ${profilesResult.matched}`)
console.log(`  Unmatched: ${profilesResult.unmatched}`)

console.log(`\nHardening Profiles:`)
console.log(`  Total:     ${hardeningResult.total}`)
console.log(`  Matched:   ${hardeningResult.matched}`)
console.log(`  Unmatched: ${hardeningResult.unmatched}`)

console.log(`\nOverall:`)
const totalRecords = profilesResult.total + hardeningResult.total
const totalMatched = profilesResult.matched + hardeningResult.matched
const totalUnmatched = profilesResult.unmatched + hardeningResult.unmatched
console.log(`  Total records:  ${totalRecords}`)
console.log(`  Matched:        ${totalMatched} (${((totalMatched / totalRecords) * 100).toFixed(1)}%)`)
console.log(`  Unmatched:      ${totalUnmatched} (${((totalUnmatched / totalRecords) * 100).toFixed(1)}%)`)

if (totalUnmatched > 0) {
  console.log(`\n⚠️  ${totalUnmatched} records need manual review.`)
  console.log('Next: Review unmatched profiles and add transformation rules or update manually.')
} else {
  console.log('\n✓ All profiles transformed successfully!')
  console.log('Next: Phase 3 - Verification and export')
}

process.exit(totalUnmatched > 0 ? 1 : 0)
