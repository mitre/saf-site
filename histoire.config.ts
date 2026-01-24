import { HstVue } from '@histoire/plugin-vue'
import { defineConfig } from 'histoire'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [HstVue()],

  // Setup file for Tailwind CSS and theme
  setupFile: 'docs/.vitepress/theme/histoire.setup.ts',

  // Story file patterns
  storyMatch: ['docs/.vitepress/theme/**/*.story.vue'],

  // Ignore patterns (avoid watching socket files, etc.)
  storyIgnored: [
    '**/node_modules/**',
    '**/.beads/**',
    '**/.pocketbase/**',
    '**/.git/**',
    '**/dist/**',
  ],

  // Theme configuration
  theme: {
    title: 'SAF Component Library',
    favicon: 'icons/mitre-m.svg',
    defaultColorScheme: 'light',
    // Explicitly set dark class to match Tailwind/VitePress pattern
    darkClass: 'dark',
  },

  // Preview background presets - match VitePress theme
  backgroundPresets: [
    { label: 'Light (VitePress)', color: '#ffffff', contrastColor: '#1b1b1f' },
    { label: 'Soft (VitePress)', color: '#f6f6f7', contrastColor: '#1b1b1f' },
    { label: 'Dark (VitePress)', color: '#1b1b1f', contrastColor: '#ffffff' },
    { label: 'Transparent', color: 'transparent' },
  ],
  autoApplyContrastColor: true,

  // VitePress uses docs/public, not root public
  viteNodeInlineDeps: [/vitepress/],

  // Vite configuration for path aliases and public dir
  vite: {
    plugins: [vue(), tailwindcss()],
    publicDir: 'docs/public',
    resolve: {
      alias: {
        '@': '/docs/.vitepress/theme',
      },
    },
    server: {
      watch: {
        ignored: ['**/.beads/**', '**/.pocketbase/**', '**/node_modules/**'],
      },
    },
  },
})
