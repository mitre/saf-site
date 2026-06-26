import { describe, expect, it } from 'vitest'
import { smartScript, smartScriptDeep } from './smart-script'

describe('smartScript', () => {
  it('substitutes trademark/registered/copyright shorthand with bare glyphs', () => {
    expect(smartScript('MITRE SAF(tm)')).toBe('MITRE SAF™')
    expect(smartScript('Acme(r)')).toBe('Acme®')
    expect(smartScript('(c) 2026')).toBe('© 2026')
  })

  it('is case-insensitive', () => {
    expect(smartScript('MITRE SAF(TM)')).toBe('MITRE SAF™')
  })

  it('leaves strings without "(" untouched (short-circuit)', () => {
    expect(smartScript('no shorthand here')).toBe('no shorthand here')
    expect(smartScript('https://example.com/saf-cli')).toBe('https://example.com/saf-cli')
  })

  it('respects disabled options', () => {
    expect(smartScript('(c) 2026', { copyright: false })).toBe('(c) 2026')
  })
})

describe('smartScriptDeep', () => {
  it('recurses through objects and arrays', () => {
    const input = {
      name: 'MITRE SAF(tm)',
      slug: 'mitre-saf',
      items: [{ title: 'eMASSer(tm)' }, { title: 'plain' }],
    }

    expect(smartScriptDeep(input)).toEqual({
      name: 'MITRE SAF™',
      slug: 'mitre-saf',
      items: [{ title: 'eMASSer™' }, { title: 'plain' }],
    })
  })

  it('leaves non-strings, slugs and urls untouched', () => {
    const input = { count: 3, enabled: true, slug: 'a-b-c', url: 'https://x.io' }
    expect(smartScriptDeep(input)).toEqual(input)
  })
})
