## Goal
Create a templated, technology-aware content system that scales across InSpec, Ansible, Chef, Terraform, etc. with rich markdown documentation support.

## Architecture Overview

### Tier 1: Structured Metadata (content table additions)
```sql
+ reference_url        TEXT   -- Link to official standard (cyber.mil, cisecurity.org)
+ readme_url           TEXT   -- GitHub raw README URL for fetching/syncing
```

### Tier 2: Technology Templates (technologies table additions)
```sql
+ quick_start_template    TEXT   -- Auto-generated quick start section
+ prerequisites_template  TEXT   -- Basic prerequisites per technology
```

### Tier 3: Rich Content (content table addition)
```sql
+ readme_markdown      TEXT   -- Full/curated README content (long markdown)
```

## Technology Template Examples

**InSpec:**
```markdown
## Prerequisites
- InSpec 5.x or later installed
- SSH access to target system with appropriate privileges

## Quick Start
\`\`\`bash
git clone {github}
cd {slug}
inspec exec . -t ssh://user@hostname --sudo
\`\`\`
```

**Ansible:**
```markdown
## Prerequisites
- Ansible 2.9+ installed
- SSH access to target hosts

## Quick Start
\`\`\`bash
ansible-galaxy install {slug}
ansible-playbook site.yml -i inventory
\`\`\`
```

## Page Layout Concept
1. HEADER: Name, Pillar Badge, Status, Version, Actions
2. FEATURE CARDS: Target, Standard, Technology, Vendor, Maintainer
3. QUICK START: Auto-generated from technology template (interpolated)
4. FULL DOCUMENTATION: Rendered from readme_markdown (collapsible/tabbed)
5. RELATED CONTENT: Same target, different content type

## Data Population Strategy
1. Bulk populate readme_url from GitHub pattern
2. Fetch and cache readme_markdown via script
3. Write technology templates (6-8 total)
4. Map reference_url from standard (STIG → cyber.mil, CIS → cisecurity.org)

## Benefits
- Quick Start auto-generated (80% needs no custom writing)
- Full README preserved for deep documentation
- Reference URL links to authoritative sources
- README can be synced from GitHub periodically
- Scales across all technologies

## Implementation Tasks
- [ ] Add schema fields to Pocketbase (content + technologies tables)
- [ ] Create technology templates for InSpec, Ansible, Chef, Terraform, PowerShell
- [ ] Build README fetch/sync script
- [ ] Update ContentDetail.vue to render templates + markdown
- [ ] Populate reference_url for standards
- [ ] Delete old /validate/ static pages
- [ ] Update data loader to include new fields

## Related Session Work
- Session 036-037: Unified Content Library, BrandIcon, SAF icons
- README analysis: RHEL8 STIG (MITRE), Amazon Linux 2, ansible-lockdown, dev-sec
