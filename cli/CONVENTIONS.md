# SAF Site Content Naming Conventions

This document defines the standard naming conventions for content in the SAF Site database. These conventions ensure consistency, predictability, and ease of use across the ecosystem.

## Slug Format

```
{target}-{standard}
```

**Examples:**
- `rhel-9-stig`
- `ubuntu-2204-cis`
- `aws-rds-mysql-8-pci-dss`

### Components

| Component | Description | Examples |
|-----------|-------------|----------|
| `{target}` | Abbreviated target platform | `rhel-9`, `ubuntu-2204`, `aws-rds-mysql-8` |
| `{standard}` | Compliance standard identifier | `stig`, `cis`, `pci-dss` |

### Why This Format?

1. **Multiple standards per target** - The same platform (e.g., RHEL 9) may have STIG, CIS, and PCI-DSS profiles
2. **URL-friendly** - All lowercase, hyphen-separated, no special characters
3. **Predictable** - Given a target and standard, the slug can be derived
4. **Concise** - Uses industry-standard abbreviations

## Target Abbreviations

Use canonical abbreviations where industry-standard terms exist:

| Full Name | Abbreviation | Example Slug |
|-----------|--------------|--------------|
| Red Hat Enterprise Linux | `rhel` | `rhel-9-stig` |
| Windows Server | `win` | `win-2019-stig` |
| Amazon Web Services | `aws` | `aws-rds-mysql-8-cis` |
| Amazon RDS | `aws-rds` | `aws-rds-postgresql-14-stig` |
| VMware ESXi | `esxi` | `esxi-8-stig` |
| VMware vSphere | `vsphere` | `vsphere-8-stig` |
| VMware vCenter | `vcsa` | `vcsa-8-stig` |
| Oracle Linux | `ol` | `ol-8-stig` |
| CentOS | `centos` | `centos-8-cis` |
| Alpine Linux | `alpine` | `alpine-3-cis` |
| macOS | `macos` | `macos-14-cis` |
| Internet Information Services | `iis` | `iis-10-stig` |
| Microsoft SQL Server | `mssql` | `mssql-2019-stig` |
| PostgreSQL | `postgresql` | `postgresql-14-stig` |
| MySQL | `mysql` | `mysql-8-cis` |
| MongoDB | `mongodb` | `mongodb-6-stig` |
| Kubernetes | `k8s` | `k8s-1.28-cis` |
| Docker | `docker` | `docker-ce-cis` |
| Apache HTTP Server | `apache` | `apache-2.4-stig` |
| NGINX | `nginx` | `nginx-cis` |
| Java Runtime Environment | `jre` | `jre-11-stig` |

### Targets Without Standard Abbreviations

For targets without industry-standard abbreviations, use the shortest unambiguous form:

| Full Name | Slug Form |
|-----------|-----------|
| Ubuntu 22.04 LTS | `ubuntu-2204` |
| Debian 12 | `debian-12` |
| SUSE Linux Enterprise | `sles-15` |
| Cisco IOS | `cisco-ios` |
| Palo Alto PAN-OS | `panos` |

## Version Numbers

| Platform Type | Version Format | Examples |
|---------------|----------------|----------|
| Operating Systems | Major only | `rhel-9`, `ubuntu-2204` |
| Databases | Major only | `postgresql-14`, `mysql-8` |
| Frameworks/APIs | Full version | `aws-foundations-2.0.0` |
| Containers | Major.minor or tag | `k8s-1.28`, `docker-ce` |

**Rules:**
- Use major version for OS/databases (they have long-term support cycles)
- Use full version for compliance frameworks that version independently
- Omit version entirely if target doesn't have meaningful versions (`docker-ce`, `mongodb`)

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

## Display Names

The `name` field uses the full, human-readable form:

| Slug | Display Name |
|------|--------------|
| `rhel-9-stig` | Red Hat Enterprise Linux 9 STIG |
| `ubuntu-2204-cis` | Ubuntu 22.04 CIS Benchmark |
| `aws-rds-mysql-8-stig` | AWS RDS MySQL 8 STIG |
| `k8s-1.28-cis` | Kubernetes 1.28 CIS Benchmark |

## Repository Naming

GitHub repositories follow the pattern:

```
{target-full}-{standard}-baseline     # Validation (InSpec)
{technology}-{target-full}-{standard}-hardening  # Hardening (Ansible, Chef, etc.)
```

**Examples:**
- `redhat-enterprise-linux-9-stig-baseline` → slug: `rhel-9-stig`
- `ansible-redhat-enterprise-linux-9-stig-hardening` → slug: `ansible-rhel-9-stig`

## Hardening Content Slugs

For hardening content, prefix with the technology:

```
{technology}-{target}-{standard}
```

**Examples:**
- `ansible-rhel-9-stig`
- `chef-ubuntu-2204-cis`
- `terraform-aws-foundations-cis`

This distinguishes hardening content from validation profiles for the same target.

## Migration Notes

When migrating existing slugs to this convention:

| Current | New |
|---------|-----|
| `red-hat-8-stig` | `rhel-8-stig` |
| `red-hat-9-stig` | `rhel-9-stig` |
| `windows-2019-stig` | `win-2019-stig` |

A migration script should update both the `slug` field and any URL references.

## Adding New Content

When adding new content via CLI:

1. **Auto-suggest** - CLI suggests slug based on target + standard
2. **Validate** - Check slug follows conventions
3. **Confirm** - User confirms or modifies suggested slug
4. **Uniqueness** - Verify slug doesn't already exist

```
$ saf-site content add

◆ Target: Red Hat Enterprise Linux 9
◆ Standard: DISA STIG
◆ Suggested slug: rhel-9-stig
◆ Confirm? (Y/n)
```
