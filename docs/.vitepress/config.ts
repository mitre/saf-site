import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./theme', import.meta.url)),
      },
    },
  },
  title: 'MITRE SAF',
  description: 'Security Automation Framework - Open Source Security Testing & Compliance Toolkit',

  themeConfig: {
    logo: '/img/logos/mitre-saf.png',

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Framework', link: '/framework/' },
      { text: 'Apps', link: '/apps/' },
      { text: 'Content', link: '/content/' },
      { text: 'Docs', link: '/docs/' },
      { text: 'Demo', link: '/test-index' },
    ],

    sidebar: {
      '/framework/': [
        {
          text: 'Framework',
          link: '/framework/',
          items: [
            { text: 'Plan', link: '/framework/plan' },
            { text: 'Harden', link: '/framework/harden' },
            { text: 'Validate', link: '/framework/validate' },
            { text: 'Normalize', link: '/framework/normalize' },
            { text: 'Visualize', link: '/framework/visualize' },
          ],
        },
      ],
      '/docs/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/docs/' },
            { text: 'Installation', link: '/docs/installation' },
            { text: 'Quick Start', link: '/docs/quick-start' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mitre/saf-site' },
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2025 The MITRE Corporation',
    },
  },
})
