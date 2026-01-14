# Contributing to MITRE SAF Site

Thank you for your interest in contributing to the MITRE SAF Site!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Start Pocketbase: `cd .pocketbase && ./pocketbase serve`
5. Start dev server: `pnpm dev`

## Development Workflow

### Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `pnpm test:run`
4. Commit with clear messages
5. Push and open a pull request

### Content Changes

1. Edit content in Pocketbase admin UI (http://localhost:8090/_/)
2. Run `pnpm reload-data` to see changes in dev
3. Export database: `cd .pocketbase/pb_data && sqlite-diffable dump data.db diffable/ --all`
4. Commit the diffable/ changes

### Code Changes

- Follow existing code patterns
- Add tests for new composables/components
- Run `pnpm test:run` before committing

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
