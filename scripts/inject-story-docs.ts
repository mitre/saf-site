#!/usr/bin/env npx tsx
/**
 * inject-story-docs.ts
 *
 * Generates documentation from Vue component JSDoc and injects it as <docs> blocks
 * into corresponding .story.vue files. This bypasses Histoire Issue #680 where
 * sibling .story.md files don't work with storyMatch.
 *
 * Usage:
 *   pnpm story:docs        # Generate and inject docs
 *   pnpm story:docs:watch  # Watch mode (future)
 */

import type { Documentation, ScriptHandler } from 'vue-docgen-api'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import process from 'node:process'
import { glob } from 'glob'
import { parse } from 'vue-docgen-api'

const COMPONENTS_ROOT = 'docs/.vitepress/theme/components'

/**
 * Custom script handler to extract @component JSDoc from <script setup>
 * See: https://github.com/vue-styleguidist/vue-styleguidist/issues/1399
 */
const scriptSetupHandler: ScriptHandler = (
  documentation: Documentation,
  componentDefinition: unknown,
  astPath: { tokens?: Array<{ type: string, value: string }> },
) => {
  if (!astPath.tokens)
    return

  // Find comment block with @component tag
  const componentDoc = astPath.tokens.find(
    token => token.type === 'CommentBlock' && token.value.includes('@component'),
  )

  if (componentDoc) {
    // Extract description (text after @component, before other tags)
    const lines = componentDoc.value.split('\n')
    const descLines: string[] = []
    const tags: Record<string, string[]> = {}
    let currentTag: string | null = null

    for (const line of lines) {
      const cleaned = line.replace(/^\s*\*\s?/, '').trim()

      // Check for @tags
      const tagMatch = cleaned.match(/^@(\w+)\s*(.*)/)
      if (tagMatch) {
        const [, tagName, tagContent] = tagMatch
        if (tagName === 'component') {
          // Start of description
          if (tagContent)
            descLines.push(tagContent)
          currentTag = null
        }
        else {
          // Other tags like @example - always start a new entry
          currentTag = tagName
          if (!tags[tagName])
            tags[tagName] = []
          tags[tagName].push(tagContent || '') // Always push, even if empty
        }
      }
      else if (currentTag && tags[currentTag]?.length > 0) {
        // Continuation of a tag - append to last entry
        const lastIdx = tags[currentTag].length - 1
        tags[currentTag][lastIdx] += (tags[currentTag][lastIdx] ? '\n' : '') + cleaned
      }
      else if (cleaned && !cleaned.startsWith('@')) {
        // Description continuation
        descLines.push(cleaned)
      }
    }

    const description = descLines.join(' ').trim()
    if (description) {
      documentation.set('description', description)
    }

    // Set tags (like @example)
    for (const [tagName, values] of Object.entries(tags)) {
      const existingTags = documentation.get('tags') || {}
      existingTags[tagName] = values.map(v => ({ title: tagName, content: v.trim() }))
      documentation.set('tags', existingTags)
    }
  }
}

interface TagDescriptor {
  title: string
  content?: string
}

interface PropDescriptor {
  name: string
  type?: { name: string }
  defaultValue?: { value: string }
  description?: string
  required?: boolean
  tags?: Record<string, TagDescriptor[]>
}

interface SlotDescriptor {
  name: string
  description?: string
}

interface EventDescriptor {
  name: string
  description?: string
}

interface ComponentDoc {
  displayName: string
  description?: string
  props?: PropDescriptor[]
  slots?: SlotDescriptor[]
  events?: EventDescriptor[]
  tags?: Record<string, TagDescriptor[]>
  docsBlocks?: string[]
}

/**
 * Extract exported interfaces from component source
 */
function extractInterfaces(componentPath: string): string[] {
  const content = readFileSync(componentPath, 'utf-8')
  const interfaces: string[] = []

  // Match exported interfaces: export interface Name { ... }
  const interfaceRegex = /export\s+interface\s+\w+\s*\{[\s\S]*?\n\}/g
  let match = interfaceRegex.exec(content)
  while (match !== null) {
    interfaces.push(match[0])
    match = interfaceRegex.exec(content)
  }

  // Match exported types: export type Name = ...
  const typeRegex = /export\s+type\s+\w+\s*=[^;]+;/g
  match = typeRegex.exec(content)
  while (match !== null) {
    interfaces.push(match[0])
    match = typeRegex.exec(content)
  }

  return interfaces
}

/**
 * Generate markdown documentation from parsed component
 * Order: Description → Usage → API (Props/Events/Slots) → Types
 */
function generateMarkdown(doc: ComponentDoc, componentPath: string): string {
  const lines: string[] = []

  // 1. Title
  lines.push(`# ${doc.displayName}`)
  lines.push('')

  // 2. Description
  if (doc.description) {
    lines.push(doc.description)
    lines.push('')
  }

  // 3. Usage (@example tags)
  if (doc.tags?.example) {
    lines.push('## Usage')
    lines.push('')
    for (const example of doc.tags.example) {
      if (example.content) {
        lines.push('```vue')
        lines.push(example.content.trim())
        lines.push('```')
        lines.push('')
      }
    }
  }

  // 4. API Section - Props
  if (doc.props && doc.props.length > 0) {
    lines.push('## Props')
    lines.push('')
    lines.push('| Prop | Type | Default | Description |')
    lines.push('|------|------|---------|-------------|')

    for (const prop of doc.props) {
      const type = prop.type?.name || 'any'
      const defaultVal = prop.defaultValue?.value || '-'
      const desc = prop.description || ''
      const required = prop.required ? ' **(required)**' : ''
      lines.push(`| \`${prop.name}\` | \`${type}\` | \`${defaultVal}\` | ${desc}${required} |`)
    }
    lines.push('')
  }

  // 4. API Section - Events
  if (doc.events && doc.events.length > 0) {
    lines.push('## Events')
    lines.push('')
    lines.push('| Event | Description |')
    lines.push('|-------|-------------|')

    for (const event of doc.events) {
      lines.push(`| \`${event.name}\` | ${event.description || ''} |`)
    }
    lines.push('')
  }

  // 4. API Section - Slots
  if (doc.slots && doc.slots.length > 0) {
    lines.push('## Slots')
    lines.push('')
    lines.push('| Slot | Description |')
    lines.push('|------|-------------|')

    for (const slot of doc.slots) {
      lines.push(`| \`${slot.name}\` | ${slot.description || ''} |`)
    }
    lines.push('')
  }

  // 5. Types (exported interfaces)
  const interfaces = extractInterfaces(componentPath)
  if (interfaces.length > 0) {
    lines.push('## Types')
    lines.push('')
    lines.push('```typescript')
    lines.push(interfaces.join('\n\n'))
    lines.push('```')
    lines.push('')
  }

  // 6. Notes (other custom tags like @see, @since, @version)
  if (doc.tags) {
    const otherTags = Object.entries(doc.tags).filter(
      ([key]) => !['example', 'displayName', 'ignore'].includes(key),
    )
    if (otherTags.length > 0) {
      lines.push('## Notes')
      lines.push('')
      for (const [tag, values] of otherTags) {
        for (const v of values) {
          lines.push(`**@${tag}**: ${v.content || ''}`)
          lines.push('')
        }
      }
    }
  }

  return lines.join('\n')
}

/**
 * Find the corresponding .story.vue file for a component
 */
function findStoryFile(componentPath: string): string | null {
  const dir = dirname(componentPath)
  const name = basename(componentPath, '.vue')

  // Check for ComponentName.story.vue in same directory
  const storyPath = join(dir, `${name}.story.vue`)
  if (existsSync(storyPath)) {
    return storyPath
  }

  return null
}

/**
 * Inject or update <docs> block in a story file
 */
function injectDocs(storyPath: string, markdown: string): boolean {
  const content = readFileSync(storyPath, 'utf-8')

  const docsBlock = `<docs lang="md">\n${markdown.trimEnd()}\n</docs>`

  // Check if <docs> block already exists
  const docsRegex = /<docs\s+lang="md">[\s\S]*?<\/docs>/

  let newContent: string
  if (docsRegex.test(content)) {
    // Replace existing <docs> block
    newContent = content.replace(docsRegex, docsBlock)
  }
  else {
    // Append <docs> block at the end
    newContent = `${content.trimEnd()}\n\n${docsBlock}\n`
  }

  if (newContent !== content) {
    writeFileSync(storyPath, newContent)
    return true
  }

  return false
}

/**
 * Check if docs would change (for CI)
 */
function checkDocs(storyPath: string, markdown: string): boolean {
  const content = readFileSync(storyPath, 'utf-8')
  const docsBlock = `<docs lang="md">\n${markdown.trimEnd()}\n</docs>`
  const docsRegex = /<docs\s+lang="md">[\s\S]*?<\/docs>/

  let expectedContent: string
  if (docsRegex.test(content)) {
    expectedContent = content.replace(docsRegex, docsBlock)
  }
  else {
    expectedContent = `${content.trimEnd()}\n\n${docsBlock}\n`
  }

  return content === expectedContent
}

/**
 * Process a single component
 */
async function processComponent(
  componentPath: string,
  checkOnly: boolean,
): Promise<'updated' | 'skipped' | 'outdated' | 'error'> {
  const storyPath = findStoryFile(componentPath)
  if (!storyPath)
    return 'skipped'

  try {
    const doc = await parse(componentPath, {
      addScriptHandlers: [scriptSetupHandler],
    })
    const markdown = generateMarkdown(doc as ComponentDoc, componentPath)

    if (checkOnly) {
      const isUpToDate = checkDocs(storyPath, markdown)
      return isUpToDate ? 'skipped' : 'outdated'
    }
    else {
      const wasUpdated = injectDocs(storyPath, markdown)
      return wasUpdated ? 'updated' : 'skipped'
    }
  }
  catch (err) {
    console.error(`❌ ${basename(componentPath)}: ${(err as Error).message}`)
    return 'error'
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check')
  const watchMode = args.includes('--watch')

  if (watchMode) {
    console.log('👀 Watch mode - monitoring component changes...')
    console.log('   Press Ctrl+C to stop\n')

    // Initial run
    await runOnce(checkOnly)

    // Watch for changes using fs.watch (simple approach)
    const { watch } = await import('node:fs')
    const watchDir = (dir: string) => {
      watch(dir, { recursive: true }, async (event, filename) => {
        if (filename && filename.endsWith('.vue') && !filename.includes('.story.')) {
          console.log(`\n🔄 Change detected: ${filename}`)
          await runOnce(false) // Always update in watch mode
        }
      })
    }
    watchDir(COMPONENTS_ROOT)

    // Keep process alive
    process.stdin.resume()
  }
  else {
    const exitCode = await runOnce(checkOnly)
    process.exit(exitCode)
  }
}

async function runOnce(checkOnly: boolean): Promise<number> {
  console.log(checkOnly ? '🔍 Checking story docs...' : '🔍 Scanning for Vue components...')

  const componentFiles = await glob(`${COMPONENTS_ROOT}/**/*.vue`, {
    ignore: ['**/*.story.vue'],
  })

  console.log(`📦 Found ${componentFiles.length} components`)

  let updated = 0
  let skipped = 0
  let outdated = 0
  let errors = 0

  for (const componentPath of componentFiles) {
    const result = await processComponent(componentPath, checkOnly)
    switch (result) {
      case 'updated':
        console.log(`✅ ${basename(findStoryFile(componentPath)!)}`)
        updated++
        break
      case 'outdated':
        console.log(`⚠️  ${basename(findStoryFile(componentPath)!)} - out of date`)
        outdated++
        break
      case 'skipped':
        skipped++
        break
      case 'error':
        errors++
        break
    }
  }

  console.log('')
  if (checkOnly) {
    console.log(`📊 Summary: ${outdated} outdated, ${skipped} up-to-date, ${errors} errors`)
    if (outdated > 0) {
      console.log('\n❌ Story docs are out of date. Run `pnpm story:docs` to update.')
      return 1
    }
    console.log('✅ All story docs are up to date.')
    return 0
  }
  else {
    console.log(`📊 Summary: ${updated} updated, ${skipped} skipped, ${errors} errors`)
    return errors > 0 ? 1 : 0
  }
}

main().catch(console.error)
