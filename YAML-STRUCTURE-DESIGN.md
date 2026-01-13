# YAML Data Structure Design for Security Automation Framework

## Executive Summary

After analyzing the current YAML files across validation profiles (11 files), hardening profiles (3 files), and standards (10 files), I've identified significant structural inconsistencies that need standardization. The current implementation has:

1. **Inconsistent top-level keys**: `profiles` vs `hardeningProfiles` vs `profiles` used interchangeably
2. **Mixed relationship patterns**: Both `hardeningProfiles` and `validationProfiles` arrays with different semantics
3. **Redundant metadata**: `_metadata` fields repeat profile-level data
4. **Unclear ID scoping**: No guarantee of global uniqueness across profile types

## Domain Model Analysis

The system has three core entity types:

### 1. Standards/Baselines (Standards Entity)
- **Examples**: CIS Benchmarks, DISA STIGs, PCI-DSS, SRG-Ready
- **Role**: Security frameworks/requirement documents
- **Relationships**: References validation profiles AND hardening profiles
- **Current location**: `content/data/standards/*.yml`

### 2. Validation Profiles (Testing/Compliance)
- **Examples**: InSpec profiles, SCAP content, test scripts
- **Role**: Tests compliance against standards
- **Technologies**: InSpec (primary), SCAP, Python scripts, shell scripts
- **Relationships**: References related hardening profiles
- **Current location**: `content/data/profiles/*.yml`

### 3. Hardening Profiles (Remediation/Implementation)
- **Examples**: Ansible playbooks, Terraform configs, Chef cookbooks
- **Role**: Implements/remediates systems to meet standards
- **Technologies**: Ansible, Terraform, Chef, Puppet
- **Relationships**: References related validation profiles
- **Current location**: `content/data/hardening/*.yml`

## Critical Issues in Current Structure

### Issue 1: Inconsistent Top-Level Keys

**Current state:**
```yaml
# profiles/ directory - CONSISTENT
profiles:  # Used in cis.yml, stig.yml, pci-dss.yml, srg-ready.yml, vendor-guidance.yml, other.yml
  - id: aws-cis
    ...

# hardening/ directory - INCONSISTENT
hardeningProfiles:  # Used in ansible.yml
  - id: apache-ansible
    ...

profiles:  # Used in terraform.yml, chef.yml (WRONG KEY!)
  - id: kubernetes-hardening
    ...
```

**Problem**: Same file purpose (hardening profiles) uses different keys, creating confusion and breaking import logic.

### Issue 2: Bidirectional Relationship Inconsistency

**Current state:**
```yaml
# Validation profile references hardening
profiles:
  - id: docker-ce-cis
    hardeningProfiles:
      - docker-cis          # Array of IDs
      - docker-cis-kitchen

# Hardening profile references validation
hardeningProfiles:
  - id: docker-cis
    validationProfiles:
      - docker-ce-cis       # Array of IDs
```

**Problem**: Bidirectional references create maintenance burden. When adding a new relationship, you must update TWO files. This violates DRY (Don't Repeat Yourself) and causes data inconsistency.

## Recommended Structure (THE RIGHT WAY)

### Design Principles

1. **Single Source of Truth**: Relationships declared in ONE place only
2. **Unidirectional References**: Profile-to-standard, not bidirectional
3. **Consistent Naming**: Same entity type = same key name everywhere
4. **Global ID Uniqueness**: IDs must be unique across ALL profile types
5. **Minimal Metadata**: Only non-redundant data in `_metadata`

### Principle 1: Entity-Specific Top-Level Keys

**Rule**: The top-level array key MUST match the entity type in that directory.

```yaml
# content/data/profiles/*.yml (VALIDATION PROFILES)
# Top-level key: validationProfiles
_id: cis-validation-profiles
_metadata:
  category: cis
  description: CIS Benchmark validation profiles
  lastUpdated: '2023-09-10'
validationProfiles:
  - id: aws-cis                    # Unique across ALL profiles
    name: AWS CIS Foundations
    standard: cis                  # References standards/cis.yml
    standardVersion: 1.0.0
    technology: inspec             # Profile-specific
    relatedHardeningProfiles:      # Optional array of hardening IDs
      - aws-cis-terraform
      - aws-cis-ansible
    # ... other profile fields

# content/data/hardening/*.yml (HARDENING PROFILES)
# Top-level key: hardeningProfiles
_id: ansible-hardening-profiles
_metadata:
  technology: ansible
  description: Ansible playbooks for security hardening
  lastUpdated: '2023-10-10'
hardeningProfiles:
  - id: aws-cis-ansible            # Unique across ALL profiles
    name: AWS CIS Hardening (Ansible)
    standard: cis                  # References standards/cis.yml
    standardVersion: 2.0.0
    technology: ansible            # Profile-specific
    relatedValidationProfiles:     # Optional array of validation IDs
      - aws-cis
    # ... other profile fields

# content/data/standards/*.yml (STANDARDS)
# Top-level key: standards
_id: cis-standards
_metadata:
  organization: Center for Internet Security
  website: https://www.cisecurity.org/cis-benchmarks
  lastUpdated: '2023-09-10'
standards:
  - id: cis
    name: CIS Benchmarks
    description: ...
    # NO profile references here - profiles reference standards
```

### Principle 2: Unidirectional Relationships (Bottom-Up Only)

**Rule**: Profiles reference standards. Profiles MAY reference related profiles. Standards NEVER reference profiles.

```yaml
# CORRECT: Profile references standard
validationProfiles:
  - id: docker-ce-cis
    standard: cis                  # Points to standards/cis.yml
    relatedHardeningProfiles:      # Optional related profiles
      - docker-cis-ansible
      - docker-cis-chef

# WRONG: Standard references profiles (DON'T DO THIS)
standards:
  - id: cis
    relatedProfiles:               # ❌ Violates single source of truth
      - docker-ce-cis
```

**Why unidirectional?**
- Standards are stable (change rarely)
- Profiles are dynamic (new profiles added frequently)
- Adding a new profile shouldn't require editing the standard file
- Query pattern: "Show me all profiles for CIS standard" can be answered by filtering profiles WHERE standard='cis'

### Principle 3: Global ID Uniqueness

**Rule**: Profile IDs must be unique across BOTH validation and hardening profiles.

```yaml
# ✅ CORRECT: Different IDs for different profile types
validationProfiles:
  - id: docker-ce-cis              # Validation profile

hardeningProfiles:
  - id: docker-cis-ansible         # Hardening profile (different ID)
  - id: docker-cis-chef            # Another hardening (different ID)

# ❌ WRONG: Same ID in different files
validationProfiles:
  - id: docker-cis                 # Validation

hardeningProfiles:
  - id: docker-cis                 # Collision! Same ID as validation
```

**ID Naming Convention**:
- Validation profiles: `{platform}-{standard}` (e.g., `rhel8-stig`, `docker-ce-cis`)
- Hardening profiles: `{platform}-{standard}-{technology}` (e.g., `rhel8-stig-ansible`, `docker-cis-terraform`)

## Complete Structure Specification

### Validation Profile File Structure

**File**: `content/data/profiles/{category}.yml`

```yaml
_id: {category}-validation-profiles  # e.g., cis-validation-profiles
_metadata:
  category: {category}                # cis, stig, pci-dss, vendor-guidance, other
  description: {description}          # Brief file description
  lastUpdated: 'YYYY-MM-DD'          # ISO 8601 date

validationProfiles:
  - id: {unique-id}                   # REQUIRED: Globally unique ID
    name: {display-name}              # REQUIRED: Human-readable name
    version: {version}                # REQUIRED: Profile version

    # Standard/Framework
    standard: {standard-id}           # REQUIRED: References standards/{id}
    standardVersion: {version}        # REQUIRED: Standard version

    # Technical Details
    platform: {platform}              # REQUIRED: Cross Platform, Cloud, etc.
    framework: {framework}            # REQUIRED: InSpec, SCAP, etc.
    technology: {tech}                # REQUIRED: inspec, scap, python, shell

    # Organization/Team
    vendor: {vendor}                  # REQUIRED: MITRE SAF, VMware, Google
    organization: {org}               # REQUIRED: mitre, vmware, cis, other
    team: {team}                      # REQUIRED: mitre-saf, cis-benchmarks

    # Links and Status
    github: {github-url}              # REQUIRED: GitHub repository URL
    details: /profiles/{id}           # REQUIRED: Detail page path
    status: {status}                  # REQUIRED: active, beta, deprecated
    lastUpdated: 'YYYY-MM-DD'        # REQUIRED: ISO 8601 date

    # Classification
    tags: [tag1, tag2, ...]          # REQUIRED: Array of tags
    category: {category}              # REQUIRED: Platform Security, Cloud, etc.

    # Relationships (OPTIONAL)
    relatedHardeningProfiles: []     # OPTIONAL: Array of hardening profile IDs

    # Documentation
    shortDescription: {description}   # REQUIRED: Brief description
    requirements: {requirements}      # REQUIRED: Prerequisites/access needed
```

### Hardening Profile File Structure

**File**: `content/data/hardening/{technology}.yml`

```yaml
_id: {technology}-hardening-profiles  # e.g., ansible-hardening-profiles
_metadata:
  technology: {technology}            # ansible, terraform, chef, puppet
  description: {description}          # Brief file description
  lastUpdated: 'YYYY-MM-DD'          # ISO 8601 date

hardeningProfiles:
  - id: {unique-id}                   # REQUIRED: Globally unique ID
    name: {display-name}              # REQUIRED: Human-readable name
    version: {version}                # REQUIRED: Profile version

    # Standard/Framework
    standard: {standard-id}           # REQUIRED: References standards/{id}
    standardVersion: {version}        # REQUIRED: Standard version

    # Technical Details
    platform: {platform}              # REQUIRED: Cross Platform, Cloud, etc.
    framework: {framework}            # REQUIRED: Ansible, Terraform, Chef
    technology: {tech}                # REQUIRED: ansible, terraform, chef
    difficulty: {level}               # REQUIRED: easy, medium, hard

    # Organization/Team
    vendor: {vendor}                  # REQUIRED: MITRE SAF, etc.
    organization: {org}               # REQUIRED: mitre, vendor-name
    team: {team}                      # REQUIRED: mitre-saf, etc.

    # Links and Status
    github: {github-url}              # REQUIRED: GitHub repository URL
    details: /profiles/{id}           # REQUIRED: Detail page path
    status: {status}                  # REQUIRED: active, beta, deprecated
    lastUpdated: 'YYYY-MM-DD'        # REQUIRED: ISO 8601 date

    # Classification
    tags: [tag1, tag2, ...]          # REQUIRED: Array of tags
    category: {category}              # REQUIRED: Web Services, Cloud, etc.

    # Relationships (OPTIONAL)
    relatedValidationProfiles: []    # OPTIONAL: Array of validation profile IDs

    # Documentation
    shortDescription: {description}   # REQUIRED: Brief description
    requirements: {requirements}      # REQUIRED: Prerequisites/tools needed
```

## Migration Checklist

### Phase 1: Fix Hardening Files (Immediate)
- [ ] `hardening/terraform.yml` - Change `profiles:` to `hardeningProfiles:`
- [ ] `hardening/chef.yml` - Change `profiles:` to `hardeningProfiles:`
- [ ] Verify `hardening/ansible.yml` already uses `hardeningProfiles:` ✅

### Phase 2: Rename Top-Level Keys (Breaking Change)
- [ ] All `profiles/*.yml` - Change `profiles:` to `validationProfiles:`
- [ ] Update import script to expect `validationProfiles` and `hardeningProfiles`
- [ ] Update data loader to handle new keys

### Phase 3: Update Quality Script
- [ ] Add validation for correct top-level keys per directory
- [ ] Add global ID uniqueness check across both profile types
- [ ] Add standard reference validation

### Phase 4: Database Schema (Optional Later)
- [ ] Consider renaming `profiles` table to `validationProfiles`
- [ ] Or keep generic names and rely on directory context
