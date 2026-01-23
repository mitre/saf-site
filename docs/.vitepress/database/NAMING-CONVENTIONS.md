# SAF Content Naming Conventions

This document defines the standard naming conventions for all content in the SAF ecosystem. These conventions apply to:

- Database records (`content` table)
- GitHub repositories
- CLI tooling
- Documentation references

## Slug Format

```
{target}-{standard}
```

**Examples:**
| Slug | Description |
|------|-------------|
| `rhel-9-stig` | Red Hat Enterprise Linux 9 STIG profile |
| `ubuntu-2204-cis` | Ubuntu 22.04 CIS Benchmark profile |
| `aws-rds-mysql-8-pci-dss` | AWS RDS MySQL 8 PCI-DSS profile |

### Hardening Content

Prefix with technology:

```
{technology}-{target}-{standard}
```

| Slug | Description |
|------|-------------|
| `ansible-rhel-9-stig` | Ansible hardening for RHEL 9 STIG |
| `chef-ubuntu-2204-cis` | Chef hardening for Ubuntu 22.04 CIS |

---

## Target Abbreviations

### Operating Systems

| Full Name | Abbreviation | Example |
|-----------|--------------|---------|
| Red Hat Enterprise Linux | `rhel` | `rhel-9-stig` |
| Oracle Linux | `ol` | `ol-8-stig` |
| CentOS | `centos` | `centos-8-cis` |
| Ubuntu | `ubuntu` | `ubuntu-2204-cis` |
| Debian | `debian` | `debian-12-cis` |
| SUSE Linux Enterprise | `sles` | `sles-15-cis` |
| Alpine Linux | `alpine` | `alpine-3-cis` |
| Windows Server | `win` | `win-2022-stig` |
| macOS | `macos` | `macos-14-cis` |

### Cloud Platforms

| Full Name | Abbreviation | Example |
|-----------|--------------|---------|
| Amazon Web Services | `aws` | `aws-foundations-cis` |
| Amazon RDS | `aws-rds` | `aws-rds-mysql-8-stig` |
| Google Cloud Platform | `gcp` | `gcp-foundations-cis` |
| Microsoft Azure | `azure` | `azure-foundations-cis` |

### VMware

| Full Name | Abbreviation | Example |
|-----------|--------------|---------|
| VMware ESXi | `esxi` | `esxi-8-stig` |
| VMware vSphere | `vsphere` | `vsphere-8-stig` |
| VMware vCenter (VCSA) | `vcsa` | `vcsa-8-stig` |

### Containers & Orchestration

| Full Name | Abbreviation | Example |
|-----------|--------------|---------|
| Kubernetes | `k8s` | `k8s-1.28-cis` |
| Docker CE | `docker-ce` | `docker-ce-cis` |
| Docker Enterprise | `docker-ee` | `docker-ee-cis` |

### Databases

| Full Name | Abbreviation | Example |
|-----------|--------------|---------|
| PostgreSQL | `postgresql` | `postgresql-14-stig` |
| MySQL | `mysql` | `mysql-8-cis` |
| Microsoft SQL Server | `mssql` | `mssql-2019-stig` |
| Oracle Database | `oracle-db` | `oracle-db-19c-stig` |
| MongoDB | `mongodb` | `mongodb-6-stig` |

### Web Servers & Middleware

| Full Name | Abbreviation | Example |
|-----------|--------------|---------|
| Apache HTTP Server | `apache` | `apache-2.4-stig` |
| NGINX | `nginx` | `nginx-cis` |
| Internet Information Services | `iis` | `iis-10-stig` |
| Apache Tomcat | `tomcat` | `tomcat-9-stig` |
| JBoss EAP | `jboss-eap` | `jboss-eap-7-stig` |
| Java Runtime Environment | `jre` | `jre-11-stig` |

---

## Standard Identifiers

| Full Name | Identifier |
|-----------|------------|
| DISA STIG | `stig` |
| CIS Benchmark | `cis` |
| PCI DSS | `pci-dss` |
| NIST 800-53 | `nist-800-53` |
| HIPAA | `hipaa` |
| FedRAMP | `fedramp` |
| SOC 2 | `soc2` |

---

## Version Numbers

| Platform Type | Format | Examples |
|---------------|--------|----------|
| Operating Systems | Remove dots | `rhel-9`, `ubuntu-2204` |
| Databases | Major only | `postgresql-14`, `mysql-8` |
| Compliance Frameworks | Keep full semver | `aws-foundations-2.0.0-cis` |
| Kubernetes | Keep dots | `k8s-1.28` |

**Rules:**
1. **OS versions**: Remove dots, concatenate (`22.04` → `2204`)
2. **Frameworks**: Keep full semver with dots (`2.0.0`)
3. **Databases**: Use major version only (`14`, not `14.0`)
4. **Omit version** if not meaningful (`docker-ce`, `nginx`)

---

## Multi-Component Targets

For targets with multiple components (platform + service + product), use hyphen-separated hierarchy:

```
{platform}-{service}-{product}-{version}
```

| Target | Slug |
|--------|------|
| AWS RDS MySQL 8 | `aws-rds-mysql-8` |
| AWS RDS PostgreSQL 14 | `aws-rds-postgresql-14` |
| Google Cloud SQL MySQL | `gcp-cloudsql-mysql-8` |

**Rule:** Include all specific terms to preserve full context.

- ✅ `aws-rds-postgresql-14-stig`
- ❌ `aws-rds-14-stig` (loses database type)
- ❌ `postgresql-14-stig` (loses cloud context)

---

## Display Names

The `name` field in the database uses full, human-readable names:

| Slug | Display Name |
|------|--------------|
| `rhel-9-stig` | Red Hat Enterprise Linux 9 STIG |
| `ubuntu-2204-cis` | Ubuntu 22.04 CIS Benchmark |
| `ansible-rhel-9-stig` | Ansible RHEL 9 STIG Hardening |

---

## GitHub Repository Names

### Validation Profiles (InSpec)

```
{target-full}-{standard}-baseline
```

| Repository | Slug |
|------------|------|
| `redhat-enterprise-linux-9-stig-baseline` | `rhel-9-stig` |
| `ubuntu-22.04-cis-baseline` | `ubuntu-2204-cis` |

### Hardening Content

```
{technology}-{target-full}-{standard}-hardening
```

| Repository | Slug |
|------------|------|
| `ansible-redhat-enterprise-linux-9-stig-hardening` | `ansible-rhel-9-stig` |
| `chef-ubuntu-22.04-cis-hardening` | `chef-ubuntu-2204-cis` |

---

## Adding New Content

### Required Fields

| Field | Source | Example |
|-------|--------|---------|
| `slug` | Generated from target + standard | `rhel-9-stig` |
| `name` | Human-readable full name | `Red Hat Enterprise Linux 9 STIG` |
| `content_type` | `validation` or `hardening` | `validation` |
| `target` | FK to `targets` table | → RHEL 9 |
| `standard` | FK to `standards` table | → DISA STIG |

### Checklist

- [ ] Slug follows `{target}-{standard}` convention
- [ ] Target uses canonical abbreviation
- [ ] Standard uses canonical identifier
- [ ] Version format matches platform type
- [ ] Display name is human-readable
- [ ] No duplicate slugs in database

---

## Migration Guide

Existing slugs that don't follow conventions should be migrated:

| Current | Migrated |
|---------|----------|
| `red-hat-8-stig` | `rhel-8-stig` |
| `red-hat-9-stig` | `rhel-9-stig` |
| `windows-2019-stig` | `win-2019-stig` |
| `vmware-esxi-67-stig` | `esxi-6.7-stig` |

**Note:** Migration requires updating:
1. Database `slug` field
2. Any URL references in documentation
3. Redirect rules if URLs are public
