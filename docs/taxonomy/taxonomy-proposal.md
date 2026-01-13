# Security Profile Taxonomy - Clean Design

## Problem Statement
Current data has 83 profiles (78 validation + 5 hardening) with inconsistent categorization:
- "Cross Platform" used for 56 profiles (meaningless)
- "Platform Security" used for 50 profiles (too generic)
- Platform and Category fields overlap heavily
- Missing logical groupings users actually need

## User Mental Model
When users search for security profiles, they think:
1. **"What am I securing?"** → Operating System, Database, Cloud Service, etc.
2. **"What standard am I following?"** → STIG, CIS, NIST, PCI-DSS, etc.
3. **"What's my purpose?"** → Validate (test/assess) vs Harden (configure/remediate)

## Proposed Taxonomy

### 1. TARGET TYPE (replaces "Platform" - what you're securing)
**Purpose:** Clear identification of what system/component is being secured

- **Operating System**
  - Linux (RHEL, Ubuntu, Photon OS, etc.)
  - Windows (Windows 10, Server 2012/2016/2019)
  
- **Database**
  - SQL Server (Windows-based)
  - MySQL (cross-platform)
  - PostgreSQL (cross-platform)
  - Oracle Database (cross-platform)
  - MongoDB (cross-platform)
  
- **Web Server**
  - Apache HTTP Server
  - NGINX
  - IIS (Windows)
  
- **Application Runtime**
  - Java (JRE)
  - Application Server (Tomcat, JBoss)
  
- **Container**
  - Docker
  - Kubernetes / K3s
  
- **Virtualization**
  - Hypervisor (VMware ESXi)
  - Management (vCenter, vSphere)
  - Virtual Machines
  - Networking (NSX)
  - Cloud Management (Aria, Cloud Foundation)
  
- **Cloud Service**
  - Compute/Infrastructure (AWS, GCP, Azure)
  - Storage (S3)
  - Database (RDS)
  - Container Orchestration (GKE)
  - Security/Identity

### 2. STANDARD (what compliance framework)
**Purpose:** Clear identification of which standard/framework is being implemented

- **STIG** (DoD Security Technical Implementation Guide)
- **CIS** (Center for Internet Security Benchmark)
- **SRG** (Security Requirements Guide)
- **PCI-DSS** (Payment Card Industry)
- **NIST** (National Institute of Standards)
- **Best Practices** (vendor-specific guidance)

### 3. CATEGORY (replaces current Category - functional grouping)
**Purpose:** High-level functional organization for browsing

- **Operating Systems**
- **Databases**
- **Web Infrastructure**
- **Application Platforms**
- **Container Platforms**
- **Virtualization**
- **Cloud Infrastructure**
- **Security & Identity**

### 4. VENDOR (who created/maintains the target)
**Purpose:** Filter by vendor for organizations with specific vendor stacks

- **Microsoft** (Windows, SQL Server, IIS, Azure)
- **Red Hat** (RHEL)
- **Canonical** (Ubuntu)
- **VMware** (ESXi, vCenter, vSphere, NSX, etc.)
- **AWS** (AWS services)
- **Google** (GCP services)
- **Oracle** (Oracle Database, MySQL)
- **Open Source** (Apache, NGINX, PostgreSQL, Docker, Kubernetes)

### 5. PROFILE MAINTAINER (new field - who maintains the InSpec/Ansible profile)
**Purpose:** Track who develops/maintains the actual security profile code

- **MITRE SAF**
- **VMware**
- **Google**
- **Community**

### 6. OS FAMILY (new field - for cross-cutting concerns)
**Purpose:** Support use cases like "show me all Linux things" or "show me all Windows things"

- **Linux**
- **Windows**
- **Cross-Platform**
- **Cloud-Native**
- **N/A** (for pure services)

## Example Profile Mappings

### Red Hat 8 STIG
- Target Type: **Operating System → Linux**
- Standard: **STIG**
- Category: **Operating Systems**
- Vendor: **Red Hat**
- Profile Maintainer: **MITRE SAF**
- OS Family: **Linux**

### Windows 2019 STIG
- Target Type: **Operating System → Windows**
- Standard: **STIG**
- Category: **Operating Systems**
- Vendor: **Microsoft**
- Profile Maintainer: **MITRE SAF**
- OS Family: **Windows**

### VMware ESXi 6.7 STIG
- Target Type: **Virtualization → Hypervisor**
- Standard: **STIG**
- Category: **Virtualization**
- Vendor: **VMware**
- Profile Maintainer: **VMware**
- OS Family: **N/A**

### Oracle MySQL 8.0 STIG
- Target Type: **Database → MySQL**
- Standard: **STIG**
- Category: **Databases**
- Vendor: **Oracle**
- Profile Maintainer: **MITRE SAF**
- OS Family: **Cross-Platform**

### AWS RDS MySQL 5.7 CIS
- Target Type: **Cloud Service → Database**
- Standard: **CIS**
- Category: **Cloud Infrastructure**
- Vendor: **AWS**
- Profile Maintainer: **MITRE SAF**
- OS Family: **Cloud-Native**

### Docker CE CIS
- Target Type: **Container → Docker**
- Standard: **CIS**
- Category: **Container Platforms**
- Vendor: **Open Source**
- Profile Maintainer: **MITRE SAF**
- OS Family: **Cross-Platform**

## Filter UX Design

### Primary Filters (most common):
1. **Standard** (STIG, CIS, etc.) - dropdown
2. **Category** (Operating Systems, Databases, etc.) - dropdown
3. **OS Family** (Linux, Windows, Cross-Platform) - dropdown
4. **Search** (free text)

### Secondary Filters (refinement):
5. **Target Type** (more specific than category) - dropdown
6. **Vendor** (Microsoft, VMware, AWS, etc.) - dropdown

### Hidden/Advanced:
- Profile Maintainer (less relevant to end users)

## Benefits of This Approach

1. **Clear semantics:** Each field has one purpose
2. **No overlap:** Target Type, Category, and OS Family are complementary
3. **User-friendly:** Matches how security engineers think
4. **Scalable:** Easy to add new targets/standards/categories
5. **Flexible filtering:** Can filter by "all Linux" or "all STIGs" or "all VMware"
6. **Accurate:** "Cross Platform" only used when actually cross-platform

## Database Schema Changes Needed

### Current schema:
- platform (string) - inconsistent, overlapping with category
- category (string) - too generic
- vendor (string) - underused

### Proposed schema:
- target_type (string) - NEW: Operating System, Database, Web Server, etc.
- target_subtype (string) - NEW: Linux, MySQL, Apache, etc.
- standard (relation) - EXISTING: STIG, CIS, etc. (already have this!)
- category (string) - REVISED: High-level grouping
- vendor (string) - REVISED: Target vendor (Microsoft, VMware, etc.)
- profile_maintainer (string) - NEW: Who maintains the profile code
- os_family (string) - NEW: Linux, Windows, Cross-Platform, Cloud-Native, N/A

## Migration Strategy

1. **Add new fields** to profiles and hardening_profiles tables
2. **Run migration script** to populate new fields based on name patterns
3. **Manually review** edge cases (15-20 profiles)
4. **Update filters UI** to use new fields
5. **Deprecate** old "platform" field (keep for backwards compat, don't display)
6. **Export and commit** to git

## Questions for Discussion

1. Do we want target_type + target_subtype (2 fields) or combined as "Operating System - Linux" (1 field)?
2. Should OS Family be a filter or just a computed field for display?
3. Do we need Profile Maintainer visible to users or just internal?
4. Any other target types missing? (IoT, Mobile, Network Equipment?)
5. Should "Best Practices" be in Standard dropdown or separate?

