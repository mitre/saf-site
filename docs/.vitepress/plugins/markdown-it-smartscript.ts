/**
 * markdown-it SmartScript Plugin
 * Build-time typography for markdown prose (zero client-side cost):
 *   (tm)/(TM) → ™   (r)/(R) → ®   (c)/(C) → ©
 *
 * Substitution logic is shared with the data loaders via lib/smart-script, so
 * prose and Pocketbase-driven content render trademarks identically without any
 * client-side DOM mutation (see saf-site-vitepress-iqz). Code spans/blocks are
 * left untouched.
 */

import type MarkdownIt from 'markdown-it'
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs'
import type { SmartScriptOptions } from '../lib/smart-script'
import { smartScript } from '../lib/smart-script'

export type { SmartScriptOptions }

/**
 * Process inline tokens recursively, substituting in text tokens only.
 * code_inline tokens have their own type and are skipped.
 */
function processInlineTokens(tokens: any[], options: SmartScriptOptions): void {
  for (const token of tokens) {
    if (token.children && token.children.length > 0)
      processInlineTokens(token.children, options)

    // Bare glyph substitution keeps the token as plain text (no HTML needed).
    if (token.type === 'text')
      token.content = smartScript(token.content, options)
  }
}

/**
 * markdown-it plugin
 */
export function markdownItSmartScript(md: MarkdownIt, options: SmartScriptOptions = {}): void {
  // Track whether we're inside a code block / fence (skip those).
  let inCodeBlock = false

  md.core.ruler.after('inline', 'smartscript', (state: StateCore) => {
    const tokens = state.tokens

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]

      if (token.type === 'fence' || token.type === 'code_block')
        continue

      if (token.type === 'inline' && token.children && !inCodeBlock)
        processInlineTokens(token.children, options)

      if (token.nesting === 1 && (token.tag === 'code' || token.tag === 'pre'))
        inCodeBlock = true
      else if (token.nesting === -1 && (token.tag === 'code' || token.tag === 'pre'))
        inCodeBlock = false
    }

    return true
  })
}
