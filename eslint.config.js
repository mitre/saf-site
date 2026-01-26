import antfu from '@antfu/eslint-config'

export default antfu({
  // Enable Vue and TypeScript support
  vue: true,
  typescript: true,

  // Stylistic formatting (replaces Prettier)
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  // Disable features we don't need
  markdown: false,
  yaml: false,
  jsonc: false,

  // Ignore patterns
  ignores: [
    'dist/',
    'node_modules/',
    '.pocketbase/',
    '.histoire/',
    'docs/.vitepress/cache/',
    'docs/.vitepress/dist/',
    '*.min.js',
    'pnpm-lock.yaml',
    '**/*.md',
    // CLI has its own eslint.config.js
    'cli/**',
  ],
}, {
  // Custom rules for all files
  rules: {
    // Allow console in scripts
    'no-console': 'off',

    // Vue specific
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',

    // Allow unused vars prefixed with _
    'unused-imports/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
  },
}, {
  // CLI tools and scripts use process/Buffer globals - this is standard Node.js practice
  files: ['scripts/**/*.ts', 'cli/**/*.ts', 'docs/.vitepress/**/*.ts'],
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  },
})
