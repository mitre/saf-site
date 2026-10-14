import type { SlickSheetCopy } from './SlickSheet.vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { smartScript } from '../../lib/smart-script'
import SlickSheet from './SlickSheet.vue'

/**
 * The sheet holds no copy of its own — every string comes from the frontmatter
 * of docs/internal/slick-sheet.md. So these tests do two separate jobs:
 * component behaviour against a fixture, and a contract check that the real
 * page's frontmatter still supplies everything the component needs. Without
 * the second, a typo in the YAML would render a blank section and nothing
 * would fail.
 */

const PAGE = join(__dirname, '../../../internal/slick-sheet.md')

function realCopy(): SlickSheetCopy {
  const raw = readFileSync(PAGE, 'utf-8')
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match)
    throw new Error('slick-sheet.md has no frontmatter block')
  return parseYaml(match[1]).sheet
}

function mountSheet(copy: SlickSheetCopy) {
  return mount(SlickSheet, {
    props: { copy },
    global: {
      stubs: { PillarIcon: true },
      mocks: { withBase: (p: string) => p },
    },
  })
}

describe('slickSheet contract with the page frontmatter', () => {
  const copy = realCopy()

  it('supplies every field the component renders', () => {
    for (const key of [
      'headline',
      'tagline',
      'hero',
      'lede',
      'pillarsHeading',
      'pillars',
      'toolsHeading',
      'tools',
      'whyHeading',
      'why',
      'footer',
    ] as const) {
      expect(copy[key], `frontmatter is missing "${key}"`).toBeTruthy()
    }
    for (const key of ['image', 'alt', 'caption'] as const)
      expect(copy.hero[key], `hero is missing "${key}"`).toBeTruthy()
    expect(copy.footer.contact.length).toBeGreaterThan(0)
    expect(copy.footer.copyright).toBeTruthy()
  })

  it('names all five pillars, each with an icon key the renderer knows', () => {
    expect(copy.pillars).toHaveLength(5)
    expect(copy.pillars.map(p => p.pillar).sort())
      .toEqual(['harden', 'normalize', 'plan', 'validate', 'visualize'])
    for (const p of copy.pillars)
      expect(p.title && p.text, `pillar "${p.pillar}" is missing title or text`).toBeTruthy()
  })

  it('keeps the page within its one-page copy budget', () => {
    // A coarse tripwire for an egregious overrun (someone pasting paragraphs),
    // NOT a precise fit check. The sheet fills ~98% of US Letter, and whether
    // it still fits depends on wrapping, which no unit test can know.
    // THE AUTHORITATIVE CHECK IS THE PRINT PREVIEW SAYING "1 page".
    // Raising a ceiling here is fine; raising it without re-checking the
    // preview is how a two-page sheet ships.
    expect(copy.lede.length, 'lede long enough to risk a second page').toBeLessThan(600)
    expect(copy.pillars.every(p => p.text.length < 110)).toBe(true)
    expect(copy.tools.length).toBeLessThanOrEqual(5)
    expect(copy.why.length).toBeLessThanOrEqual(6)
  })
})

describe('slickSheet rendering', () => {
  it('renders the copy it is given rather than anything of its own', () => {
    const sheet = mountSheet({
      ...realCopy(),
      headline: 'Totally Different Headline',
      pillarsHeading: 'Some Other Heading',
    })

    expect(sheet.text()).toContain('Totally Different Headline')
    expect(sheet.text()).toContain('Some Other Heading')
    // Guards against copy creeping back into the component as a fallback.
    expect(sheet.text()).not.toContain('Five pillars')
  })

  it('substitutes (tm) and (c) shorthand into real glyphs', () => {
    const sheet = mountSheet({
      ...realCopy(),
      headline: 'Security Automation Framework(tm)',
      footer: { contact: [{ label: 'saf.mitre.org' }], copyright: '(c) 2026 The MITRE Corporation' },
    })

    expect(sheet.text()).toContain('Security Automation Framework™')
    expect(sheet.text()).toContain('© 2026 The MITRE Corporation')
    expect(sheet.text()).not.toContain('(tm)')
    expect(sheet.text()).not.toContain('(c)')
  })

  it('leads with the hero image, described for anyone who cannot see it', () => {
    const copy = realCopy()
    const sheet = mountSheet(copy)
    const img = sheet.find('.slick-hero img')

    // Asserted against the frontmatter, not against hardcoded strings: the
    // whole point of the refactor is that wording lives in one editable place,
    // so a test that pins the words would re-couple them.
    expect(img.attributes('src')).toContain(copy.hero.image)
    expect(img.attributes('alt')).toBe(copy.hero.alt)
    expect(sheet.find('.slick-hero figcaption').text())
      .toBe(smartScript(copy.hero.caption, {}))
    // Alt text must describe the image, not merely repeat the caption.
    expect(img.attributes('alt')).not.toBe(copy.hero.caption)
    expect(img.attributes('alt')!.length).toBeGreaterThan(10)
  })

  it('separates the footer contacts with a rule between each pair', () => {
    const sheet = mountSheet(realCopy())
    const contact = sheet.find('.slick-contact')

    expect(contact.text()).toContain('saf.mitre.org')
    expect(contact.text()).toContain('saf@mitre.org')
    expect(contact.text()).toContain('github.com/mitre')
    // n items -> n-1 separators, so the list never leads or trails with a bar.
    expect(contact.findAll('.slick-sep')).toHaveLength(realCopy().footer.contact.length - 1)
  })

  it('renders every pillar and tool supplied', () => {
    const sheet = mountSheet(realCopy())

    expect(sheet.findAll('.slick-pillars li')).toHaveLength(5)
    expect(sheet.findAll('.slick-tools dt')).toHaveLength(4)
  })

  it('no longer advertises catalogue counts', () => {
    // Removed deliberately: exact totals read as precise claims about
    // catalogue size and were judged misleading on a printed handout.
    const sheet = mountSheet(realCopy())

    expect(sheet.find('.slick-figures').exists()).toBe(false)
    expect(sheet.text()).not.toContain('The library today')
  })
})
