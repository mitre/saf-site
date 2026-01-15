# Contributing to MITRE SAF Site

Thank you for your interest in contributing to the MITRE SAF Site!

## Getting Started

```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/saf-site-vitepress.git
cd saf-site-vitepress

# Run setup (handles everything)
./scripts/setup.sh

# Start Pocketbase (terminal 1)
cd .pocketbase && ./pocketbase serve

# Start dev server (terminal 2)
pnpm dev
```

See [README.md](README.md#setup) for detailed setup options and troubleshooting.

## Development Workflow

### Daily Development

```bash
# After git pull, sync any database changes
pnpm setup

# Start Pocketbase (terminal 1)
cd .pocketbase && ./pocketbase serve

# Start dev server (terminal 2)
pnpm dev
```

### Making Code Changes

1. Create a feature branch from `main`
2. Make your changes
3. Add tests for new code (colocated `*.spec.ts` files)
4. Run tests: `pnpm test:run`
5. Commit with clear messages
6. Push and open a pull request

### Making Content Changes

1. Edit in Pocketbase admin UI: http://localhost:8090/_/
2. Refresh dev server: `pnpm reload-data`
3. Export to git: `pnpm db:export`
4. Review: `git diff .pocketbase/pb_data/diffable/`
5. Commit: `git add .pocketbase/pb_data/diffable/ && git commit`

### Before Committing

```bash
# Run tests
pnpm test:run

# For content changes, export database
pnpm db:export
```

## Code Style

- Vue 3 Composition API with `<script setup>`
- TypeScript for type safety
- Colocated test files (`*.spec.ts`)

## Pull Request Process

1. Ensure tests pass
2. Update documentation if needed
3. Request review from maintainers
4. Squash commits on merge

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Provide browser/environment details

## Questions?

- Open a GitHub Discussion
- Email: saf@mitre.org

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
