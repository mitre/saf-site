# MITRE SAF Documentation Site

VitePress-based documentation site for the MITRE Security Automation Framework (SAF).

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
# Open http://localhost:5173

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Content Management

### Visual Editor (Drizzle Studio)

Use Drizzle Studio to visually edit content with forms, foreign key dropdowns, and validation:

```bash
# First time: Initialize database with schema
pnpm db:push

# Launch Drizzle Studio (opens http://localhost:4983)
pnpm studio

# Features:
# - Visual table editor with forms
# - Foreign key dropdowns
# - Relationship visualization
# - Data validation
# - Export changes to YAML
```

**Known issue:** Join tables with composite primary keys may show SQL errors in Studio. Main content tables (profiles, standards, tools, etc.) work fine.

**Alternative:** You can also edit YAML files directly. Zod validates structure on build.

## Project Structure

```
saf-site-vitepress/
├── content/
│   └── data/               # YAML source of truth
│       ├── profiles/       # Validation profiles
│       ├── hardening/      # Hardening guides
│       ├── standards/      # Security standards
│       ├── organizations/  # Organizations
│       ├── teams/          # Teams
│       └── tools/          # SAF tools
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts       # VitePress config
│   │   ├── database/
│   │   │   ├── schema.ts   # Drizzle + Zod schema
│   │   │   └── yaml-schemas.ts  # YAML file validation
│   │   ├── loaders/
│   │   │   └── profiles.data.ts  # Build-time data loading
│   │   ├── composables/
│   │   │   └── useProfiles.ts    # Filters, search, counts
│   │   ├── theme/
│   │   │   ├── index.ts
│   │   │   ├── custom.css
│   │   │   └── components/
│   │   └── utils/
│   ├── public/
│   │   └── img/            # Logos, icons, badges
│   ├── index.md            # Home page
│   ├── validate/
│   │   └── index.md        # Browse validation profiles
│   └── harden/
│       └── index.md        # Browse hardening guides
└── scripts/
    ├── import-yaml.ts      # YAML → PGlite
    └── export-yaml.ts      # PGlite → YAML
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Static Site | VitePress 1.6.4 |
| UI Framework | Vue 3 |
| Components | Reka UI 2.7.0 |
| Content Editing | Drizzle Studio |
| Database (dev) | PGlite (Postgres WASM) |
| ORM | Drizzle ORM |
| Validation | Zod |
| Data Source | YAML files |

## Architecture

### Content Management (Development)
```
Drizzle Studio → PGlite (IndexedDB) → Export Script → YAML files
```

### Production Build (Static Site)
```
YAML files → Data Loaders (Zod validation) → Typed JSON → Vue Components → Static HTML
```

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete architecture details.**

## Development Workflow

### 1. First-Time Setup

```bash
# Clone and install
git clone https://github.com/mitre/saf-site-vitepress.git
cd saf-site-vitepress
pnpm install

# Copy YAML data from saf-site-v4 (if migrating)
# TODO: Copy script to be created
cp -r ../saf-site-v4/content/data/* content/data/

# Import YAML into PGlite
# TODO: Import script to be created
pnpm import-yaml
```

### 2. Edit Content

```bash
# Launch Drizzle Studio
pnpm studio

# Edit data visually
# - Click table (profiles, standards, etc.)
# - Edit rows in forms
# - Foreign keys show as dropdowns
# - Save (persists to IndexedDB)
```

### 3. Export & Commit

```bash
# Export changes to YAML
pnpm export-yaml

# Commit YAML files
git add content/data/
git commit -m "feat: add new profiles"
git push
```

### 4. Build & Deploy

```bash
# Build static site
pnpm build

# Preview
pnpm preview

# Deploy dist/ to hosting (Netlify, Vercel, GitHub Pages, etc.)
```

## Key Files

| File | Purpose |
|------|---------|
| `docs/.vitepress/database/schema.ts` | Drizzle schema (tables, relations, Zod) |
| `docs/.vitepress/database/yaml-schemas.ts` | YAML file structure validation |
| `docs/.vitepress/config.ts` | VitePress config (nav, sidebar, search) |
| `docs/.vitepress/theme/custom.css` | MITRE branding |
| `drizzle.config.ts` | Drizzle Studio configuration |
| `content/data/**/*.yml` | Source of truth for all content |

## Data Management

### YAML File Structure

All content follows this pattern:

```yaml
_id: unique-collection-id
_metadata:
  # Optional collection metadata
profiles: # or standards, teams, tools, etc.
  - id: unique-slug
    name: Display Name
    version: v1.0.0
    # ... type-specific fields
```

### Validation

YAML files are validated on:
1. **Import** - When loading into PGlite (Zod schemas)
2. **Build** - When VitePress data loaders run (Zod schemas)
3. **Edit** - Drizzle Studio enforces schema constraints

### Type Safety

All data is typed using schemas from `schema.ts`:
- Database operations: Drizzle types
- Runtime validation: Zod schemas
- TypeScript: Auto-generated types

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server (port 5173)
pnpm build            # Build for production
pnpm preview          # Preview production build

# Database/Content Management
pnpm studio           # Launch Drizzle Studio (port 4983)
pnpm import-yaml      # Import YAML → PGlite (TODO)
pnpm export-yaml      # Export PGlite → YAML (TODO)

# Drizzle ORM
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
```

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture diagram and explanation
- **[CLAUDE.md](./CLAUDE.md)** - Claude Code AI assistant instructions
- **[WORK-TREE-ANALYSIS.md](./WORK-TREE-ANALYSIS.md)** - Data structures and composables analysis

## Migration from saf-site-v4

This project reuses:
- ✅ Complete Drizzle + Zod schema from saf-site-v4
- ✅ YAML data files from saf-site-v4/content/data
- ✅ Composables (filters, search, counts) with minimal changes

See [ARCHITECTURE.md](./ARCHITECTURE.md#migration-from-saf-site-v4) for migration details.

## Deployment

### Static Hosting

Build output (`docs/.vitepress/dist/`) can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- Any static hosting service

### Build Configuration

No environment variables required for basic deployment. YAML files are converted to JSON at build time.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes (edit via Drizzle Studio or YAML directly)
4. Export changes to YAML
5. Commit YAML files
6. Submit pull request

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details

## Support

- **GitHub Discussions**: https://github.com/mitre/saf/discussions
- **Issue Tracker**: https://github.com/mitre/saf/issues
- **Email**: saf@mitre.org
