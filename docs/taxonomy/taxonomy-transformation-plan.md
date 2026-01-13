# Taxonomy Transformation Implementation Plan

## Overview
Transform 83 security profiles (78 validation + 5 hardening) from inconsistent categorization to clean, logical taxonomy.

**Estimated Time:** 3-4 hours total
- Phase 1: 30 minutes (schema)
- Phase 2: 1.5 hours (data transformation)
- Phase 3: 30 minutes (verification)
- Phase 4: 1 hour (UX updates)

---

## Phase 1: Schema Updates (30 minutes)

### 1.1 Add New Fields to Pocketbase Collections

**profiles table:**
```typescript
// NEW FIELDS TO ADD:
- target_type (text) - "Operating System", "Database", "Web Server", etc.
- target_subtype (text) - "Linux", "MySQL", "Apache", etc.
- os_family (text) - "Linux", "Windows", "Cross-Platform", "Cloud-Native", "N/A"
- profile_maintainer (text) - "MITRE SAF", "VMware", "Google", "Community"

// KEEP EXISTING (will update values):
- category (text) - Update to new cleaner values
- vendor (text) - Update to correct vendors
- platform (text) - Deprecate but keep for backwards compat

// ALREADY HAVE:
- standard (relation) - Links to standards table (STIG, CIS, etc.)
- technology (relation) - Links to technologies table (InSpec, Ansible, etc.)
```

**hardening_profiles table:**
```typescript
// Add same new fields as profiles table
```

### 1.2 Create Pocketbase Migration Script

**File:** `scripts/add-taxonomy-fields.ts`
```typescript
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://localhost:8090')

async function addTaxonomyFields() {
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  
  // Add fields to profiles collection
  // Add fields to hardening_profiles collection
  
  console.log('✓ Schema updated successfully')
}
```

### 1.3 Execute Migration
```bash
cd scripts
tsx add-taxonomy-fields.ts
```

---

## Phase 2: Data Transformation (1.5 hours)

### 2.1 Create Transformation Script

**File:** `scripts/transform-taxonomy-data.ts`

**Strategy:** Pattern matching + manual overrides

```typescript
interface TransformationRule {
  pattern: RegExp | string
  target_type: string
  target_subtype: string
  os_family: string
  category: string
  vendor?: string
  profile_maintainer?: string
}

const transformationRules: TransformationRule[] = [
  // Operating Systems - Linux
  {
    pattern: /Red Hat [678]/,
    target_type: 'Operating System',
    target_subtype: 'Linux',
    os_family: 'Linux',
    category: 'Operating Systems',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Ubuntu (16\.04|20\.04)/,
    target_type: 'Operating System',
    target_subtype: 'Linux',
    os_family: 'Linux',
    category: 'Operating Systems',
    vendor: 'Canonical',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /VMware Photon OS/,
    target_type: 'Operating System',
    target_subtype: 'Linux',
    os_family: 'Linux',
    category: 'Operating Systems',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  
  // Operating Systems - Windows
  {
    pattern: /Windows (10|2012|2016|2019)/,
    target_type: 'Operating System',
    target_subtype: 'Windows',
    os_family: 'Windows',
    category: 'Operating Systems',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Databases - SQL Server
  {
    pattern: /MSQL 2014|SQL Server/,
    target_type: 'Database',
    target_subtype: 'SQL Server',
    os_family: 'Windows',
    category: 'Databases',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Databases - MySQL
  {
    pattern: /MySQL/,
    target_type: 'Database',
    target_subtype: 'MySQL',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Databases - PostgreSQL
  {
    pattern: /PostgreSQL/,
    target_type: 'Database',
    target_subtype: 'PostgreSQL',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Databases - Oracle
  {
    pattern: /Oracle Database/,
    target_type: 'Database',
    target_subtype: 'Oracle Database',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Databases - MongoDB
  {
    pattern: /MongoDB/,
    target_type: 'Database',
    target_subtype: 'MongoDB',
    os_family: 'Cross-Platform',
    category: 'Databases',
    vendor: 'MongoDB',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Web Servers
  {
    pattern: /Apache (HTTP )?Server/,
    target_type: 'Web Server',
    target_subtype: 'Apache',
    os_family: 'Cross-Platform',
    category: 'Web Infrastructure',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /NGINX/,
    target_type: 'Web Server',
    target_subtype: 'NGINX',
    os_family: 'Cross-Platform',
    category: 'Web Infrastructure',
    vendor: 'Open Source',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /IIS/,
    target_type: 'Web Server',
    target_subtype: 'IIS',
    os_family: 'Windows',
    category: 'Web Infrastructure',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Application Servers
  {
    pattern: /Tomcat/,
    target_type: 'Application Server',
    target_subtype: 'Tomcat',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Apache Software Foundation',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /JBoss/,
    target_type: 'Application Server',
    target_subtype: 'JBoss',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Runtime Environments
  {
    pattern: /JRE [78]/,
    target_type: 'Runtime Environment',
    target_subtype: 'Java',
    os_family: 'Cross-Platform',
    category: 'Application Platforms',
    vendor: 'Oracle',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Containers
  {
    pattern: /Docker/,
    target_type: 'Container',
    target_subtype: 'Docker',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'Docker',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /Kubernetes|K3s/,
    target_type: 'Container Orchestration',
    target_subtype: 'Kubernetes',
    os_family: 'Cross-Platform',
    category: 'Container Platforms',
    vendor: 'CNCF',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Virtualization - VMware
  {
    pattern: /VMware ESXi/,
    target_type: 'Hypervisor',
    target_subtype: 'ESXi',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware vSphere(?! VM)/,
    target_type: 'Virtualization Management',
    target_subtype: 'vSphere',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware VCSA|vCenter/,
    target_type: 'Virtualization Management',
    target_subtype: 'vCenter',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware vSphere VM/,
    target_type: 'Virtual Machine',
    target_subtype: 'vSphere VM',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware NSX/,
    target_type: 'Network Virtualization',
    target_subtype: 'NSX',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware (Aria|Cloud Foundation|Cloud Director)/,
    target_type: 'Cloud Management',
    target_subtype: 'VMware Cloud',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware Horizon/,
    target_type: 'VDI',
    target_subtype: 'Horizon',
    os_family: 'N/A',
    category: 'Virtualization',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  {
    pattern: /VMware Identity Manager/,
    target_type: 'Identity Management',
    target_subtype: 'vIDM',
    os_family: 'N/A',
    category: 'Security & Identity',
    vendor: 'VMware',
    profile_maintainer: 'VMware'
  },
  
  // Cloud Services - AWS
  {
    pattern: /AWS.*RDS/,
    target_type: 'Cloud Database Service',
    target_subtype: 'RDS',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /AWS.*S3/,
    target_type: 'Cloud Storage Service',
    target_subtype: 'S3',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  {
    pattern: /AWS CIS/,
    target_type: 'Cloud Platform',
    target_subtype: 'AWS',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'AWS',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Cloud Services - GCP
  {
    pattern: /GCP|Google Cloud/,
    target_type: 'Cloud Platform',
    target_subtype: 'GCP',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Google',
    profile_maintainer: 'Google'
  },
  {
    pattern: /GKE/,
    target_type: 'Cloud Container Service',
    target_subtype: 'GKE',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Google',
    profile_maintainer: 'Google'
  },
  
  // Cloud Services - Azure
  {
    pattern: /Azure/,
    target_type: 'Cloud Platform',
    target_subtype: 'Azure',
    os_family: 'Cloud-Native',
    category: 'Cloud Infrastructure',
    vendor: 'Microsoft',
    profile_maintainer: 'MITRE SAF'
  },
  
  // DevSecOps
  {
    pattern: /GitHub/,
    target_type: 'DevOps Platform',
    target_subtype: 'GitHub',
    os_family: 'Cloud-Native',
    category: 'Security & Identity',
    vendor: 'GitHub',
    profile_maintainer: 'MITRE SAF'
  },
  
  // Security Tools
  {
    pattern: /Red Hat CVE Scan/,
    target_type: 'Security Tool',
    target_subtype: 'CVE Scanner',
    os_family: 'Linux',
    category: 'Security & Identity',
    vendor: 'Red Hat',
    profile_maintainer: 'MITRE SAF'
  }
]

async function transformData() {
  const pb = new PocketBase('http://localhost:8090')
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  
  const profiles = await pb.collection('profiles').getFullList()
  
  let matched = 0
  let unmatched = 0
  const unmatchedProfiles = []
  
  for (const profile of profiles) {
    let rule = transformationRules.find(r => {
      if (typeof r.pattern === 'string') {
        return profile.name.includes(r.pattern)
      }
      return r.pattern.test(profile.name)
    })
    
    if (rule) {
      await pb.collection('profiles').update(profile.id, {
        target_type: rule.target_type,
        target_subtype: rule.target_subtype,
        os_family: rule.os_family,
        category: rule.category,
        vendor: rule.vendor || profile.vendor,
        profile_maintainer: rule.profile_maintainer || 'MITRE SAF'
      })
      matched++
      console.log(`✓ ${profile.name}`)
    } else {
      unmatched++
      unmatchedProfiles.push(profile.name)
      console.log(`✗ ${profile.name} - NO MATCH`)
    }
  }
  
  console.log(`\n✓ Matched: ${matched}/${profiles.length}`)
  console.log(`✗ Unmatched: ${unmatched}/${profiles.length}`)
  
  if (unmatchedProfiles.length > 0) {
    console.log('\nUnmatched profiles (need manual review):')
    unmatchedProfiles.forEach(name => console.log(`  - ${name}`))
  }
}
```

### 2.2 Execute Transformation
```bash
cd scripts
tsx transform-taxonomy-data.ts
```

### 2.3 Manual Review of Unmatched Profiles
- Open Pocketbase Admin UI: http://localhost:8090/_/
- Filter profiles where target_type is empty
- Manually update 10-20 edge cases
- Focus on AWS RDS variants (need to distinguish database type)

---

## Phase 3: Verification & Export (30 minutes)

### 3.1 Verify Data Quality

**File:** `scripts/verify-taxonomy-transformation.ts`

```typescript
async function verifyTransformation() {
  const pb = new PocketBase('http://localhost:8090')
  await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  
  const profiles = await pb.collection('profiles').getFullList()
  
  // Check coverage
  const withTargetType = profiles.filter(p => p.target_type)
  const withOsFamily = profiles.filter(p => p.os_family)
  const withCategory = profiles.filter(p => p.category)
  
  console.log('Coverage Report:')
  console.log(`  target_type: ${withTargetType.length}/${profiles.length}`)
  console.log(`  os_family: ${withOsFamily.length}/${profiles.length}`)
  console.log(`  category: ${withCategory.length}/${profiles.length}`)
  
  // Check for "Cross Platform" remnants
  const crossPlatform = profiles.filter(p => p.platform === 'Cross Platform')
  console.log(`\n✗ Still marked "Cross Platform": ${crossPlatform.length}`)
  
  // Distribution report
  const targetTypes = {}
  const osFamilies = {}
  profiles.forEach(p => {
    targetTypes[p.target_type] = (targetTypes[p.target_type] || 0) + 1
    osFamilies[p.os_family] = (osFamilies[p.os_family] || 0) + 1
  })
  
  console.log('\nTarget Type Distribution:')
  Object.entries(targetTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })
  
  console.log('\nOS Family Distribution:')
  Object.entries(osFamilies).sort((a, b) => b[1] - a[1]).forEach(([family, count]) => {
    console.log(`  ${family}: ${count}`)
  })
}
```

### 3.2 Export to Git
```bash
cd .pocketbase/pb_data
sqlite-diffable dump data.db diffable/ --all
git add diffable/
git commit -m "data: transform taxonomy to clean structure

- Add target_type, target_subtype, os_family fields
- Update 78 validation profiles with new taxonomy
- Update 5 hardening profiles with new taxonomy
- Fix vendor assignments (Microsoft, VMware, Red Hat, etc.)
- Replace 'Cross Platform' with meaningful categories
- Add profile_maintainer field"
```

---

## Phase 4: UX Updates (1 hour)

### 4.1 Update ProfileFilters Component

**File:** `docs/.vitepress/theme/components/ProfileFilters.vue`

**Changes:**
```typescript
// REMOVE old filters:
- selectedPlatform (replaced by target_type)

// ADD new filters:
- selectedTargetType (Operating System, Database, Web Server, etc.)
- selectedOsFamily (Linux, Windows, Cross-Platform, Cloud-Native)
// Keep: selectedCategory, selectedStandard, selectedVendor, selectedTech, searchQuery

// Update computed properties:
const targetTypes = computed(() => {
  const unique = new Set<string>()
  props.profiles.forEach(p => {
    if (p.target_type) unique.add(p.target_type)
  })
  return Array.from(unique).sort()
})

const osFamilies = computed(() => {
  const unique = new Set<string>()
  props.profiles.forEach(p => {
    if (p.os_family) unique.add(p.os_family)
  })
  return Array.from(unique).sort()
})
```

**Filter Layout (6 dropdowns):**
```
Row 1: Standard | Category | OS Family
Row 2: Target Type | Vendor | Search
```

### 4.2 Update Data Loader

**File:** `docs/.vitepress/loaders/profiles.data.ts`

**Changes:**
```typescript
export interface Profile {
  id: string
  slug: string
  name: string
  description?: string
  
  // NEW TAXONOMY FIELDS
  target_type?: string
  target_subtype?: string
  os_family?: string
  profile_maintainer?: string
  
  // UPDATED FIELDS
  category?: string
  vendor?: string
  
  // KEEP EXISTING
  version?: string
  framework?: string
  technology?: string
  technology_name?: string
  organization?: string
  organization_name?: string
  team?: string
  team_name?: string
  standard?: string
  standard_name?: string
  standard_version?: string
  github_url?: string
  requirements?: string
  status?: string
  
  // DEPRECATED (keep for backwards compat)
  platform?: string
}

// Update transformation in loader:
const profiles: Profile[] = records.map(record => ({
  // ... existing fields ...
  target_type: record.target_type,
  target_subtype: record.target_subtype,
  os_family: record.os_family,
  profile_maintainer: record.profile_maintainer,
  // ... rest of mapping ...
}))
```

### 4.3 Update Profile Cards

**File:** `docs/.vitepress/theme/components/ProfileCard.vue`

**Changes:**
```vue
<template>
  <div class="profile-card">
    <h3>{{ profile.name }}</h3>
    
    <!-- NEW: Show taxonomy -->
    <div class="profile-meta">
      <span class="badge" v-if="profile.target_type">
        {{ profile.target_subtype || profile.target_type }}
      </span>
      <span class="badge standard" v-if="profile.standard_name">
        {{ profile.standard_name }}
      </span>
      <span class="badge os-family" v-if="profile.os_family">
        {{ profile.os_family }}
      </span>
    </div>
    
    <p class="description">{{ profile.description }}</p>
    
    <div class="profile-details">
      <span v-if="profile.vendor">Vendor: {{ profile.vendor }}</span>
      <span v-if="profile.version">v{{ profile.version }}</span>
    </div>
  </div>
</template>
```

### 4.4 Update Filtering Logic

**File:** `docs/validate/index.md`

**Changes:**
```typescript
// Filter state
const selectedCategory = ref('all')
const selectedStandard = ref('all')
const selectedTargetType = ref('all')
const selectedOsFamily = ref('all')
const selectedVendor = ref('all')
const selectedTech = ref('all')
const searchQuery = ref('')

// Computed filtered profiles
const filteredProfiles = computed(() => {
  let result = allProfiles
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category === selectedCategory.value)
  }
  
  if (selectedStandard.value !== 'all') {
    result = result.filter(p => p.standard_name === selectedStandard.value)
  }
  
  if (selectedTargetType.value !== 'all') {
    result = result.filter(p => p.target_type === selectedTargetType.value)
  }
  
  if (selectedOsFamily.value !== 'all') {
    result = result.filter(p => p.os_family === selectedOsFamily.value)
  }
  
  if (selectedVendor.value !== 'all') {
    result = result.filter(p => p.vendor === selectedVendor.value)
  }
  
  if (selectedTech.value !== 'all') {
    const techName = p.technology_name || p.technology
    result = result.filter(p => techName === selectedTech.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }
  
  return result
})
```

### 4.5 Test in Browser
```bash
pnpm dev
# Open http://localhost:5173/validate/
# Test all 6 filters
# Verify combinations work
# Check profile cards show new taxonomy
```

---

## Phase 5: Documentation & Commit (15 minutes)

### 5.1 Update ARCHITECTURE.md
- Document new taxonomy structure
- Update data model diagrams
- Add field definitions

### 5.2 Update CLAUDE.md
- Update profile metadata structure
- Document new filter fields
- Add examples

### 5.3 Create Migration Guide
**File:** `docs/taxonomy-migration.md`
- Document old vs new structure
- Provide migration notes for contributors
- List deprecated fields

### 5.4 Final Commit
```bash
git add docs/.vitepress/loaders/profiles.data.ts
git add docs/.vitepress/theme/components/ProfileFilters.vue
git add docs/.vitepress/theme/components/ProfileCard.vue
git add docs/validate/index.md
git add ARCHITECTURE.md
git add CLAUDE.md
git commit -m "feat: implement clean taxonomy for security profiles

- Replace 'Cross Platform' with meaningful target types
- Add target_type, target_subtype, os_family fields
- Update filters: Standard, Category, OS Family, Target Type, Vendor
- Fix vendor assignments (Microsoft, VMware, Red Hat, etc.)
- Update profile cards to show new taxonomy
- 56 profiles moved from 'Cross Platform' to specific categories"
git push
```

---

## Success Criteria

✅ **Schema:** All new fields added to both collections
✅ **Data:** 100% of profiles have target_type, os_family, category populated
✅ **Quality:** No more "Cross Platform" as catch-all (only where truly cross-platform)
✅ **Vendor:** Correct vendors assigned (Microsoft for Windows, VMware for VMware, etc.)
✅ **UX:** 6 filters work correctly and combine properly
✅ **Search:** "Show me all Linux STIGs" returns 7 profiles
✅ **Git:** All changes committed and pushed

---

## Rollback Plan

If something goes wrong:
```bash
# Database rollback
cd .pocketbase/pb_data
git checkout HEAD -- diffable/
sqlite-diffable load diffable/ data.db --all
pkill pocketbase
cd ../.. && cd .pocketbase && ./pocketbase serve

# Code rollback
git revert HEAD
```

---

## Next Steps After Completion

1. Apply same taxonomy to hardening_profiles (5 profiles)
2. Create similar taxonomy for tools, apps, etc.
3. Add taxonomy filtering to harden/index.md
4. Consider adding "Related Profiles" based on taxonomy
5. Add taxonomy-based navigation (e.g., "All Linux Profiles" page)

