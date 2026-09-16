import { describe, expect, it } from 'vitest'
import { buildRedirectOutputs, hasFileExtension, resolveTarget } from './build-redirects'

describe('hasFileExtension', () => {
  it('detects asset-looking paths', () => {
    expect(hasFileExtension('SAF-Executive-Level-Summary.pdf')).toBe(true)
    expect(hasFileExtension('foo/bar.json')).toBe(true)
    expect(hasFileExtension('a/b/c.tar.gz')).toBe(true)
  })

  it('treats page paths as extensionless', () => {
    expect(hasFileExtension('libs/validate')).toBe(false)
    expect(hasFileExtension('content/')).toBe(false)
    expect(hasFileExtension('apps')).toBe(false)
  })

  it('does not mistake a dot in a directory name for an extension', () => {
    // only the final segment can carry an extension
    expect(hasFileExtension('v1.2/guide')).toBe(false)
  })
})

describe('resolveTarget', () => {
  it('prefixes root-relative targets with the base', () => {
    expect(resolveTarget('/content/', '/saf-site/')).toBe('/saf-site/content/')
    expect(resolveTarget('/content/', '/')).toBe('/content/')
  })

  it('leaves absolute URLs alone', () => {
    expect(resolveTarget('https://example.com/x', '/saf-site/')).toBe('https://example.com/x')
  })
})

describe('buildRedirectOutputs', () => {
  const map = {
    'libs/validate': '/content/?pillar=validate',
    'SAF-Executive-Level-Summary.pdf': '/MITRE-SAF-Overview-2026.pdf',
  }

  it('emits one 301 line per entry in the _redirects file, base-aware', () => {
    const out = buildRedirectOutputs(map, '/')
    const lines = out.redirectsFile.trim().split('\n')

    expect(lines).toContain('/libs/validate /content/?pillar=validate 301')
    expect(lines).toContain('/SAF-Executive-Level-Summary.pdf /MITRE-SAF-Overview-2026.pdf 301')
    expect(lines).toHaveLength(2)
  })

  it('applies the base to both sides under a subpath deployment', () => {
    const out = buildRedirectOutputs(map, '/saf-site/')

    expect(out.redirectsFile).toContain('/saf-site/libs/validate /saf-site/content/?pillar=validate 301')
  })

  it('emits a meta-refresh page for extensionless page paths', () => {
    const out = buildRedirectOutputs(map, '/')
    const page = out.metaRefreshPages.find(p => p.path === 'libs/validate/index.html')

    expect(page).toBeDefined()
    expect(page!.html).toContain('http-equiv="refresh"')
    expect(page!.html).toContain('/content/?pillar=validate')
  })

  it('does NOT emit a meta-refresh page for asset paths', () => {
    // A directory named "*.pdf" containing index.html collides with real
    // assets and breaks static-host builds; those redirect via _redirects only.
    const out = buildRedirectOutputs(map, '/')

    expect(out.metaRefreshPages.map(p => p.path)).not.toContain('SAF-Executive-Level-Summary.pdf/index.html')
    expect(out.metaRefreshPages.every(p => !p.path.includes('.pdf/'))).toBe(true)
  })

  it('produces no meta-refresh pages when every entry is an asset', () => {
    const out = buildRedirectOutputs({ 'a.pdf': '/b.pdf' }, '/')

    expect(out.metaRefreshPages).toHaveLength(0)
    expect(out.redirectsFile.trim()).toBe('/a.pdf /b.pdf 301')
  })
})
