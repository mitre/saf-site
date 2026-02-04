import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'
import { getTrainingSidebar } from './config/trainingSidebar'
import { markdownItSmartScript } from './plugins/markdown-it-smartscript'

// VitePress config supports top-level await for dynamic data loading
// eslint-disable-next-line antfu/no-top-level-await
const trainingSidebar = await getTrainingSidebar()

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(markdownItSmartScript, {
        trademark: true,
        registered: true,
        copyright: true,
      })
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./theme', import.meta.url)),
      },
    },
  },
  title: 'MITRE SAF™',
  description: 'Security Automation Framework - Open Source Security Testing & Compliance Toolkit',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/icons/saf-logo.svg' }],
    // Osano cookie consent (required by MITRE Privacy - must be first script)
    ['script', { src: 'https://cmp.osano.com/AzyhULTdPkqmy4aDN/f0e8e901-3feb-47c4-bd04-96df98c75dab/osano.js' }],
    // Hide Osano's default widget (we trigger via footer link instead)
    ['style', {}, '.osano-cm-widget{display: none;}'],
  ],

  themeConfig: {
    logo: '/icons/saf-logo.svg',

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Framework',
        items: [
          { text: 'Overview', link: '/framework/' },
          { text: 'Plan', link: '/framework/plan' },
          { text: 'Harden', link: '/framework/harden' },
          { text: 'Validate', link: '/framework/validate' },
          { text: 'Normalize', link: '/framework/normalize' },
          { text: 'Visualize', link: '/framework/visualize' },
        ],
      },
      {
        text: 'Apps',
        items: [
          { text: 'Overview', link: '/apps/' },
          { text: 'Heimdall', link: '/apps/heimdall' },
          { text: 'Vulcan', link: '/apps/vulcan' },
          { text: 'SAF CLI', link: '/apps/saf-cli' },
          { text: 'eMASSer', link: '/apps/emasser' },
        ],
      },
      { text: 'Content', link: '/content/' },
      { text: 'Training', link: '/training/' },
      // Demo page hidden in production
      ...(process.env.NODE_ENV !== 'production' ? [{ text: 'Demo', link: '/test-index' }] : []),
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
      '/apps/': [
        {
          text: 'Apps',
          link: '/apps/',
          items: [
            { text: 'Heimdall', link: '/apps/heimdall' },
            { text: 'Vulcan', link: '/apps/vulcan' },
            { text: 'SAF CLI', link: '/apps/saf-cli' },
            { text: 'eMASSer', link: '/apps/emasser' },
          ],
        },
      ],
      '/training/': trainingSidebar,
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mitre/saf-site' },
    ],

    // Footer is rendered in Layout.vue for customization
  },
})
