# Security Profile Taxonomy - Visual Structure

## Taxonomy Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY PROFILE                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
        │ TARGET TYPE  │    │   STANDARD   │   │  OS FAMILY   │
        │ (What)       │    │   (How)      │   │  (Broad)     │
        └──────────────┘    └──────────────┘   └──────────────┘
                │                   │                   │
    ┌───────────┼───────────┐      │         ┌─────────┼─────────┐
    ▼           ▼           ▼      │         ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐  │     ┌───────┐ ┌───────┐ ┌──────┐
│   OS   │ │Database│ │  Web   │  │     │ Linux │ │Windows│ │Cloud │
│        │ │        │ │ Server │  │     │       │ │       │ │Native│
└────────┘ └────────┘ └────────┘  │     └───────┘ └───────┘ └──────┘
    │           │           │      │
    ▼           ▼           ▼      ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Linux  │ │ MySQL  │ │ Apache │ │  STIG  │
│ Windows│ │Postgres│ │ NGINX  │ │  CIS   │
│        │ │ Oracle │ │  IIS   │ │  SRG   │
└────────┘ └────────┘ └────────┘ └────────┘
    │           │           │      │
    └───────────┴───────────┴──────┤
                │                  │
                ▼                  ▼
        ┌──────────────┐    ┌──────────────┐
        │   CATEGORY   │    │    VENDOR    │
        │  (Grouping)  │    │   (Owner)    │
        └──────────────┘    └──────────────┘
```

## Filter UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VALIDATION PROFILES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Standard ▼  │  │ Category  ▼  │  │ OS Family ▼  │             │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤             │
│  │ All          │  │ All          │  │ All          │             │
│  │ STIG         │  │ Operating... │  │ Linux        │             │
│  │ CIS          │  │ Databases    │  │ Windows      │             │
│  │ SRG          │  │ Web Infra... │  │ Cross-Plat...│             │
│  │ PCI-DSS      │  │ Container... │  │ Cloud-Native │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ Target Type▼ │  │   Vendor  ▼  │  │ Search profiles...      │  │
│  ├──────────────┤  ├──────────────┤  └─────────────────────────┘  │
│  │ All          │  │ All          │                                │
│  │ Operating... │  │ Microsoft    │                                │
│  │ Database     │  │ VMware       │                                │
│  │ Web Server   │  │ Red Hat      │                                │
│  │ Container    │  │ AWS          │                                │
│  │ Virtualiz... │  │ Oracle       │                                │
│  └──────────────┘  └──────────────┘                                │
│                                                                     │
│  Showing 45 of 78 profiles                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Example Profile Mappings (Visual Cards)

```
┌─────────────────────────────────────────────────────────────────┐
│ Red Hat Enterprise Linux 8 STIG                          v1.0.0 │
├─────────────────────────────────────────────────────────────────┤
│ Target:  Operating System → Linux                               │
│ Standard: STIG                     OS Family: Linux              │
│ Category: Operating Systems        Vendor: Red Hat               │
│ Maintainer: MITRE SAF             Technology: InSpec            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Windows Server 2019 STIG                                 v1.0.0 │
├─────────────────────────────────────────────────────────────────┤
│ Target:  Operating System → Windows                             │
│ Standard: STIG                     OS Family: Windows            │
│ Category: Operating Systems        Vendor: Microsoft             │
│ Maintainer: MITRE SAF             Technology: InSpec            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ VMware ESXi 6.7 STIG                                     v1.0.0 │
├─────────────────────────────────────────────────────────────────┤
│ Target:  Virtualization → Hypervisor                            │
│ Standard: STIG                     OS Family: N/A                │
│ Category: Virtualization           Vendor: VMware                │
│ Maintainer: VMware                Technology: InSpec            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Oracle MySQL 8.0 STIG                                    v1.0.0 │
├─────────────────────────────────────────────────────────────────┤
│ Target:  Database → MySQL                                       │
│ Standard: STIG                     OS Family: Cross-Platform     │
│ Category: Databases                Vendor: Oracle                │
│ Maintainer: MITRE SAF             Technology: InSpec            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AWS RDS MySQL 5.7 CIS                                    v1.0.0 │
├─────────────────────────────────────────────────────────────────┤
│ Target:  Cloud Service → Database                               │
│ Standard: CIS                      OS Family: Cloud-Native       │
│ Category: Cloud Infrastructure     Vendor: AWS                   │
│ Maintainer: MITRE SAF             Technology: InSpec            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Docker CE CIS Benchmark                                  v1.1.0 │
├─────────────────────────────────────────────────────────────────┤
│ Target:  Container → Docker                                     │
│ Standard: CIS                      OS Family: Cross-Platform     │
│ Category: Container Platforms      Vendor: Open Source           │
│ Maintainer: MITRE SAF             Technology: InSpec            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structure (JSON)

```json
{
  "profile_id": "rhel-8-stig",
  "name": "Red Hat Enterprise Linux 8 STIG",
  "version": "1.0.0",

  "target": {
    "type": "Operating System",
    "subtype": "Linux",
    "specific": "RHEL 8"
  },

  "classification": {
    "standard": "STIG",
    "category": "Operating Systems",
    "os_family": "Linux",
    "vendor": "Red Hat"
  },

  "profile_info": {
    "maintainer": "MITRE SAF",
    "technology": "InSpec",
    "github": "https://github.com/mitre/redhat-enterprise-linux-8-stig-baseline"
  }
}
```

## Use Case Examples

### 1. "Show me all Linux STIGs"
```
Filters:
  OS Family:  Linux
  Standard:   STIG

Results: (7 profiles)
  - Red Hat 6 STIG
  - Red Hat 7 STIG
  - Red Hat 8 STIG
  - Ubuntu 16.04 STIG
  - Ubuntu 20.04 STIG
  - VMware Photon OS 3.0 STIG
  - VMware Photon OS 4.0 STIG
```

### 2. "Show me all VMware products"
```
Filters:
  Vendor: VMware

Results: (21 profiles)
  - VMware ESXi 6.5/6.7 STIG
  - VMware vSphere 7.0 STIG
  - VMware VCSA 6.7/7.0 STIG
  - VMware NSX 4.x STIG
  - ... (all VMware products)
```

### 3. "Show me all CIS Benchmarks"
```
Filters:
  Standard: CIS

Results: (11 profiles)
  - AWS CIS
  - GCP CIS Benchmark
  - Docker CE CIS
  - Kubernetes CIS
  - Oracle MySQL 5.7 CIS
  - ... (all CIS benchmarks)
```

### 4. "Show me database security profiles"
```
Filters:
  Category: Databases

Results: (15+ profiles)
  - SQL Server (Windows)
  - MySQL (various versions)
  - PostgreSQL (various versions)
  - Oracle Database (various versions)
  - MongoDB STIG
  - AWS RDS variants
```

### 5. "Show me everything for Windows environments"
```
Filters:
  OS Family: Windows

Results: (10+ profiles)
  - Windows 10/2012/2016/2019 STIG
  - IIS 8.5 Server/Site STIG
  - SQL Server 2014 Database/Instance STIG
  - (any other Windows-specific tools)
```

## Filter Combinations (Boolean AND)

```
Standard: STIG  +  OS Family: Linux  +  Vendor: Red Hat
→ Red Hat 6/7/8 STIG (3 profiles)

Category: Databases  +  Standard: CIS
→ MySQL, Oracle CIS benchmarks (2-3 profiles)

Target Type: Virtualization  +  Vendor: VMware
→ All VMware virtualization products (21 profiles)
```

## Benefits Visualization

```
CURRENT STATE                      PROPOSED STATE
┌──────────────┐                  ┌──────────────┐
│ 56 profiles  │                  │  7 profiles  │
│ "Cross       │    ────────→     │  "Linux"     │
│  Platform"   │                  │              │
└──────────────┘                  │  4 profiles  │
                                  │  "Windows"   │
MEANINGLESS                       │              │
                                  │ 15 profiles  │
                                  │  "Virtual-   │
                                  │   ization"   │
                                  │              │
                                  │ ... etc      │
                                  └──────────────┘
                                  MEANINGFUL
```
