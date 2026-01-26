# SAF Site Vision

## What We're Building

A **self-maintaining documentation site** for the MITRE SAF ecosystem. Content includes:
- Validation profiles (InSpec baselines for RHEL, Windows, AWS, etc.)
- Hardening content (Ansible, Chef, Terraform automation)
- Tools (SAF CLI, Heimdall, Vulcan)
- Training and media (courses, videos, presentations)

## The Problem

Keeping the site current requires manual work:
- New SAF CLI release → someone manually updates the site
- New profile published → someone manually adds it
- README changes upstream → someone manually syncs it

This doesn't scale. Content gets stale. Manual work is error-prone.

## The Solution

**One CLI that serves everyone:**

| User | Mode | Example |
|------|------|---------|
| Developer | Interactive TUI | `pnpm cli content add` → guided wizard |
| CI/CD | Non-interactive | `pnpm cli content add <url> --yes --json` |
| Community | Either | Same commands, their choice |

**Same CLI. Same capabilities. Different interaction modes.**

A human can do anything CI/CD can do. CI/CD can do anything a human can do.

## The Four Components

### 1. Database (SQLite + Drizzle)

Single source of truth for all content metadata.

- **35 tables**: content, organizations, tools, targets, standards, etc.
- **SQL-level FK constraints**: data integrity enforced by database
- **Git-tracked**: `diffable/` directory, every change is reviewable
- **Schema-driven**: Drizzle schema → Zod validation → CLI

### 2. CLI (One Interface, Two Modes)

**Generic commands** - work with ANY table:
```bash
pnpm cli table list organizations --json
pnpm cli table add targets --data '{"name":"RHEL 9"}'
pnpm cli table show content abc123
```

**Domain commands** - business logic for specific workflows:
```bash
# Human: interactive wizard
pnpm cli content add
# → Prompts for URL, fetches GitHub, parses inspec.yml, guides through fields

# CI/CD: all params via flags
pnpm cli content add https://github.com/mitre/rhel-9-stig-baseline \
  --type validation --target "RHEL 9" --yes --json
```

**Same result either way.**

### 3. Website (VitePress Static Site)

- Queries SQLite at build time
- Outputs static HTML (no runtime database)
- Vue 3 + shadcn-vue components
- Browse/filter content by type, target, standard, organization

### 4. CI/CD (GitHub Actions)

Automation that keeps content current:

```
SAF CLI release     ──┐
Profile release     ──┼──► GitHub Action ──► CLI commands ──► PR
Community PR        ──┘
```

The Action runs the SAME CLI commands a human would run.

## How It All Connects

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

## CLI Architecture

### Generic Commands (table.ts)

Pure CRUD wrapper - no business logic:

```
table.ts (Commander - thin)
    │
    ├── table.cli.ts (formatting)
    │   └── formatTableList(), formatTableRecord()
    │
    └── drizzle.ts (data layer)
        └── listRecords(), getRecord(), createRecord(), etc.
```

### Domain Commands (content.ts)

Business logic for content workflows:

```
content.ts (Commander - thin)
    │
    ├── content.cli.ts (parsing/formatting)
    │   └── parseAddArgs(), formatAddResult()
    │
    ├── content.logic.ts (orchestration)
    │   └── prepareContentAdd(), prepareContentUpdate()
    │
    ├── content-service.ts (business logic)
    │   └── buildContentFromRepo(), resolveContentFKs()
    │
    ├── github.ts (external integration)
    │   └── fetchRepoInfo(), fetchInspecYml()
    │
    └── drizzle.ts (data layer)
```

### Interactive vs Non-Interactive

Same commands, different input source:

| Mode | Flags | Behavior |
|------|-------|----------|
| Interactive | (none) | @clack/prompts TUI, guided wizard |
| Non-interactive | `--yes --json` | All params via flags, structured output |

Detection: `isNonInteractive()` checks for `--yes`, `--json`, or `--quiet`

## Success Criteria

1. **Developer adds profile** → Works via TUI or flags
2. **CI/CD adds profile** → Same command with `--yes --json`
3. **Upstream release** → Action creates PR automatically
4. **Community contribution** → CLI validates, PR for review
5. **Zero stale content** → Automation keeps everything current

## Why This Matters

- **One interface** for humans and automation
- **Scales** without more manual work
- **Auditable** - every change is a git commit
- **Community-friendly** - easy contribution path
- **Maintainable** - developers focus on features, not data entry
