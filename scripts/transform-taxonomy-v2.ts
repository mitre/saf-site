#!/usr/bin/env tsx
/**
 * Transform taxonomy data v2 - Using agreed 8 Target Types
 *
 * Target Types:
 * 1. Operating System (subtypes: Linux, Windows)
 * 2. Database (subtypes: SQL Server, MySQL, PostgreSQL, Oracle, MongoDB)
 * 3. Web Server (subtypes: Apache, NGINX, IIS)
 * 4. Application Runtime (subtypes: Tomcat, Java, JBoss)
 * 5. Container (subtypes: Docker, Kubernetes, K3s)
 * 6. Virtualization (subtypes: Hypervisor, Management, VM, Networking, Cloud Management, VDI, Identity)
 * 7. Cloud Service (subtypes: Infrastructure, Database, Storage, Container)
 * 8. Utility (subtypes: Security Tool, DevOps)
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
console.log('✓ Authenticated\n')

interface Rule {
  pattern: RegExp
  target_type: string
  target_subtype: string
  os_family: string
  category: string
  vendor: string
  profile_maintainer: string
}

const rules: Rule[] = [
  // ============================================================
  // OPERATING SYSTEM
  // ============================================================
  {
    pattern: /Red Hat [678] STIG/i,
    target_type: 'Operating System',
    target_subtype: 'Linux',
    os_family: 'Linux',
    category: 'Operating Systems',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Ubuntu/i,
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
  {
    pattern: /Windows/i,
    target_type: 'Operating System',
    target_subtype: 'Windows',
    os_family: 'Windows',
    category: 'Operating Systems',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },

  // ============================================================
  // CLOUD SERVICE (must come before Database to catch AWS RDS)
  // ============================================================
  {
    pattern: /AWS RDS/i,
    target_type: 'Cloud Service',
    target_subtype: 'Database',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /AWS MSQL/i,
    target_type: 'Cloud Service',
    target_subtype: 'Database',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /AWS S3/i,
    target_type: 'Cloud Service',
    target_subtype: 'Storage',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /AWS CIS/i,
    target_type: 'Cloud Service',
    target_subtype: 'Infrastructure',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /GKE/i,
    target_type: 'Cloud Service',
    target_subtype: 'Container',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Google',
    profile_maintainer: 'Google'
  },
  {
    pattern: /GCP/i,
    target_type: 'Cloud Service',
    target_subtype: 'Infrastructure',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Google',
    profile_maintainer: 'Google'
  },
  {
    pattern: /Azure/i,
    target_type: 'Cloud Service',
    target_subtype: 'Infrastructure',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },

  // ============================================================
  // DATABASE
  // ============================================================
  {
    pattern: /MSQL 2014/i,
    target_type: 'Database',
    target_subtype: 'SQL Server',
    os_family: 'Windows',
    category: 'Databases',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /MongoDB/i,
    target_type: 'Database',
    target_subtype: 'MongoDB',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'MongoDB',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Oracle Database/i,
    target_type: 'Database',
    target_subtype: 'Oracle',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /MySQL/i,
    target_type: 'Database',
    target_subtype: 'MySQL',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /PostgreSQL/i,
    target_type: 'Database',
    target_subtype: 'PostgreSQL',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },

  // ============================================================
  // WEB SERVER
  // ============================================================
  {
    pattern: /Apache.*(Server|Site|HTTP)/i,
    target_type: 'Web Server',
    target_subtype: 'Apache',
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
  {
    pattern: /NGINX/i,
    target_type: 'Web Server',
    target_subtype: 'NGINX',
    os_family: 'Cross-Platform',
    category: 'Web Infrastructure',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },

  // ============================================================
  // APPLICATION RUNTIME (must come before Red Hat to catch JBoss)
  // ============================================================
  {
    pattern: /JBoss/i,
    target_type: 'Application Runtime',
    target_subtype: 'JBoss',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Tomcat/i,
    target_type: 'Application Runtime',
    target_subtype: 'Tomcat',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /JRE/i,
    target_type: 'Application Runtime',
    target_subtype: 'Java',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },

  // ============================================================
  // CONTAINER
  // ============================================================
  {
    pattern: /Docker/i,
    target_type: 'Container',
    target_subtype: 'Docker',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'Docker',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /K3s/i,
    target_type: 'Container',
    target_subtype: 'K3s',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'SUSE',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Kubernetes/i,
    target_type: 'Container',
    target_subtype: 'Kubernetes',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'CNCF',
    profile_maintainer: 'MITRE SAF'
  },

  // ============================================================
  // VIRTUALIZATION
  // ============================================================
  {
    pattern: /VMware ESXi/i,
    target_type: 'Virtualization',
    target_subtype: 'Hypervisor',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware vSphere VM/i,
    target_type: 'Virtualization',
    target_subtype: 'VM',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware (VCSA|vCenter|vSphere)/i,
    target_type: 'Virtualization',
    target_subtype: 'Management',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware NSX/i,
    target_type: 'Virtualization',
    target_subtype: 'Networking',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware (Aria|Cloud Director|Cloud Foundation)/i,
    target_type: 'Virtualization',
    target_subtype: 'Cloud Management',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware Horizon/i,
    target_type: 'Virtualization',
    target_subtype: 'VDI',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware Identity Manager/i,
    target_type: 'Virtualization',
    target_subtype: 'Identity',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },

  // ============================================================
  // UTILITY
  // ============================================================
  {
    pattern: /GitHub/i,
    target_type: 'Utility',
    target_subtype: 'DevOps',
    os_family: 'Cloud-Native',
    category: 'Utility',
    vendor: 'GitHub',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Red Hat CVE/i,
    target_type: 'Utility',
    target_subtype: 'Security Tool',
    os_family: 'Linux',
    category: 'Utility',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  }
]

// Transform profiles
async function transformCollection(name: string) {
  console.log(`\nTransforming ${name}...`)
  const records = await pb.collection(name).getFullList({ sort: 'name' })

  let matched = 0
  let unmatched = 0
  const unmatchedList: string[] = []

  for (const record of records) {
    const rule = rules.find(r => r.pattern.test(record.name))

    if (rule) {
      await pb.collection(name).update(record.id, {
        target_type: rule.target_type,
        target_subtype: rule.target_subtype,
        os_family: rule.os_family,
        category: rule.category,
        vendor: rule.vendor,
        profile_maintainer: rule.profile_maintainer
      })
      matched++
      console.log(`  ✓ ${record.name} → ${rule.target_type} / ${rule.target_subtype}`)
    } else {
      unmatched++
      unmatchedList.push(record.name)
      console.log(`  ✗ ${record.name} (NO MATCH)`)
    }
  }

  console.log(`\n  Summary: ${matched} matched, ${unmatched} unmatched`)
  if (unmatchedList.length > 0) {
    console.log('  Unmatched:')
    unmatchedList.forEach(n => console.log(`    - ${n}`))
  }

  return { matched, unmatched }
}

console.log('='.repeat(70))
console.log('TAXONOMY TRANSFORMATION v2 - 8 Target Types')
console.log('='.repeat(70))

const p = await transformCollection('profiles')
const h = await transformCollection('hardening_profiles')

console.log('\n' + '='.repeat(70))
console.log('FINAL RESULTS')
console.log('='.repeat(70))
console.log(`Profiles:          ${p.matched} matched, ${p.unmatched} unmatched`)
console.log(`Hardening:         ${h.matched} matched, ${h.unmatched} unmatched`)
console.log(`Total:             ${p.matched + h.matched} matched, ${p.unmatched + h.unmatched} unmatched`)

if (p.unmatched + h.unmatched > 0) {
  console.log('\n⚠️  Some profiles did not match. Review rules above.')
  process.exit(1)
} else {
  console.log('\n✓ All profiles transformed successfully!')
  process.exit(0)
}
