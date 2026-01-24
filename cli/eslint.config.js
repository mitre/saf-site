import antfu from '@antfu/eslint-config'

export default antfu({
  // TypeScript only - no Vue (pure Node.js CLI)
  typescript: true,
  vue: false,

  // Stylistic formatting (matches root config)
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  // Disable features not needed for CLI
  markdown: false,
  yaml: false,
  jsonc: false,
}, {
  // Custom rules for CLI
  rules: {
    // Allow console (it's a CLI tool)
    'no-console': 'off',

    // Allow unused vars prefixed with _
    'unused-imports/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    // CLI uses process/Buffer globals - standard Node.js practice
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  },
})
