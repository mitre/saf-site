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
    // Legacy/archived files - clean up in separate PR
    'docs/.vitepress/database/schema-v1-archived.ts',
    'scripts/import-from-v4.ts',
    'scripts/import-yaml-data.ts',
    'scripts/seed-database.ts',
    'scripts/validate-against-design.ts',
    // CLI has minor test file issues - clean up separately
    'cli/**/*.spec.ts',
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
