# SAF Site CLI

Command-line tool for managing SAF site content and database.

## Usage

The CLI is part of the saf-site-vitepress monorepo. From the project root:

```bash
# Run any CLI command
pnpm cli <command> [options]

# Examples
pnpm cli --help
pnpm cli content list
pnpm cli content add https://github.com/mitre/some-repo
pnpm cli db status
```

## Commands

### Content Management

#### List Content

```bash
# List all content
pnpm cli content list

# Filter by type
pnpm cli content list --type validation
pnpm cli content list --type hardening

# Filter by status
pnpm cli content list --status active

# Output as JSON
pnpm cli content list --json
```

#### Show Content Details

```bash
# Show by ID
pnpm cli content show abc123

# Show by slug
pnpm cli content show --slug rhel-9-stig

# Output as JSON
pnpm cli content show abc123 --json
```

#### Add Content from GitHub

Add a new validation profile or hardening guide from a GitHub repository:

```bash
# Interactive mode (prompts for missing info)
pnpm cli content add https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline

# With all options specified (non-interactive)
pnpm cli content add https://github.com/mitre/redhat-enterprise-linux-9-stig-baseline \
  --type validation \
  --vendor MITRE \
  --standard "DISA STIG" \
  --technology InSpec \
  --target "Red Hat Enterprise Linux 9" \
  --maintainer "SAF Team" \
  --yes

# Dry run (validate without creating)
pnpm cli content add https://github.com/mitre/some-repo --dry-run

# Quiet mode (output only slug on success)
pnpm cli content add https://github.com/mitre/some-repo --quiet
```

The CLI automatically:
- Fetches repository metadata from GitHub
- Parses `inspec.yml` for InSpec profiles (name, version, summary)
- Extracts control count from README
- Generates a URL-friendly slug
- Resolves FK references (vendor, standard, technology, target, maintainer)

#### Update Content

```bash
# Update specific fields
pnpm cli content update abc123 --status active --version 1.2.0

# Update FK references
pnpm cli content update abc123 --vendor MITRE --standard "CIS Benchmark"
```

### Database Management

#### Check Status

```bash
# Check connection and show collection stats
pnpm cli db status
```

#### Export Database

```bash
# Export to git-friendly format
pnpm cli db export
```

#### Validate Database

```bash
# Check integrity and FK references
pnpm cli db validate
```

#### Show FK Lookups

```bash
# Show all lookup values
pnpm cli db lookups

# Show specific collection
pnpm cli db lookups organizations
pnpm cli db lookups standards
pnpm cli db lookups technologies
pnpm cli db lookups targets
```

#### Audit Slugs

```bash
# Check slug convention compliance
pnpm cli db audit

# Show suggested fixes
pnpm cli db audit --fix
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POCKETBASE_URL` | `http://localhost:8090` | Pocketbase server URL |
| `POCKETBASE_ADMIN_EMAIL` | `admin@localhost.com` | Admin email |
| `POCKETBASE_ADMIN_PASSWORD` | `testpassword123` | Admin password |
| `GITHUB_TOKEN` | (optional) | GitHub token for higher rate limits |

## Output Formats

Most commands support multiple output formats:

- **Interactive** (default): Colored, formatted output for terminal use
- **JSON** (`--json`): Machine-readable JSON output
- **Quiet** (`--quiet`): Minimal output (just IDs/slugs)

## Non-Interactive Mode

For CI/CD or scripting, use `--yes` to skip confirmation prompts:

```bash
pnpm cli content add https://github.com/org/repo --type validation --yes
```

## Examples

### Add a New InSpec Profile

```bash
# 1. Check what lookup values are available
pnpm cli db lookups

# 2. Add the profile (interactive)
pnpm cli content add https://github.com/mitre/aws-rds-oracle-mysql-ee-8-cis-baseline

# 3. Verify it was added
pnpm cli content list --type validation

# 4. Export for git commit
pnpm cli db export
```

### Bulk Operations with Scripts

```bash
# Add multiple profiles
for repo in rhel-9-stig ubuntu-22-cis mysql-8-stig; do
  pnpm cli content add "https://github.com/mitre/${repo}-baseline" \
    --type validation \
    --vendor MITRE \
    --yes --quiet
done

# Validate after bulk import
pnpm cli db validate
```

### CI/CD Integration

```bash
# Validate database integrity
pnpm cli db validate || exit 1

# Check slug conventions
pnpm cli db audit || echo "Warning: Some slugs need attention"
```

## Development

```bash
# Run tests (from project root)
pnpm cli:test

# Or from cli directory
cd cli && pnpm test:run

# Watch mode
cd cli && pnpm test

# Build
pnpm cli:build
```

## Architecture

The CLI follows a layered architecture:

```
src/
├── index.ts              # Entry point, commander setup
├── commands/
│   ├── content.ts        # Content subcommands (list, show, add, update)
│   ├── content.cli.ts    # CLI handlers (I/O, prompts, formatting)
│   ├── content.logic.ts  # Business logic (validation, transformation)
│   ├── db.ts             # Database subcommands
│   └── db.cli.ts         # Database CLI handlers
└── lib/
    ├── pocketbase.ts     # Pocketbase client, FK maps
    ├── github.ts         # GitHub API client
    ├── content-service.ts # Content building, diffing
    ├── cli-utils.ts      # Output formatting utilities
    └── validation-schemas.ts # Zod validation schemas
```

See [SPEC.md](SPEC.md) for detailed technical specification.
