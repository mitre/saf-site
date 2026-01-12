import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MITRE SAF',
  description: 'Security Automation Framework - Open Source Security Testing & Compliance Toolkit',

  themeConfig: {
    logo: '/img/logos/mitre-saf.png',

    search: {
      provider: 'local'
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Framework', link: '/framework/' },
      { text: 'Apps', link: '/apps/' },
      { text: 'Validate', link: '/validate/' },
      { text: 'Docs', link: '/docs/' }
    ],

    sidebar: {
      '/framework/': [
        {
          text: 'Framework',
          items: [
            { text: 'Plan', link: '/framework/plan' },
            { text: 'Harden', link: '/framework/harden' },
            { text: 'Validate', link: '/framework/validate' },
            { text: 'Normalize', link: '/framework/normalize' },
            { text: 'Visualize', link: '/framework/visualize' }
          ]
        }
      ],
      '/docs/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/docs/' },
            { text: 'Installation', link: '/docs/installation' },
            { text: 'Quick Start', link: '/docs/quick-start' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mitre/saf' }
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2025 The MITRE Corporation'
    }
  }
})
