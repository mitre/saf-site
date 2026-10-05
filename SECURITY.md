# Security Policy

## Reporting Security Issues

The MITRE SAF team takes security seriously. If you discover a security vulnerability in the SAF Site, please report it responsibly.

### Contact Information

- **Email**: [saf-security@mitre.org](mailto:saf-security@mitre.org)
- **GitHub**: Use the [Security tab](https://github.com/mitre/saf-site-vitepress/security) to report vulnerabilities privately

### What to Include

When reporting security issues, please provide:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if you have one)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Varies by severity

## Security Best Practices

### For Users

- **Keep Updated**: Use the latest version of the site
- **Verify Links**: Check that profile links point to official MITRE repositories

### For Contributors

- **Dependency Scanning**: Check for vulnerable dependencies regularly
- **No Credentials**: Never commit API keys, passwords, or tokens
- **Input Validation**: Sanitize all user inputs in components
- **Test Changes**: Run tests before submitting PRs

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |

## Security Testing

```bash
# Check for vulnerable dependencies
pnpm audit

# Run tests
pnpm test:run
```

## Known Security Considerations

### Static Site
- This is a static site with no server-side code
- All content is pre-rendered at build time
- No user authentication or data storage in production

### Pocketbase (Development Only)
- Pocketbase is used only during development and build
- Not exposed in production deployment
- Default credentials are for local development only

### External Links
- Profile links point to external GitHub repositories
- Users should verify repository authenticity before use

### Accepted Advisories

`pnpm audit --audit-level=high` gates CI. One advisory is deliberately
excluded, via `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` (that file is
kept comment-free, so the rationale lives here):

| Advisory | Package | Why it is accepted |
|---|---|---|
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | `braces` | No fix exists, and it is not reachable in production. |

Details, as of 2026-10-04:

- **No patched version exists.** `braces@3.0.3` is the latest published release
  and the advisory covers `<=3.0.3`. There is nothing to upgrade to.
- **It cannot be removed.** `braces` is a hard dependency of `micromatch`, and
  every published `micromatch` (through 4.0.8, the latest) requires it. We reach
  `micromatch` from several independent roots: `histoire` depends on it
  directly, and both `histoire` and `vue-docgen-cli` reach it through
  `globby` → `fast-glob`. The latest `globby` (16.x) and `fast-glob` (3.3.3)
  still require `micromatch`, so no upgrade anywhere in the chain drops it.
  Eliminating it would mean dropping the entire component-story toolchain
  (`histoire` + `vue-docgen-cli`, i.e. `pnpm story:dev` and `pnpm story:docs`).
- **It is not reachable in production.** Both roots are `devDependencies` used
  for the component workbench and story docs. The deployed artifact is static
  HTML; `braces` never ships. The vulnerability is stack exhaustion from deeply
  nested brace patterns, and the only patterns it sees are our own globs.

The exclusion is scoped to this single advisory ID, so any *new* high-severity
finding still fails CI. Re-check when `braces` or `micromatch` publishes a fix:
remove the entry and run `pnpm audit --audit-level=high`.
