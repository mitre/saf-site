# MITRE SAF Site

Documentation and resource hub for the MITRE Security Automation Framework (SAF).

Built with [VitePress](https://vitepress.dev/) and [Pocketbase](https://pocketbase.io/).

## Quick Start

```bash
# Install dependencies
pnpm install

# Start Pocketbase (content database)
cd .pocketbase && ./pocketbase serve &

# Start development server
pnpm dev
```

Site runs at http://localhost:5173

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm reload-data` | Reload data loaders (after Pocketbase edits) |

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
cd .pocketbase/pb_data && sqlite-diffable load diffable/ data.db --all
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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Apache 2.0 - See [LICENSE.md](LICENSE.md)

## Support

- GitHub Issues: https://github.com/mitre/saf-site-vitepress/issues
- SAF Discussions: https://github.com/mitre/saf/discussions
