/**
 * Tests for markdown-it-smartscript plugin
 */

import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { markdownItSmartScript } from '../plugins/markdown-it-smartscript'

describe('markdown-it-smartscript', () => {
  it('should transform (tm) to trademark symbol', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('MITRE SAF(tm) is great')
    expect(result).toContain('<span class="ss-tm">™</span>')
    expect(result).not.toContain('(tm)')
  })

  it('should transform (TM) to trademark symbol (case insensitive)', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('MITRE SAF(TM) is great')
    expect(result).toContain('<span class="ss-tm">™</span>')
    expect(result).not.toContain('(TM)')
  })

  it('should transform (r) to registered symbol', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('Company(r) name')
    expect(result).toContain('<span class="ss-reg">®</span>')
    expect(result).not.toContain('(r)')
  })

  it('should transform (c) to copyright symbol', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('Copyright (c) 2026')
    expect(result).toContain('©')
    expect(result).not.toContain('(c)')
  })

  it('should not transform inside code blocks', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('```\nMITRE SAF(tm)\n```')
    expect(result).toContain('(tm)')
    expect(result).not.toContain('<span class="ss-tm">')
  })

  it('should not transform inside inline code', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('This is `MITRE SAF(tm)` code')
    expect(result).toContain('(tm)')
    expect(result).not.toContain('<span class="ss-tm">')
  })

  it('should transform in headings', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('# MITRE SAF(tm)')
    expect(result).toContain('<span class="ss-tm">™</span>')
  })

  it('should transform in paragraphs', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('MITRE SAF(tm) provides tools.')
    expect(result).toContain('<span class="ss-tm">™</span>')
  })

  it('should handle possessive forms correctly', () => {
    const md = new MarkdownIt()
    md.use(markdownItSmartScript)

    const result = md.render('MITRE SAF\'s(tm) security tools')
    expect(result).toContain('SAF\'s<span class="ss-tm">™</span>')
  })
})
