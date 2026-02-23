---
title: HDF Schema Reference
layout: doc
aside: false
wideLayout: true
---

# HDF Schema Reference

The MITRE Heimdall(tm) Data Format (HDF) schema defines the structure for security assessment results. The schema is a [JSON Schema](https://json-schema.org/) document maintained in the [heimdall2 repository](https://github.com/mitre/heimdall2/blob/master/libs/inspecjs/schemas/exec-json.json).

**[View Schema on GitHub](https://github.com/mitre/heimdall2/blob/master/libs/inspecjs/schemas/exec-json.json)** | **[HDF Examples](/resources/)** | **[Download Schema](/exec-json-schema.json)**

## Interactive Schema

Expand and collapse sections to explore the full [HDF JSON Schema](https://github.com/mitre/heimdall2/blob/master/libs/inspecjs/schemas/exec-json.json).

<SchemaViewer src="/exec-json-schema.json" :expand-depth="3" />

## Root Object

All four fields are required.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | object | Yes | Information about the target system |
| `version` | string | Yes | Version of the tool that generated the findings |
| `profiles` | array | Yes | Array of security baselines and their results |
| `statistics` | object | Yes | Summary statistics (inner fields are all optional) |

## Platform

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Platform name (e.g. `"ubuntu"`, `"windows"`) |
| `release` | string | Yes | Platform version (e.g. `"22.04"`, `"10.0.19041"`) |
| `target_id` | string | No | Additional identifier (hostname, IP, etc.) |

## Profile

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique profile identifier |
| `sha256` | string | Yes | Profile checksum for integrity verification |
| `supports` | array | Yes | Platform targets this profile supports |
| `attributes` | array | Yes | Input parameters used during the run |
| `groups` | array | Yes | Logical groupings of controls |
| `controls` | array | Yes | The security requirements and test results |
| `title` | string | No | Human-readable profile title |
| `version` | string | No | Profile version |
| `summary` | string | No | Profile description |
| `maintainer` | string | No | Profile maintainer |
| `copyright` | string | No | Copyright holder |
| `copyright_email` | string | No | Contact email |
| `license` | string | No | License identifier (e.g. `"Apache-2.0"`) |
| `status` | string | No | Load status (`"loaded"`, `"failed"`, `"skipped"`) |
| `status_message` | string | No | Explanation when status is not `"loaded"` |
| `depends` | array | No | Profile dependencies |
| `parent_profile` | string | No | Parent profile name for overlays |

## Control

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique control identifier (e.g. `"V-75443"`, `"C-1.1.1.1"`) |
| `impact` | number | Yes | Severity: `0.0`–`1.0` (0.7 = high, 0.5 = medium, 0.3 = low, 0.0 = informational) |
| `tags` | object | Yes | Metadata tags — typically includes `nist` (NIST SP 800-53 controls) and `cci` (DoD identifiers) |
| `refs` | array | Yes | External references (URLs, documents) |
| `source_location` | object | Yes | File location of the control source (inner fields optional) |
| `results` | array | Yes | Test outcomes |
| `title` | string | No | Human-readable control title |
| `desc` | string | No | Control description |
| `descriptions` | array | No | Structured descriptions (check text, fix text) as `{label, data}` pairs |
| `code` | string | No | Source code of the control |
| `waiver_data` | object | No | Waiver information if control was waived |
| `attestation_data` | object | No | Manual attestation record |

## Result

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code_desc` | string | Yes | Human-readable description of what was tested |
| `start_time` | string | Yes | ISO 8601 timestamp when the test ran |
| `status` | string | No | `"passed"`, `"failed"`, `"skipped"`, or `"error"` |
| `run_time` | number | No | Execution duration in seconds |
| `message` | string | No | Failure explanation or additional detail |
| `skip_message` | string | No | Reason the test was skipped |
| `exception` | string | No | Exception type if status is `"error"` |
| `resource` | string | No | InSpec resource type used |
| `resource_id` | string | No | Resource identifier |
| `backtrace` | array | No | Stack trace if an error occurred |

## Statistics

The `statistics` object is required at the root level, but all inner fields are optional:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `duration` | number | No | Total runtime in seconds |
| `controls` | object | No | Breakdown with `passed`, `failed`, `skipped` sub-objects, each containing a `total` count |

## Attestation Data

When a control includes manual attestation (for requirements that cannot be automated), all attestation fields are required:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `control_id` | string | Yes | The control being attested |
| `explanation` | string | Yes | Justification for the attestation |
| `frequency` | string | Yes | How often the attestation is reviewed |
| `status` | string | Yes | `"passed"` or `"failed"` |
| `updated` | string | Yes | When the attestation was last updated |
| `updated_by` | string | Yes | Who performed the attestation |

## Validating HDF Files

You can validate any HDF file against the schema using a JSON Schema validator:

```bash
# Using ajv-cli (Node.js)
npx ajv-cli validate \
  -s https://raw.githubusercontent.com/mitre/heimdall2/master/libs/inspecjs/schemas/exec-json.json \
  -d my-results.json

# Using MITRE SAF CLI(tm) (validates during conversion)
saf convert nikto2hdf -i scan.json -o results.json
```

## Related Resources

- **[HDF Examples](/resources/)** — Minimal examples and real conversion walkthroughs
- **[Normalize](/framework/normalize)** — Why normalization matters and which tools are supported
- **[MITRE SAF CLI(tm)](/apps/saf-cli)** — Convert security tool output to HDF
- **[MITRE Heimdall(tm)](/apps/heimdall)** — Visualize HDF files
- **[Schema Source (GitHub)](https://github.com/mitre/heimdall2/blob/master/libs/inspecjs/schemas/exec-json.json)** — The canonical JSON Schema definition
