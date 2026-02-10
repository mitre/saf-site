import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'
import { getTrainingSidebar } from './config/trainingSidebar'
import { markdownItSmartScript } from './plugins/markdown-it-smartscript'

// VitePress config supports top-level await for dynamic data loading
// eslint-disable-next-line antfu/no-top-level-await
const trainingSidebar = await getTrainingSidebar()

/**
 * Extract searchable text from Vue component props in markdown files.
 * VitePress local search strips HTML tags, losing prop values like
 * title="..." and description="..." that aren't in raw markdown text.
 */
function extractVueComponentText(src: string, relativePath: string): string {
  const texts: string[] = []

  // Static string props: headline="...", title="...", description="..."
  for (const m of src.matchAll(/\b(?:headline|title|description)\s*=\s*"([^"]+)"/g))
    texts.push(m[1])

  // Dynamic object props (single-quoted): title: '...', description: '...'
  for (const m of src.matchAll(/(?:title|description):\s*'((?:[^'\\]|\\.)*)'/g))
    texts.push(m[1].replace(/\\'/g, '\''))

  // Dynamic object props (double-quoted inside template): title: "...", description: "..."
  for (const m of src.matchAll(/(?:title|description):\s*"([^"]+)"/g))
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
          if (env.relativePath.match(/^(test-|icon-test|taxonomy\/)/))
            return ''

          // Pages without VitePress-formatted headings (with anchor links)
          // produce zero search sections because the indexer splits on
          // <h*> tags with header-anchor links. Raw <h3> tags inside Vue
          // templates don't count. Inject a heading from frontmatter title.
          const title = env.frontmatter?.title
          if (title && !/<h\d.*?<a.*?class="header-anchor"/.test(html)) {
            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
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
