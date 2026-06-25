import antfu from '@antfu/eslint-config'
import vuejsA11y from 'eslint-plugin-vuejs-accessibility'

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
}, ...vuejsA11y.configs['flat/recommended'], {
  // Vue template accessibility (WCAG 2.1 AA / Section 508). The recommended set
  // runs at "error" so any NEW violation fails CI. The two form-label rules below
  // flag pre-existing issues tracked in saf-site-vitepress-bmx; keep them at "warn"
  // so the tooling surfaces them without blocking, until bmx fixes them and
  // promotes both back to "error".
  files: ['**/*.vue'],
  rules: {
    'vuejs-accessibility/label-has-for': 'warn',
    'vuejs-accessibility/form-control-has-label': 'warn',
  },
})
