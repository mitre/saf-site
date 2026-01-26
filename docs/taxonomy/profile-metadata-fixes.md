# Profile Metadata Cleanup Recommendations

## CRITICAL ISSUES IDENTIFIED

### 1. Platform Field Issues
**Problem:** 56/78 profiles marked as "Cross Platform" when they're OS-specific

### 2. Category Overuse
**Problem:** 50/78 profiles using generic "Platform Security" category - needs specificity

### 3. Vendor Inconsistency
**Problem:** Windows/VMware profiles showing wrong vendor

---

## RECOMMENDED METADATA STRUCTURE

### Platform Values (should be standardized):
- **Linux** - RHEL, Ubuntu, Photon OS
- **Windows** - Windows 10, Server 2012/2016/2019
- **Cloud** - AWS, GCP, Azure services
- **Container** - Docker, Kubernetes
- **Virtualization** - VMware ESXi, vSphere
- **Database** - SQL Server, Oracle, MySQL, PostgreSQL, MongoDB (specify OS if relevant)
- **Web Server** - Apache, NGINX, IIS, Tomcat
- **Application** - JRE, JBoss

### Category Values (should be more specific):
- **Operating Systems**
- **Cloud Infrastructure**
- **Container Security**
- **Virtualization**
- **Database Systems**
- **Web Servers**
- **Application Servers**
- **Middleware**
- **Security Tools**

---

## SUGGESTED FIXES BY GROUP

### Linux Profiles (should be Platform: "Linux")
- Red Hat 6/7/8 STIG → Platform: "Linux", Category: "Operating Systems"
- Ubuntu 16.04/20.04 STIG → Platform: "Linux", Category: "Operating Systems"
- VMware Photon OS 3.0/4.0/5.0 STIG → Platform: "Linux", Category: "Operating Systems"

### Windows Profiles (should be Platform: "Windows")
- Windows 10/2012/2016/2019 STIG → Platform: "Windows", Category: "Operating Systems"
- IIS 8.5 Server/Site STIG → Platform: "Windows", Category: "Web Servers"

### Database Profiles (need OS context)
- **SQL Server** (Windows):
  - MSQL 2014 Database/Instance STIG → Platform: "Windows", Category: "Database Systems"
  - AWS MSQL 2014 STIG → Platform: "Cloud", Category: "Database Systems"

- **MySQL** (multi-platform):
  - Oracle MySQL 5.7/8.0 CIS/STIG → Platform: "Database" or "Multi-Platform", Category: "Database Systems"
  - AWS RDS MySQL 5.7 CIS → Platform: "Cloud", Category: "Database Systems"

- **Oracle Database** (multi-platform):
  - Oracle Database 12c/19c STIG/CIS → Platform: "Database" or "Multi-Platform", Category: "Database Systems"
  - AWS RDS Oracle Database 12c STIG → Platform: "Cloud", Category: "Database Systems"

- **PostgreSQL** (multi-platform):
  - PostgreSQL 9.x/10+ STIG → Platform: "Database" or "Multi-Platform", Category: "Database Systems"
  - AWS RDS PostgreSQL 9.x/10+ STIG → Platform: "Cloud", Category: "Database Systems"

- **MongoDB**:
  - MongoDB STIG → Platform: "Database" or "Multi-Platform", Category: "Database Systems"

### Web Server Profiles
- Apache HTTP Server 2.2/2.4x STIG → Platform: "Web Server" or OS-specific, Category: "Web Servers"
- NGINX STIG/SRG → Platform: "Web Server" or OS-specific, Category: "Web Servers"
- IIS 8.5 → Platform: "Windows", Category: "Web Servers"

### Application Server Profiles
- Tomcat 7/8 CIS → Platform: "Application Server", Category: "Application Servers"
- Apache Tomcat 9.x STIG → Platform: "Application Server", Category: "Application Servers"
- Red Hat JBoss EAP 6.3 STIG → Platform: "Application Server", Category: "Middleware"

### Container/Orchestration Profiles
- Docker CE CIS → Platform: "Container", Category: "Container Security"
- Kubernetes CIS → Platform: "Container", Category: "Container Orchestration"
- Kubernetes Cluster/Node STIG → Platform: "Container", Category: "Container Orchestration"
- K3s Cluster/Node STIG → Platform: "Container", Category: "Container Orchestration"
- GKE CIS Benchmark → Platform: "Cloud", Category: "Container Orchestration"

### VMware Profiles (Virtualization)
- VMware ESXi 6.5/6.7 STIG → Platform: "Virtualization", Category: "Hypervisor"
- VMware vSphere 7.0 STIG → Platform: "Virtualization", Category: "Virtualization Management"
- VMware VCSA 6.7/7.0 STIG → Platform: "Virtualization", Category: "Virtualization Management"
- VMware vSphere vCenter 7.0/8.0 STIG → Platform: "Virtualization", Category: "Virtualization Management"
- VMware vSphere VM 6.7 STIG → Platform: "Virtualization", Category: "Virtual Machine"
- VMware NSX/NSX-T STIG → Platform: "Virtualization", Category: "Network Virtualization"
- VMware Aria Automation/Operations STIG → Platform: "Virtualization", Category: "Cloud Management"
- VMware Cloud Director/Foundation STIG → Platform: "Virtualization", Category: "Cloud Management"
- VMware Horizon 8.0 STIG → Platform: "Virtualization", Category: "VDI"
- VMware Identity Manager STIG → Platform: "Virtualization", Category: "Identity Management"

### Cloud Profiles (AWS, GCP, Azure)
- AWS CIS/S3/RDS → Platform: "Cloud", Category: varies (Infrastructure, Storage, Database)
- GCP CIS/PCI-DSS → Platform: "Cloud", Category: "Cloud Infrastructure"
- Azure Security Benchmark → Platform: "Cloud", Category: "Cloud Security"
- GitHub Security → Platform: "Cloud", Category: "DevSecOps"

### Runtime/Language Profiles
- JRE 7/8 STIG → Platform: "Multi-Platform", Category: "Runtime Environment"

---

## VENDOR CORRECTIONS NEEDED

**Current Issues:**
- Windows profiles showing "VMware" as vendor → Should be "Microsoft"
- Many generic "MITRE SAF" → Should reflect actual profile maintainer/source

**Suggested Vendor Values:**
- Microsoft (Windows, SQL Server, IIS)
- Red Hat (RHEL profiles)
- Canonical (Ubuntu profiles)
- Oracle (Oracle Database, MySQL)
- VMware (VMware products)
- AWS (AWS services)
- Google (GCP services)
- MITRE SAF (for MITRE-developed baselines)

---

## RECOMMENDED APPROACH

### Option 1: Python Script (Automated)
Create a script to update all profiles in Pocketbase based on name patterns:
- Red Hat → Platform: "Linux"
- Windows → Platform: "Windows"
- VMware → Platform: "Virtualization"
- AWS/GCP/Azure → Platform: "Cloud"
- Docker/Kubernetes → Platform: "Container"

### Option 2: Manual Update (Precise)
Use Pocketbase Admin UI to manually update each profile for accuracy

### Option 3: Hybrid (Recommended)
1. Run automated script for obvious fixes (OS platforms)
2. Manually review/adjust complex cases (databases, multi-platform tools)
3. Export to diffable format and commit

---

## IMMEDIATE PRIORITIES

1. **Fix OS Platforms** (high impact, low risk):
   - Red Hat 6/7/8, Ubuntu → "Linux"
   - Windows 10/2012/2016/2019 → "Windows"
   - Photon OS → "Linux"

2. **Fix VMware Platforms** (clear category):
   - All VMware products → "Virtualization"

3. **Fix Container Platforms** (clear category):
   - Docker, Kubernetes, K3s → "Container"

4. **Review Database Platforms** (needs judgment):
   - Decide on approach: OS-specific vs. "Database" vs. "Multi-Platform"

5. **Standardize Categories**:
   - Replace generic "Platform Security" with specific categories
   - Use consistent naming (plural vs singular)
