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
