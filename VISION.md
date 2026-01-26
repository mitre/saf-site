# SAF Site Vision

## What This Is

The **MITRE SAF Site** is a documentation and catalog site for the Security Automation Framework ecosystem. It showcases:

- **Validation profiles** - InSpec profiles for RHEL, Windows, AWS, databases, etc.
- **Hardening content** - Ansible, Chef, Terraform for automated remediation
- **Tools** - SAF CLI, Heimdall, Vulcan
- **Training** - Courses, tutorials, conference talks
- **Media** - Videos, presentations, documentation

## The Problem We're Solving

Currently, keeping the site updated requires manual work:
- Someone notices a new SAF CLI release → manually updates the site
- A new profile is published → manually adds it
- README changes → manually syncs description
- Version bumps → manual updates everywhere

This doesn't scale. Content gets stale. Manual work is error-prone.

## The Solution: Self-Maintaining Site

```
UPSTREAM EVENT                              RESULT
──────────────                              ──────
SAF CLI v1.5.0 released     ──┐
                              │
New profile published       ──┼──► GitHub Action ──► CLI ──► PR ──► Review ──► Merge ──► Site Updated
                              │
README updated              ──┘
Community contributes       ──┘
```

**Zero manual intervention for routine updates.**

## The Four Pillars

### 1. Database (SQLite + Drizzle)

Single source of truth for all content metadata.

- **35 tables**: content, organizations, tools, targets, standards, etc.
- **SQL-level FK constraints**: data integrity enforced by database
- **Git-tracked**: `diffable/` directory contains NDJSON export, every change is reviewable
- **Schema-driven**: Drizzle schema is the source of truth, generates Zod validation

### 2. CLI (Schema-Driven CRUD)

The interface for humans AND automation.

**For Developers:**
```bash
pnpm cli content add https://github.com/mitre/rhel-9-stig-baseline
# Interactive TUI guides through fields, pre-fills from GitHub/inspec.yml
```

**For CI/CD:**
```bash
pnpm cli content add https://github.com/mitre/rhel-9-stig-baseline \
  --type validation --vendor MITRE --yes --json
# Non-interactive, structured output, proper exit codes
```

**Generic CRUD for any table:**
```bash
pnpm cli table list organizations --json
pnpm cli table add tools --data '{"name":"New Tool"}'
```

### 3. Website (VitePress Static Site)

Documentation site built from the database.

- **Build-time queries**: VitePress data loaders query SQLite during build
- **Static output**: No runtime database, pure HTML/JS
- **Vue 3 + shadcn-vue**: Modern component library
- **Browse/filter content**: By type, target, standard, organization

### 4. CI/CD (GitHub Actions)

Automation that keeps content current.

**Triggers:**
- Upstream release (SAF CLI, profiles)
- Scheduled checks
- Repository dispatch from other repos

**Actions:**
- Run CLI commands to add/update content
- Validate data integrity
- Create PR with changes
- Include changelog in PR description

## How The Pieces Connect

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GITHUB ACTIONS                                   │
│  Watches: mitre/saf, mitre/*-baseline, community repos                  │
│  Triggers: release, schedule, repository_dispatch                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLI                                         │
│  pnpm cli content add-release <slug> --version X.Y.Z --yes --json       │
│  pnpm cli tool update saf-cli --version 1.5.0 --yes --json              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE                                       │
│  SQLite + Drizzle                                                       │
│  Changes written to drizzle.db → exported to diffable/ → git commit    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PR CREATED                                       │
│  "Update RHEL 9 STIG Baseline to v1.5.0"                                │
│  - Shows diff of diffable/ changes                                      │
│  - Validated by CLI before commit                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MERGE → SITE REBUILD                                │
│  VitePress queries updated database                                     │
│  Static site regenerated                                                │
│  Deployed automatically                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Current Progress

| Phase | Status | Description |
|-------|--------|-------------|
| 1. DRY Foundation | ✅ DONE | fk-utils, field-mapping utilities |
| 2. db-diffable | ✅ DONE | Export/import with FK ordering, formats |
| 3. Database Migration | ✅ DONE | SQLite + Drizzle, data migrated |
| 4. CLI CRUD | 🔄 IN PROGRESS | Generic table commands, service layer |
| 5. Loaders | BLOCKED | Update VitePress to query Drizzle |
| 6. Automation | BLOCKED | Release management CLI commands |
| 7. CI/CD | BLOCKED | GitHub Actions workflows |

## Success Criteria

1. **New SAF CLI release** → Site updated within hours, no human action
2. **New profile published** → Automatically added with metadata from inspec.yml
3. **Community contribution** → CLI validates, PR created for review
4. **README changes** → Synced automatically on schedule
5. **Zero stale content** → Everything tracks upstream sources

## Why This Matters

- **Scales**: Handles growth without more manual work
- **Accurate**: Always reflects current state of ecosystem
- **Auditable**: Every change is a git commit with context
- **Community-friendly**: Easy contribution path
- **Maintainable**: Developers focus on features, not data entry
