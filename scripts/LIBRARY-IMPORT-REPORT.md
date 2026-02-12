# Library Import Report

Generated: 2026-02-12

## Summary

Scraped the old SAF site (https://saf.mitre.org) GraphQL backend to identify missing libraries in the new database.

### Findings

| Metric | Count |
|--------|-------|
| **Validation libraries scraped** | 75 |
| **Validation in current DB** | 78 |
| **Missing validation** | 5 |
| **Hardening libraries scraped** | 73 |
| **Hardening in current DB** | 4 |
| **Missing hardening** | **73** |

**Critical gap**: Nearly all hardening libraries (73 of 73) are missing from the new database.

## Data Sources

1. **Old site GraphQL API**: `https://saf-site-backend.herokuapp.com/graphql`
   - Query: `validationContents` (75 items)
   - Query: `hardeningContents` (73 items)

2. **Current database**: `.pocketbase/pb_data/diffable/content.ndjson`
   - Validation: 78 items
   - Hardening: 4 items

## Missing Libraries

### Validation (5 missing)

1. **RSA Archer 6 SCG**
   - https://github.com/mitre/rsa-archer-6-security-configuration-guide-baseline

2. **NGINX Baseline**
   - https://github.com/mitre/nginx-baseline

3. **DRAFT: Tomcat 8 CIS**
   - https://github.com/mitre/apache-tomcat-8-cis-baseline

4. **DRAFT: Tomcat 7 CIS**
   - https://github.com/mitre/apache-tomcat-7-cis-baseline

5. **VMware Photon OS 4.0 STIG**
   - https://github.com/vmware/dod-compliance-and-automation/tree/master/photon/4.0/inspec/vmware-photon-4.0-stig-baseline

### Hardening (73 missing)

**Breakdown by technology:**

- **Ansible**: ~45 items (Ansible Lockdown, MITRE, VMware)
- **Chef**: ~10 items (MITRE hardening cookbooks)
- **PowerCLI**: ~5 items (VMware vSphere/VCSA)
- **Other**: ~13 items (public.cyber.mil links, Keycloak, etc.)

**Common patterns:**
- Red Hat 7/8/9 STIG (multiple variants)
- Windows 2012/2016/2019/2022 STIG
- Ubuntu 16.04/18.04/20.04 STIG/CIS
- VMware vSphere/VCSA/Photon OS (multiple versions)
- Docker, Kubernetes, PostgreSQL, MongoDB, etc.

Full list: See `scraped-libraries-formatted.json`

## Files Generated

| File | Purpose |
|------|---------|
| `scripts/scraped-libraries.json` | Raw GraphQL response |
| `scripts/scraped-libraries-formatted.json` | Formatted with metadata and missing items |
| `scripts/import-scraped-libraries.ts` | Import script to add missing items |
| `scripts/LIBRARY-IMPORT-REPORT.md` | This report |

## Import Process

### Prerequisites

1. Pocketbase running: `cd .pocketbase && ./pocketbase serve`
2. Logged in as admin (script uses `admin@localhost.com` / `testpassword123`)

### Run Import

```bash
npx tsx scripts/import-scraped-libraries.ts
```

### What the Script Does

1. **Loads lookup tables** from Pocketbase:
   - Organizations (MITRE, VMware, Ansible Lockdown, etc.)
   - Technologies (InSpec, Ansible, Chef, Terraform, PowerCLI)
   - Standards (STIG, CIS Benchmark, etc.)
   - Targets (Red Hat 8, Ubuntu 20.04, Docker, etc.)
   - Teams (MITRE SAF Team, etc.)

2. **For each missing library**:
   - Generates slug from name
   - Checks if already exists (skip if so)
   - **Infers FK relationships** from name and GitHub URL:
     - **Technology**: ansible, chef, terraform, powercli, inspec
     - **Vendor**: MITRE, VMware, Ansible Lockdown, DISA (from GitHub org)
     - **Standard**: STIG, CIS, SRG (from name keywords)
     - **Target**: Detects OS/app from name (RHEL 8, Ubuntu 20.04, Docker, etc.)
     - **Maintainer**: MITRE SAF Team if MITRE vendor
   - Creates content record with inferred FKs

3. **Reports results**:
   - Imported count
   - Skipped count (already exist)
   - Error count

### Post-Import

After running the import:

1. **Review in Pocketbase Admin UI**: http://localhost:8090/_/
   - Check `content` collection
   - Verify FK relationships look correct
   - Manually fix any incorrect mappings

2. **Export to git**:
   ```bash
   cd .pocketbase/pb_data
   sqlite-diffable dump data.db diffable/ --all
   ```

3. **Commit**:
   ```bash
   git add .pocketbase/pb_data/diffable/
   git commit -s -m "content: import 78 missing libraries from old site

   - 5 validation profiles (RSA Archer, NGINX, Tomcat CIS drafts, Photon OS)
   - 73 hardening libraries (Ansible, Chef, PowerCLI implementations)
   - Inferred FK relationships from names/GitHub URLs
   - Source: saf-site-backend.herokuapp.com GraphQL API"
   ```

## Known Limitations

### FK Inference

The import script uses heuristics to infer foreign key relationships. Review these for accuracy:

- **Targets**: Only common OS/apps mapped (RHEL, Ubuntu, Windows, Docker, etc.)
  - VMware-specific targets may need manual assignment
  - Cloud provider targets (AWS, Azure) need review
- **Standards**: STIG/CIS detected, but version specifics lost
- **Vendors**: GitHub org used, but some may be incorrect
- **Technologies**: Inferred from GitHub URL, may miss edge cases

### Missing Metadata

The old site's GraphQL API only provided:
- `name`
- `name_long`
- `source` (GitHub URL)

Missing metadata (not in old site export):
- Control count
- STIG ID
- Benchmark version
- Automation level
- License
- Release date
- Long description
- Documentation URL

These fields remain empty after import and should be populated later.

### Duplicate Handling

Some libraries appear multiple times with different technologies:
- "Docker CIS Benchmark" (Ansible + Chef)
- "Tomcat CIS Benchmark" (Ansible + Chef)
- "Red Hat 9 STIG" (appears 3 times)

The script will create separate records for each. This may be intentional (different implementations) or may need deduplication.

## Recommendations

1. **Run import script** to get 73 hardening libraries into the database
2. **Manual review** in Pocketbase Admin UI to fix FK mismatches
3. **Enhance metadata** by fetching README files from GitHub repos:
   - Use `scripts/fetch-readmes.ts` (if exists) or create new script
   - Parse README for control counts, versions, etc.
4. **Tag assignment** - Add relevant tags via junction table
5. **Featured selection** - Mark key libraries as `is_featured = true`
6. **Capability mapping** - Link to SAF pillars via `content_capabilities` junction table

## Next Steps

After import and review:

1. Update content browse page to show both validation + hardening
2. Test filtering by content_type, technology, vendor, standard
3. Add related content links (validation ↔ hardening pairs)
4. Document the import process in CONTRIBUTING.md
