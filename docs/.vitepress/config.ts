import type { HeadConfig } from 'vitepress'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'
import { redirects } from './config/redirects'
import { getTrainingSidebar } from './config/trainingSidebar'
import { markdownItSmartScript } from './plugins/markdown-it-smartscript'

// VitePress config supports top-level await for dynamic data loading
// eslint-disable-next-line antfu/no-top-level-await
const trainingSidebar = await getTrainingSidebar()

// Static string props: headline="...", title="...", description="..."
const STATIC_STRING_PROP_REGEX = /\b(?:headline|title|description)\s*=\s*"([^"]+)"/g
// Dynamic object props (single-quoted): title: '...', description: '...'
const SINGLE_QUOTED_PROP_REGEX = /(?:title|description):\s*'((?:[^'\\]|\\.)*)'/g
// Dynamic object props (double-quoted inside template): title: "...", description: "..."
const DOUBLE_QUOTED_PROP_REGEX = /(?:title|description):\s*"([^"]+)"/g
const ESCAPED_SINGLE_QUOTE_REGEX = /\\'/g
// Test/dev pages excluded from search indexing
const EXCLUDED_SEARCH_PATH_REGEX = /^(?:test-|icon-test|taxonomy\/)/
// VitePress-formatted heading with a header-anchor link
const HEADER_ANCHOR_REGEX = /<h\d.*?<a.*?class="header-anchor"/
const WHITESPACE_REGEX = /\s+/g
const NON_SLUG_CHAR_REGEX = /[^\w-]/g

/**
 * Extract searchable text from Vue component props in markdown files.
 * VitePress local search strips HTML tags, losing prop values like
 * title="..." and description="..." that aren't in raw markdown text.
 */
function extractVueComponentText(src: string, relativePath: string): string {
  const texts: string[] = []

  for (const m of src.matchAll(STATIC_STRING_PROP_REGEX))
    texts.push(m[1])

  for (const m of src.matchAll(SINGLE_QUOTED_PROP_REGEX))
    texts.push(m[1].replace(ESCAPED_SINGLE_QUOTE_REGEX, '\''))

  for (const m of src.matchAll(DOUBLE_QUOTED_PROP_REGEX))
    texts.push(m[1])

  // Boost framework pillar pages with extra keyword signal
  if (relativePath.startsWith('framework/')) {
    const pillar = relativePath.replace('framework/', '').replace('.md', '')
    if (['validate', 'harden', 'plan', 'normalize', 'visualize'].includes(pillar))
      texts.push(`${pillar} SAF framework ${pillar}`)
  }

  return texts.join(' ')
}

export default defineConfig({
  buildEnd(siteConfig) {
    for (const [from, to] of Object.entries(redirects)) {
      const filePath = join(siteConfig.outDir, from, 'index.html')
      const dir = dirname(filePath)
      if (!existsSync(dir))
        mkdirSync(dir, { recursive: true })
      writeFileSync(filePath, [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        `  <meta http-equiv="refresh" content="0;url=${to}">`,
        `  <link rel="canonical" href="${to}">`,
        '</head>',
        '<body>',
        `  <p>This page has moved to <a href="${to}">${to}</a>.</p>`,
        '</body>',
        '</html>',
      ].join('\n'))
    }
  },

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
    // Google Analytics 4 (only when VITE_GA_ID is set)
    ...(process.env.VITE_GA_ID
      ? [
          ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${process.env.VITE_GA_ID}` }] satisfies HeadConfig,
          ['script', {}, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.VITE_GA_ID}');`] satisfies HeadConfig,
        ]
      : []),
  ],

  themeConfig: {
    logo: '/icons/saf-logo.svg',

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 6, text: 2, titles: 1 },
          },
        },
        _render(src, env, md) {
          let html = md.render(src, env)

          // Respect per-page frontmatter opt-out
          if (env.frontmatter?.search === false)
            return ''

          // Exclude test/dev pages by path pattern
          if (EXCLUDED_SEARCH_PATH_REGEX.test(env.relativePath))
            return ''

          // Pages without VitePress-formatted headings (with anchor links)
          // produce zero search sections because the indexer splits on
          // <h*> tags with header-anchor links. Raw <h3> tags inside Vue
          // templates don't count. Inject a heading from frontmatter title.
          const title = env.frontmatter?.title
          if (title && !HEADER_ANCHOR_REGEX.test(html)) {
            const slug = String(title).toLowerCase().replace(WHITESPACE_REGEX, '-').replace(NON_SLUG_CHAR_REGEX, '')
            html = `<h1 id="${slug}">${title} <a class="header-anchor" href="#${slug}">\u200B</a></h1>\n${html}`
          }

          // Extract text from Vue component props for indexing
          const extraText = extractVueComponentText(src, env.relativePath)
          if (extraText)
            html += `\n<p>${extraText}</p>`

          return html
        },
      },
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
      {
        text: 'Resources',
        items: [
          { text: 'HDF Examples', link: '/resources/' },
          { text: 'HDF Schema', link: '/resources/schema' },
          { text: 'Media & Downloads', link: '/resources/media' },
        ],
      },
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
      '/resources/': [
        {
          text: 'Resources',
          link: '/resources/',
          items: [
            { text: 'HDF Examples', link: '/resources/' },
            { text: 'HDF Schema', link: '/resources/schema' },
            { text: 'Media & Downloads', link: '/resources/media' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mitre/saf-site' },
    ],

    // Footer is rendered in Layout.vue for customization
  },
})
