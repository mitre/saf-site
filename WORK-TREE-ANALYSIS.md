# Work Tree Analysis & Data Structure

## Current Work Tree (13 Issues)

### P0 - Critical Path (3 issues)
- ✅ **Browse page pattern documented** (DONE)
- ✅ **Component library decision** (DONE - Reka UI)
- ⏳ **Create home page layout** - Next to implement

**Blocked by:**
- Home page blocks Core Layouts epic

### P1 - High Priority (7 issues)

**Content Infrastructure:**
1. **Implement dynamic routes** - Profile detail pages
2. **Expand data loaders** - Hardening, standards, frameworks
3. **Set up asset directory** - Logos, icons, badges

**Layout Pages:**
4. **Framework page layout** - Documentation with sidebar
5. **Apps showcase layout** - SAF tools/applications
6. **Browse Pages epic** - More browse pages (hardening, standards)
7. **Content Migration epic** - Copy YAML from saf-site-v4

**Dependencies:**
- Content Migration blocked by: dynamic routes + data loaders
- Core Layouts blocked by: home + framework + apps + assets

### P2-P3 - Future Work (3 issues)
- **Core Pages epic** - About, getting started, team, etc.
- **Production Evaluation epic** - Build performance, bundle size, deployment

---

## What's Missing from the Work Tree?

### 1. ⚠️ Missing: Hardening Guides Browse Page

**Similar to validation profiles but for hardening:**
- Browse page: `/harden/index.md`
- Filters: by framework (Ansible, Chef, Terraform), platform, standard
- Uses same browse pattern (layout: doc + aside: false)

**Should add:**
```bash
bd create --title="Create hardening guides browse page" \
  --type=task --priority=1 \
  --description="Browse page for hardening profiles using Ansible/Chef/Terraform. Filters: framework, platform, standard. Uses established browse pattern."
```

### 2. ⚠️ Missing: Standards/Frameworks Browse Page

**SAF has multiple standards/frameworks:**
- Standards: STIG, CIS, PCI-DSS, etc.
- Frameworks: MITRE SAF, DevSec, etc.
- Should be browsable and searchable

**Should add:**
```bash
bd create --title="Create standards browse page" \
  --type=task --priority=1 \
  --description="Browse page for security standards and frameworks. Shows STIG, CIS, PCI-DSS, NIST, etc. with descriptions and links."
```

### 3. ⚠️ Missing: Tools/Apps Detail Pages (Dynamic Routes)

**Similar to profile detail pages:**
- Tools like InSpec, Heimdall, SAF CLI need detail pages
- Should use dynamic routes (not manual markdown)
- Template + paths generator pattern

**Should add:**
```bash
bd create --title="Implement dynamic routes for tool detail pages" \
  --type=task --priority=1 \
  --description="Generate individual tool/app pages from YAML data using dynamic routes pattern."
```

### 4. ⚠️ Missing: Composables/Utilities from Nuxt

**Reusable logic that should be ported:**
- Filter utilities (unique values, counts)
- Search utilities
- Data transformation helpers

**Should add:**
```bash
bd create --title="Port reusable composables from Nuxt site" \
  --type=task --priority=2 \
  --description="Extract and adapt filter/search/transform utilities from saf-site-v4 composables to VitePress."
```

### 5. ⚠️ Missing: Search Enhancement

**VitePress has built-in search, but:**
- Need to verify it works with YAML-loaded data
- May need custom search for profile metadata
- Should test search quality

**Should add:**
```bash
bd create --title="Enhance and test VitePress search" \
  --type=task --priority=2 \
  --description="Test built-in VitePress search with loaded YAML data. Enhance if needed for profile/guide metadata."
```

### 6. ⚠️ Missing: Navigation Generation

**Navigation should be data-driven:**
- Sidebar navigation for /validate, /harden sections
- Auto-generate from data loaders
- Don't hardcode in config.ts

**Should add:**
```bash
bd create --title="Generate navigation from data loaders" \
  --type=task --priority=1 \
  --description="Auto-generate sidebar navigation from loaded YAML data instead of hardcoding in config.ts."
```

---

## Data Structure (from saf-site-v4)

### Directory Structure
```
content/data/
├── capabilities/      # SAF capabilities/features
├── hardening/        # Hardening profiles (Ansible, Chef, Terraform)
├── organizations/    # Organizations maintaining profiles
├── profiles/         # Validation profiles (InSpec)
├── standards/        # Security standards (STIG, CIS, PCI-DSS)
├── tags/             # Tag definitions
├── teams/            # Teams maintaining content
├── technologies/     # Technology metadata
└── tools/            # SAF tools/applications
```

### Profile Data Structure (Validation)

**File:** `content/data/profiles/stig.yml`

```yaml
_id: stig-profiles
_metadata:
  standard: STIG
  description: validation profiles
profiles:
  - id: red-hat-7-stig
    name: Red Hat 7 STIG
    version: v1.0.0
    platform: Cross Platform
    framework: InSpec
    technology: inspec
    vendor: MITRE SAF
    organization: mitre
    team: mitre-saf
    github: https://github.com/mitre/redhat-enterprise-linux-7-stig-baseline
    details: /profiles/red-hat-7-stig
    status: active
    lastUpdated: '2022-12-06'
    standard: STIG
    standardVersion: 1.0.0
    tags: []
    category: Platform Security
    hardeningProfiles: []
    shortDescription: Red Hat 7 STIG
    requirements: Access to the target system
```

**TypeScript Interface:**
```typescript
export interface Profile {
  id: string
  name: string
  version?: string
  platform?: string
  framework?: string
  technology?: string
  vendor?: string
  organization?: string
  team?: string
  github?: string
  details?: string
  status?: 'active' | 'beta' | 'deprecated' | 'draft'
  lastUpdated?: string
  standard?: string
  standardVersion?: string
  tags?: string[]
  category?: string
  hardeningProfiles?: string[]
  shortDescription?: string
  requirements?: string
}
```

### Hardening Profile Data Structure

**File:** `content/data/hardening/ansible.yml`

```yaml
_id: ansible-hardening-profiles
_metadata:
  framework: Ansible
  technology: ansible
  description: Ansible playbooks for security hardening
  lastUpdated: 2023-10-10
  team: mitre-saf
  organization: mitre
  logo: "/img/logos/technologies/ansible.png"
profiles:
  - id: apache-ansible
    name: Apache Web Server Hardening
    version: v1.0.0
    platform: Web Servers
    framework: Ansible
    technology: ansible
    vendor: MITRE SAF
    organization: mitre
    team: mitre-saf
    github: https://github.com/mitre/apache-ansible-hardening
    details: /profiles/apache-ansible
    status: active
    lastUpdated: 2023-10-10
    difficulty: medium
    standard: CIS
    standardVersion: 1.0.0
    tags:
      - apache
      - web
      - ansible
      - security
      - httpd
    category: Web Services
    validationProfiles:
      - apache-baseline
    shortDescription: "Ansible playbook for hardening Apache..."
    requirements: Ansible 2.9+ with SSH access to target servers
```

**Key Differences from Validation Profiles:**
- `difficulty` field (easy/medium/hard)
- `validationProfiles` array (links to InSpec profiles)
- Grouped by framework (Ansible, Chef, Terraform)

---

## Reusable Code from saf-site-v4

### Composables (Can Be Adapted)

**Location:** `/Users/alippold/github/mitre/saf-site-v4/app/composables/`

#### 1. `useProfiles.ts` - **HIGHLY REUSABLE**

**What it provides:**
- TypeScript interface for Profile
- Computed filter lists: `standards`, `categories`, `platforms`, `organizations`
- Computed counts: `countsByStandard`, `countsByStatus`
- Filter function with multiple criteria
- Search function (name, description, id)

**How to adapt for VitePress:**
```typescript
// VitePress version (using data loader instead of Nuxt Content)
import { computed } from 'vue'
import { data } from '../.vitepress/loaders/profiles.data'

export function useProfiles() {
  const profiles = computed(() => data.profiles)

  const standards = computed(() => {
    const unique = new Set(profiles.value.map(p => p.standard).filter(Boolean))
    return Array.from(unique).sort()
  })

  // ... rest of the utilities (same logic, just use data loader)
}
```

**Reuse percentage: ~80%** - Only data source changes

#### 2. `useHardeningProfiles.ts` - **REUSABLE**

Similar to useProfiles but for hardening guides. Same pattern.

**Reuse percentage: ~80%**

#### 3. `useStandards.ts` - **REUSABLE**

Loads and filters security standards data.

**Reuse percentage: ~80%**

#### 4. `useOrganizations.ts`, `useTeams.ts` - **REUSABLE**

Metadata about organizations and teams maintaining profiles.

**Reuse percentage: ~90%** - Pure utility functions

#### 5. `useDatabase.ts` - **NOT REUSABLE**

Nuxt Content-specific. VitePress uses data loaders instead.

**Reuse percentage: 0%** - Replace with VitePress patterns

---

## Recommended Next Steps

### Immediate (P0/P1):
1. ✅ Finish home page layout
2. Create missing browse pages (hardening, standards)
3. Implement dynamic routes for all detail pages
4. Set up asset directory with logos from saf-site-v4
5. Port composable utilities (filters, search, counts)
6. Generate navigation from data

### Short Term (P1/P2):
7. Copy YAML data from saf-site-v4
8. Expand data loaders for all content types
9. Create framework and apps layouts
10. Test and enhance search

### Evaluation (P3):
11. Build performance testing
12. Bundle size analysis
13. Production deployment strategy
14. Final go/no-go decision

---

## Summary: Data Structure Standards

**All content follows this pattern:**

```yaml
_id: collection-name
_metadata:
  # Collection-level metadata
profiles: # or guides, tools, etc.
  - id: unique-slug
    name: Display Name
    version: v1.0.0
    # ... type-specific fields
```

**Common fields across all types:**
- `id` - Unique slug (used for routing)
- `name` - Display name
- `version` - Semantic version
- `status` - active/beta/deprecated/draft
- `github` - GitHub repository URL
- `organization` - Owning organization
- `team` - Maintaining team
- `tags` - Array of tags
- `lastUpdated` - ISO date string

**Type-specific fields:**
- **Validation profiles:** `framework`, `technology`, `standard`, `hardeningProfiles`
- **Hardening profiles:** `difficulty`, `validationProfiles`
- **Tools:** `capabilities`, `dependencies`, `installation`

**For VitePress, we can reuse ~80% of the data structure and composable logic from the Nuxt site.**
