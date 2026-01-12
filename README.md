# MITRE SAF - VitePress POC

This is a proof-of-concept branch testing VitePress with the Vue.js official theme for the MITRE SAF documentation site.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Structure

```
docs/
├── .vitepress/
│   ├── config.ts        # VitePress config
│   └── theme/
│       ├── index.ts     # Uses @vue/theme
│       └── custom.css   # MITRE branding
└── index.md             # Home page
```

## Theme

Using [@vue/theme](https://github.com/vuejs/theme) - the official Vue.js documentation theme, actively maintained and production-ready.
