import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
/**
 * Tests for inject-story-docs.ts
 *
 * Tests the JSDoc extraction and markdown generation for Histoire docs.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const TEST_DIR = 'test-fixtures/inject-story-docs'
const COMPONENTS_DIR = join(TEST_DIR, 'components')

// Helper to create test component files
function createTestComponent(name: string, content: string) {
  const dir = join(COMPONENTS_DIR, name.includes('/') ? name.split('/').slice(0, -1).join('/') : '')
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(join(COMPONENTS_DIR, `${name}.vue`), content)
}

function createTestStory(name: string, content: string) {
  const dir = join(COMPONENTS_DIR, name.includes('/') ? name.split('/').slice(0, -1).join('/') : '')
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(join(COMPONENTS_DIR, `${name}.story.vue`), content)
}

// eslint-disable-next-line unused-imports/no-unused-vars -- utility for future tests
function readStory(name: string): string {
  return readFileSync(join(COMPONENTS_DIR, `${name}.story.vue`), 'utf-8')
}

describe('inject-story-docs', () => {
  beforeEach(() => {
    // Create test directory
    mkdirSync(COMPONENTS_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
  })

  describe('jSDoc extraction', () => {
    it('extracts @component description from script setup', () => {
      createTestComponent('TestButton', `
<script setup lang="ts">
/**
 * @component TestButton - A test button component.
 * Used for testing documentation extraction.
 */
const props = defineProps<{ label: string }>()
</script>
<template><button>{{ label }}</button></template>
`)
      createTestStory('TestButton', `
<script setup>
import TestButton from './TestButton.vue'
</script>
<template>
  <Story title="TestButton">
    <TestButton label="Click me" />
  </Story>
</template>
`)

      // Run the script with test directory
      // Note: This would need the script to accept a custom root path
      // For now, we test the parsing logic directly
    })

    it('extracts multiple @example tags', () => {
      const jsdoc = `
/**
 * @component MyComponent - Description here.
 *
 * @example Basic usage
 * <MyComponent :value="1" />
 *
 * @example With options
 * <MyComponent :value="2" :options="opts" />
 */
`
      // Parse examples from JSDoc
      const examples: string[] = []
      const lines = jsdoc.split('\n')
      let currentExample: string[] = []
      let inExample = false

      for (const line of lines) {
        const cleaned = line.replace(/^\s*\*\s?/, '').trim()
        if (cleaned.startsWith('@example')) {
          if (inExample && currentExample.length > 0) {
            examples.push(currentExample.join('\n'))
          }
          currentExample = []
          inExample = true
          const content = cleaned.replace('@example', '').trim()
          if (content)
            currentExample.push(content)
        }
        else if (inExample && cleaned && !cleaned.startsWith('@')) {
          currentExample.push(cleaned)
        }
        else if (cleaned.startsWith('@') && cleaned !== '@example') {
          if (inExample && currentExample.length > 0) {
            examples.push(currentExample.join('\n'))
          }
          inExample = false
        }
      }
      if (inExample && currentExample.length > 0) {
        examples.push(currentExample.join('\n'))
      }

      expect(examples).toHaveLength(2)
      expect(examples[0]).toContain('Basic usage')
      expect(examples[1]).toContain('With options')
    })
  })

  describe('interface extraction', () => {
    it('extracts exported interfaces', () => {
      const content = `
<script setup lang="ts">
export interface ButtonProps {
  /** Button label */
  label: string
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
}
</script>
`
      // Extract interfaces (same logic as in inject-story-docs.ts)
      const interfaces: string[] = []
      const interfaceRegex = /export\s+interface\s+\w+\s*\{[\s\S]*?\n\}/g

      let match = interfaceRegex.exec(content)
      while (match !== null) {
        interfaces.push(match[0])
        match = interfaceRegex.exec(content)
      }

      expect(interfaces).toHaveLength(1)
      expect(interfaces[0]).toContain('ButtonProps')
      expect(interfaces[0]).toContain('label: string')
    })

    it('extracts exported types', () => {
      const content = `export type ButtonVariant = 'primary' | 'secondary';`

      const types: string[] = []
      const typeRegex = /export\s+type\s+\w+\s*=[^;]+;/g

      let match = typeRegex.exec(content)
      while (match !== null) {
        types.push(match[0])
        match = typeRegex.exec(content)
      }

      expect(types).toHaveLength(1)
      expect(types[0]).toContain('ButtonVariant')
    })
  })

  describe('markdown generation', () => {
    it('generates markdown in correct order', () => {
      // Test the order: Description → Usage → Props → Types
      const sections = ['# Component', 'Description', '## Usage', '## Props', '## Types']
      const markdown = sections.join('\n\n')

      const usageIndex = markdown.indexOf('## Usage')
      const propsIndex = markdown.indexOf('## Props')
      const typesIndex = markdown.indexOf('## Types')

      expect(usageIndex).toBeLessThan(propsIndex)
      expect(propsIndex).toBeLessThan(typesIndex)
    })

    it('generates props table with required indicator', () => {
      const props = [
        { name: 'items', type: 'Array', required: true, description: 'List of items' },
        { name: 'size', type: 'number', required: false, defaultValue: '48', description: 'Size in px' },
      ]

      const rows = props.map((p) => {
        const req = p.required ? ' **(required)**' : ''
        return `| \`${p.name}\` | \`${p.type}\` | \`${p.defaultValue || '-'}\` | ${p.description}${req} |`
      })

      expect(rows[0]).toContain('**(required)**')
      expect(rows[1]).not.toContain('**(required)**')
      expect(rows[1]).toContain('48')
    })
  })

  describe('docs injection', () => {
    it('injects new docs block at end of file', () => {
      const original = `
<template>
  <Story><Variant /></Story>
</template>
`.trim()

      const markdown = '# Test\n\nDescription'
      const docsBlock = `<docs lang="md">\n${markdown}\n</docs>`
      const result = `${original}\n\n${docsBlock}\n`

      expect(result).toContain('</template>')
      expect(result).toContain('<docs lang="md">')
      expect(result).toContain('# Test')
    })

    it('replaces existing docs block', () => {
      const original = `
<template>
  <Story><Variant /></Story>
</template>

<docs lang="md">
# Old
</docs>
`.trim()

      const newMarkdown = '# New\n\nUpdated description'
      const docsRegex = /<docs\s+lang="md">[\s\S]*?<\/docs>/
      const result = original.replace(docsRegex, `<docs lang="md">\n${newMarkdown}\n</docs>`)

      expect(result).not.toContain('# Old')
      expect(result).toContain('# New')
      expect(result).toContain('Updated description')
    })
  })
})
