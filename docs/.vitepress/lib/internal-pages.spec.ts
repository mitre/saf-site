import { describe, expect, it } from 'vitest'
import { INTERNAL_PAGES_GLOB, resolveSrcExclude } from './internal-pages'

/**
 * These guard a publication boundary, not a formatting preference: if
 * `srcExclude` stops covering `internal/**` under production, the slick sheet
 * silently becomes a public page on saf.mitre.org. That failure is invisible —
 * the build succeeds and every other test still passes — so it gets its own
 * test rather than relying on anyone noticing an extra file in dist/.
 */
describe('internal page exclusion', () => {
  it('excludes internal pages from a production build', () => {
    expect(resolveSrcExclude('production')).toContain(INTERNAL_PAGES_GLOB)
  })

  it('serves internal pages in dev, where NODE_ENV is undefined', () => {
    // VitePress 2.0.0-alpha.15 leaves NODE_ENV unset under `vitepress dev`.
    // The sheet has to render somewhere, and dev is that somewhere.
    expect(resolveSrcExclude(undefined)).not.toContain(INTERNAL_PAGES_GLOB)
    expect(resolveSrcExclude(undefined)).toEqual([])
  })

  it('treats any non-production value as dev rather than guessing', () => {
    for (const env of ['development', 'test', '']) {
      expect(resolveSrcExclude(env)).toEqual([])
    }
  })

  it('matches the internal directory and not look-alike paths', () => {
    // Guards against a glob that over-matches (e.g. 'internal*' would also
    // catch a future `internal-notes.md` meant to be public) or under-matches
    // (a bare 'internal' would miss nested files).
    expect(INTERNAL_PAGES_GLOB).toBe('internal/**')
  })
})
