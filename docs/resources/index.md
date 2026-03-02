---
title: HDF Examples
layout: doc
aside: false
wideLayout: true
---

# HDF Examples

The MITRE Heimdall(tm) Data Format (HDF) is a standardized JSON structure for representing security findings from any tool. This page walks through HDF from the ground up — starting with a minimal example, building to real-world conversions.

**[HDF Schema](/resources/schema)** | **[Normalize](/framework/normalize)**

## Minimal HDF File

Every HDF file follows the same top-level structure. The example below includes all fields required by the [HDF JSON schema](https://github.com/mitre/heimdall2/blob/master/libs/inspecjs/schemas/exec-json.json), plus a few commonly-used optional fields (marked below).

```json
{
  "platform": {
    "name": "ubuntu",
    "release": "22.04"
  },
  "version": "4.18.100",
  "statistics": {},
  "profiles": [
    {
      "name": "my-security-baseline",
      "sha256": "a1b2c3d4e5f6...",
      "supports": [],
      "attributes": [],
      "groups": [],
      "controls": [
        {
          "id": "SSH-01",
          "title": "SSH root login should be disabled",
          "desc": "Remote root login increases the attack surface.",
          "impact": 0.7,
          "tags": { "nist": ["AC-6", "IA-2"] },
          "refs": [],
          "source_location": {},
          "results": [
            {
              "code_desc": "SSHD Configuration PermitRootLogin is expected to eq \"no\"",
              "start_time": "2025-01-15T10:30:00Z",
              "status": "passed",
              "run_time": 0.003
            }
          ]
        }
      ]
    }
  ]
}
```

**Root object** — all required:

| Field | Purpose |
|-------|---------|
| `platform` | The target system assessed — contains required `name` and `release` fields |
| `version` | Version of the tool that produced this HDF file |
| `profiles` | Array of security baselines used for the assessment (STIG, CIS Benchmark, custom profile) |
| `statistics` | Summary data such as `duration` (all inner fields are optional) |

**Profile** — required fields shown, plus common optional fields `title`, `version`, `status`, `summary`:

| Field | Purpose |
|-------|---------|
| `name` | Unique identifier for the profile |
| `sha256` | Checksum for integrity verification |
| `supports` | Platform targets this profile is designed for |
| `attributes` | Input parameters used during the assessment |
| `groups` | Logical groupings of controls |
| `controls` | The individual security requirements and their results |

**Control** — required fields shown, plus common optional fields `title`, `desc`, `code`:

| Field | Purpose |
|-------|---------|
| `id` | Unique control identifier (e.g. `V-75443`, `C-1.1.1.1`) |
| `impact` | Severity as a numeric value (0.0–1.0): 0.7 = high, 0.5 = medium, 0.3 = low |
| `tags` | Metadata including NIST SP 800-53 mappings — the common thread across all security data |
| `refs` | External references (URLs, documents) |
| `source_location` | File location of the control source (all inner fields optional) |
| `results` | Array of test outcomes |

**Result** — required fields shown, plus common optional fields `status`, `run_time`, `message`:

| Field | Purpose |
|-------|---------|
| `code_desc` | Human-readable description of what was tested |
| `start_time` | Timestamp when the test ran |

## Normalization in Action

HDF's value is clearest when you see a conversion from a tool's native output into the normalized format. Here is a real example using [Nikto](https://cirt.net/Nikto2), a popular web server scanner.

### Nikto Native Output

Nikto produces a flat JSON file with a list of vulnerabilities. Each finding has an ID, message, HTTP method, and URL — but no NIST control mapping, no severity rating, and no structured test results:

```json
{
  "banner": "Apache/2.2.6 (Win32) mod_ssl/2.2.6 OpenSSL/0.9.8e",
  "host": "zero.webappsecurity.com",
  "ip": "54.82.22.214",
  "port": "443",
  "vulnerabilities": [
    {
      "OSVDB": "0",
      "id": "999957",
      "method": "GET",
      "msg": "The anti-clickjacking X-Frame-Options header is not present.",
      "url": "/"
    },
    {
      "OSVDB": "0",
      "id": "600050",
      "method": "HEAD",
      "msg": "Apache/2.2.6 appears to be outdated (current is at least Apache/2.4.41).",
      "url": "/"
    }
  ]
}
```

### Convert with MITRE SAF CLI(tm)

```bash
saf convert nikto2hdf -i nikto-scan.json -o nikto-hdf.json
```

### Normalized HDF Output

The same findings now have a consistent structure — each vulnerability becomes a `control` with NIST SP 800-53 mappings, CCI identifiers, an impact score, and structured test results:

```json
{
  "platform": {
    "name": "Heimdall Tools",
    "release": "2.12.6",
    "target_id": "Host: zero.webappsecurity.com Port: 443"
  },
  "version": "2.12.6",
  "statistics": {},
  "profiles": [
    {
      "name": "Nikto Website Scanner",
      "title": "Nikto Target: Host: zero.webappsecurity.com Port: 443",
      "summary": "Banner: Apache/2.2.6 (Win32) mod_ssl/2.2.6 OpenSSL/0.9.8e",
      "status": "loaded",
      "controls": [
        {
          "id": "999957",
          "title": "The anti-clickjacking X-Frame-Options header is not present.",
          "desc": "The anti-clickjacking X-Frame-Options header is not present.",
          "impact": 0.5,
          "tags": {
            "nist": ["AC-3", "SA-11", "RA-5"],
            "cci": ["CCI-000213", "CCI-003173", "CCI-001643"]
          },
          "results": [
            {
              "status": "failed",
              "code_desc": "URL : / Method: GET",
              "start_time": ""
            }
          ]
        },
        {
          "id": "600050",
          "title": "Apache/2.2.6 appears to be outdated (current is at least Apache/2.4.41).",
          "desc": "Apache/2.2.6 appears to be outdated (current is at least Apache/2.4.41).",
          "impact": 0.5,
          "tags": {
            "nist": ["SI-2"],
            "cci": ["CCI-002605"]
          },
          "results": [
            {
              "status": "failed",
              "code_desc": "URL : / Method: HEAD",
              "start_time": ""
            }
          ]
        }
      ]
    }
  ]
}
```

| What Changed | Details |
|-------------|---------|
| **Structure** | Flat vulnerability list became nested `profiles` > `controls` > `results` |
| **NIST Mapping** | Each finding now maps to NIST SP 800-53 controls (AC-3, SA-11, RA-5, SI-2) |
| **CCI Identifiers** | DoD Control Correlation Identifiers added for STIG/RMF compatibility |
| **Impact Score** | Numeric severity (0.5 = medium) applied based on finding type |
| **Target Context** | Host, port, and banner preserved in `platform` and `summary` |

::: info Where did the NIST and CCI tag values come from?
MITRE SAF's converter library for Nikto data includes logic to add the NIST SP 800-53 control mappings and Control Correlation Identifiers based on Nikto's function and purpose. In other words, where data is missing from the original data format, HDF converters will fill it in based on the tool's known capabilities and the type of finding. This is a key part of normalization — enriching sparse tool output with the metadata needed for unified compliance analysis.
:::

This normalized output can be viewed in [MITRE Heimdall(tm)](/apps/heimdall) alongside results from any other security tool for unified analysis. Note that the same libraries that MITRE SAF CLI(tm) uses to convert data are built into MITRE Heimdall(tm), meaning that you can pass the pre-converted file (in this case, the raw Nikto file) to MITRE Heimdall(tm) and it will be displayed as HDF automatically.

### CIS Benchmark Template

InSpec controls for CIS Benchmarks include CIS-specific tags (`cis_scored`, `cis_version`, `cis_level`, `cis_controls`) that are preserved in HDF output:

```ruby
# encoding: UTF-8

control "C-1.1.1.1" do
  title "Ensure mounting of cramfs filesystems is disabled"
  desc "The `cramfs` filesystem type is a compressed read-only Linux
    filesystem embedded in small footprint systems. A `cramfs` image
    can be used without having to first decompress the image."

  desc "rationale", "Removing support for unneeded filesystem types
    reduces the local attack surface of the server. If this filesystem
    type is not needed, disable it."

  impact 0.7
  tag severity: 'high'
  tag nist: ["CM-6"]
  tag cis_scored: true
  tag cis_version: 1.2.0
  tag cis_level: 3
  tag cis_controls: ["5.1"]
  tag cis_cdc_version: 7
  tag cis_rid: "1.1.1.1"

  desc "check", "Run the following commands and verify the output
    is as indicated:
    # modprobe -n -v cramfs | grep -v mtd
    install /bin/true
    # lsmod | grep cramfs"

  desc "fix", "Edit or create a file in the `/etc/modprobe.d/`
    directory ending in .conf
    Example: `vi /etc/modprobe.d/cramfs.conf`
    and add the following line:
    install cramfs /bin/true
    Run the following command to unload the `cramfs` module:
    # rmmod cramfs"

  describe kernel_module('cramfs') do
    it { should_not be_loaded }
    it { should be_disabled }
    it { should be_blacklisted }
  end
end
```

### DISA STIG Template

STIG-aligned controls include DoD-specific tags (`gtitle`, `gid`, `rid`, `stig_id`, `fix_id`, `cci`) and additional metadata for false negatives, documentability, and mitigation controls:

```ruby
control 'V-75443' do
  title "The Ubuntu operating system must limit the number of
    concurrent sessions to ten for all accounts and/or account types."
  desc "Ubuntu operating system management includes the ability to
    control the number of users and user sessions that utilize an
    Ubuntu operating system. Limiting the number of allowed users and
    sessions per user is helpful in reducing the risks related to DoS
    attacks."

  impact 0.3
  tag "gtitle": 'SRG-OS-000027-GPOS-00008'
  tag "gid": 'V-75443'
  tag "rid": 'SV-90123r2_rule'
  tag "stig_id": 'UBTU-16-010070'
  tag "fix_id": 'F-82071r1_fix'
  tag "cci": ['CCI-000054']
  tag "nist": %w[AC-10 Rev_4]
  tag "false_negatives": nil
  tag "false_positives": nil
  tag "documentable": false
  tag "mitigations": nil
  tag "severity_override_guidance": false
  tag "potential_impacts": nil
  tag "third_party_tools": nil
  tag "mitigation_controls": nil
  tag "responsibility": nil
  tag "ia_controls": nil

  desc 'check', "Verify that the Ubuntu operating system limits the
    number of concurrent sessions to \"10\" for all accounts and/or
    account types by running the following command:

    # grep maxlogins /etc/security/limits.conf

    The result must contain the following line:
    * hard maxlogins 10

    If the \"maxlogins\" item is missing or the value is not set to
    \"10\" or less, or is commented out, this is a finding."

  desc 'fix', "Configure the Ubuntu operating system to limit the
    number of concurrent sessions to ten for all accounts and/or
    account types.

    Add the following line to the top of the /etc/security/limits.conf:
    * hard maxlogins 10"

  describe limits_conf do
    its('*') { should include ['hard', 'maxlogins', input('maxlogins').to_s] }
  end
end
```

| Tag | CIS | STIG | Purpose |
|-----|-----|------|---------|
| `nist` | Yes | Yes | NIST SP 800-53 control mapping |
| `impact` | Yes | Yes | Severity (0.0–1.0) |
| `cis_level` | Yes | — | CIS benchmark level (1, 2, or 3) |
| `cis_scored` | Yes | — | Whether the control is scored |
| `cis_controls` | Yes | — | CIS Critical Security Controls mapping |
| `cci` | — | Yes | DoD Control Correlation Identifier |
| `gtitle` | — | Yes | STIG Group Title (SRG identifier) |
| `stig_id` | — | Yes | STIG rule identifier |
| `fix_id` | — | Yes | STIG fix identifier |
| `rid` | — | Yes | Rule version identifier |

Both CIS and STIG tags are preserved in the HDF output alongside the core elements.
