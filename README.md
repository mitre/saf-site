# MITRE SAF Site

Documentation and resource hub for the MITRE Security Automation Framework (SAF).

Built with [VitePress](https://vitepress.dev/) and [Pocketbase](https://pocketbase.io/).

## Prerequisites

Before setting up the project, ensure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 22.x | [nodejs.org](https://nodejs.org/) or use nvm |
| pnpm | 10.x | `npm install -g pnpm` or `corepack enable` |
| sqlite-diffable | latest | `pip install -r requirements.txt` |

**Optional but recommended:**
- [nvm](https://github.com/nvm-sh/nvm) - Node version manager (auto-switches via `.nvmrc`)

## Setup

### Automated Setup (Recommended)

After cloning, run the setup script:

```bash
git clone https://github.com/mitre/saf-site-vitepress.git
cd saf-site-vitepress
./scripts/setup.sh
```

The script is **idempotent** - safe to run anytime (first-time setup, after `git pull`, etc.).

**Script options:**
```bash
./scripts/setup.sh              # Normal setup (safe, idempotent)
./scripts/setup.sh --check      # Validate setup without changes
./scripts/setup.sh --dry-run    # Preview what would happen
./scripts/setup.sh --force      # Force fresh database restore
./scripts/setup.sh --force -y   # CI/CD: non-interactive fresh setup
./scripts/setup.sh --help       # Show all options
```

### Manual Setup

If you prefer manual steps or need to troubleshoot:

### 1. Clone the Repository

```bash
git clone https://github.com/mitre/saf-site-vitepress.git
cd saf-site-vitepress
```

### 2. Install Node.js Dependencies

```bash
# If using nvm, this switches to the correct Node version
nvm use

# Install dependencies
pnpm install
```

### 3. Restore the Database

The database content is stored in a git-friendly format and must be restored before first use:

```bash
cd .pocketbase/pb_data
sqlite-diffable load data.db diffable/
cd ../..
```

This creates `data.db` from the version-controlled `diffable/` directory.

### 4. Clear Migrations (First-Time Only)

The diffable export includes the complete schema, so migrations are not needed. Clear them to avoid conflicts:

```bash
rm -rf .pocketbase/pb_migrations/*
```

> **Note:** Migrations are auto-generated during development. They're only needed if you're iterating on the schema, not for running the existing database.

### 5. Start Pocketbase

```bash
cd .pocketbase && ./pocketbase serve
```

Leave this terminal running. Pocketbase serves at:
- **API**: http://localhost:8090
- **Admin UI**: http://localhost:8090/_/
- **Login**: `admin@localhost.com` / `testpassword123`

### 6. Start the Dev Server

In a new terminal:

```bash
pnpm dev
```

Site runs at http://localhost:5173

## Quick Start (Returning Developers)

```bash
# Start Pocketbase (in background)
cd .pocketbase && ./pocketbase serve &

# Start dev server
pnpm dev
```

## Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm reload-data` | Reload data loaders (after Pocketbase edits) |

### Setup & Database

| Command | Description |
|---------|-------------|
| `pnpm setup` | Run setup (idempotent, safe anytime) |
| `pnpm setup:check` | Validate setup without changes |
| `pnpm setup:force` | Force fresh database restore |
| `pnpm db:export` | Export database to git-friendly format |
| `pnpm db:export:diff` | Export and show git diff |

### Database Backup (pb-cli)

Binary backups for disaster recovery. Requires [pb-cli](https://github.com/skeeeon/pb-cli).

| Command | Description |
|---------|-------------|
| `pnpm db:backup` | Create a binary backup |
| `pnpm db:backup:list` | List available backups |
| `pnpm db:backup:download <name>` | Download a backup file |
| `pnpm db:backup:restore <name>` | Restore from a backup |

**First-time pb-cli setup:**
```bash
# Install pb-cli (Go required)
go install github.com/skeeeon/pb-cli/cmd/pb@latest

# Create context for this project
pb context create local --url http://127.0.0.1:8090

# Authenticate (Pocketbase must be running)
pb auth pb --collection _superusers --email admin@localhost.com --password testpassword123
```

### Testing

| Command | Description |
|---------|-------------|
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |

### Task Tracking (Beads)

This project uses [Beads](https://github.com/steveyegge/beads) for task tracking. Tasks live in `.beads/` and sync with git.

| Command | Description |
|---------|-------------|
| `bd ready` | See available work (unblocked tasks) |
| `bd list --status=open` | List all open tasks |
| `bd show <id>` | View task details |
| `bd update <id> --status=in_progress` | Claim a task |
| `bd close <id>` | Complete a task |
| `bd sync` | Sync tasks with git remote |

## Common Workflows

### Daily Development

```bash
# Terminal 1: Start Pocketbase
cd .pocketbase && ./pocketbase serve

# Terminal 2: Start dev server
pnpm dev
```

Site available at http://localhost:5173

### After `git pull` (Sync Changes from Team)

```bash
# Run setup to restore any database changes
pnpm setup

# Restart Pocketbase if it was running
cd .pocketbase && ./pocketbase serve
```

### Adding/Editing Content

1. **Open Pocketbase Admin**: http://localhost:8090/_/
2. **Login**: `admin@localhost.com` / `testpassword123`
3. **Navigate to collection** (e.g., profiles, organizations)
4. **Edit or add records** - FK fields show searchable dropdowns
5. **Refresh dev server**: `pnpm reload-data`
6. **Export for git**: `pnpm db:export`
7. **Commit**: `git add .pocketbase/pb_data/diffable/ && git commit`

### Adding a New Validation Profile

1. Open Pocketbase Admin → **profiles** collection
2. Click **New record**
3. Fill required fields:
   - `name`: Display name (e.g., "RHEL 9 STIG")
   - `slug`: URL-friendly ID (e.g., "rhel-9-stig")
   - `description`: Brief description
   - `github_url`: GitHub repository URL
   - `organization`: Select from dropdown (MITRE, etc.)
   - `standard`: Select from dropdown (DISA STIG, etc.)
   - `technology`: Select from dropdown (RHEL, etc.)
4. Save → Export → Commit

### Running Tests Before Committing

```bash
# Run all tests
pnpm test:run

# Run with coverage
pnpm test:coverage

# Watch mode during development
pnpm test
```

### Building for Production

```bash
# Ensure Pocketbase is running
cd .pocketbase && ./pocketbase serve &

# Build static site
pnpm build

# Preview the build
pnpm preview
```

Output is in `docs/.vitepress/dist/`

### Creating a New Component

1. Create component in `docs/.vitepress/theme/components/`
2. Create colocated test file (`ComponentName.spec.ts`)
3. Register globally in `docs/.vitepress/theme/index.ts` if needed
4. Run tests: `pnpm test:run`

### Troubleshooting: Data Not Updating

```bash
# After editing in Pocketbase, refresh the dev server
pnpm reload-data
```

### Troubleshooting: Database Out of Sync

```bash
# Force restore from git
pnpm setup:force
```

### Troubleshooting: Pocketbase Won't Start

```bash
# Clear migrations (common fix)
rm -rf .pocketbase/pb_migrations/*

# Try again
cd .pocketbase && ./pocketbase serve
```

## Project Structure

```
docs/
├── .vitepress/
│   ├── config.ts              # VitePress configuration
│   ├── loaders/               # Build-time data loaders
│   └── theme/
│       ├── components/        # Vue components
│       ├── composables/       # Vue composables (logic)
│       └── custom.css         # Theme customization
├── index.md                   # Home page
└── validate/                  # Validation profiles section
    ├── index.md               # Browse page
    ├── [slug].md              # Dynamic detail page template
    └── [slug].paths.ts        # Dynamic route generator

.pocketbase/
├── pocketbase                 # Pocketbase binary
├── pb_data/
│   ├── data.db                # SQLite database (gitignored)
│   └── diffable/              # Git-friendly database export
└── pb_migrations/             # Schema migrations
```

## Content Management

Content is managed in Pocketbase and queried at build time via data loaders.

### Starting Pocketbase

```bash
cd .pocketbase && ./pocketbase serve
```

- Admin UI: http://localhost:8090/_/
- Default login: `admin@localhost.com` / `testpassword123`

### Editing Content

1. Start Pocketbase
2. Open admin UI at http://localhost:8090/_/
3. Edit collections (v2_content, v2_standards, v2_technologies, etc.)
4. Run `pnpm reload-data` to refresh dev server

### Database Version Control

The database is exported to git-friendly NDJSON format using sqlite-diffable:

```bash
# Export (after editing in Pocketbase)
cd .pocketbase/pb_data && sqlite-diffable dump data.db diffable/ --all

# Import (after cloning/pulling)
cd .pocketbase/pb_data && sqlite-diffable load data.db diffable/
```

## Architecture

### Development Flow
```
Edit in Pocketbase UI → pnpm reload-data → Dev server refreshes
```

### Build Flow
```
Pocketbase API → Data Loaders → Composables → Vue Components → Static HTML
```

### Testing
```
Composables (logic) ← Unit tests
Components (presentation) ← Component tests
```

## Testing

Tests use [Vitest](https://vitest.dev/) with [@vue/test-utils](https://test-utils.vuejs.org/).

```bash
pnpm test:run        # Run once
pnpm test:coverage   # With coverage
pnpm test            # Watch mode
```

Test files are colocated with source:
- `composables/useContentDetail.ts` → `composables/useContentDetail.spec.ts`
- `components/ContentDetail.vue` → `components/ContentDetail.spec.ts`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Static Site | VitePress 1.6 |
| UI Framework | Vue 3.5 |
| Components | Reka UI 2.7 |
| Content Database | Pocketbase 0.23 |
| Testing | Vitest 4 |
| Package Manager | pnpm |

## Deployment

Build output (`docs/.vitepress/dist/`) can be deployed to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

**Note:** Pocketbase must be running during `pnpm build` to query content.

## Troubleshooting

### Migration Errors on Startup

```
Error: Failed to apply migration ... due to existing relation references
```

**Fix:** Clear the migrations folder - they're not needed with a restored database:
```bash
rm -rf .pocketbase/pb_migrations/*
```

### Pocketbase Binary Not Working (Wrong Platform)

The included binary is for macOS ARM64 (Apple Silicon). For other platforms:

1. Download from [pocketbase.io/docs](https://pocketbase.io/docs/)
2. Replace `.pocketbase/pocketbase` with your platform's binary
3. Make executable: `chmod +x .pocketbase/pocketbase`

### Dev Server Can't Connect to Pocketbase

Ensure Pocketbase is running before starting the dev server:
```bash
# Check if running
curl http://localhost:8090/api/health

# If not, start it
cd .pocketbase && ./pocketbase serve
```

### Data Changes Not Appearing

VitePress data loaders run at build time. After editing in Pocketbase:
```bash
pnpm reload-data
```

### sqlite-diffable Not Found

Install via pip:
```bash
pip install sqlite-diffable
# or
pip3 install sqlite-diffable
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Apache 2.0 - See [LICENSE.md](LICENSE.md)

## Support

- GitHub Issues: https://github.com/mitre/saf-site-vitepress/issues
- SAF Discussions: https://github.com/mitre/saf/discussions
