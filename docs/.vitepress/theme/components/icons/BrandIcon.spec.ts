import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import BrandIcon from './BrandIcon.vue'

// The global setup mocks `vitepress` with isDark permanently false. Override it
// here with a ref we control so both themes can be exercised.
const isDark = ref(false)
vi.mock('vitepress', () => ({
  useData: () => ({
    isDark,
    frontmatter: ref({}),
    page: ref({ relativePath: '' }),
    site: ref({ title: 'SAF' }),
    theme: ref({}),
    lang: ref('en-US'),
    localePath: ref('/'),
  }),
  useRoute: () => ({ path: '/', data: {} }),
  withBase: (url: string) => url,
}))

function srcFor(name: string): string | undefined {
  return mount(BrandIcon, { props: { name } }).find('img.brand-icon-local').attributes('src')
}

describe('brandIcon local SVG resolution', () => {
  it('resolves a brand to its local mark', () => {
    isDark.value = false
    expect(srcFor('Cinc Auditor')).toBe('/icons/cinc.svg')
    expect(srcFor('cinc')).toBe('/icons/cinc.svg')
  })

  it('resolves case-insensitively', () => {
    isDark.value = false
    expect(srcFor('CINC AUDITOR')).toBe('/icons/cinc.svg')
  })

  describe('dark-background variants', () => {
    it('swaps to the dark variant when the site is in dark mode', () => {
      isDark.value = true
      expect(srcFor('Cinc Auditor')).toBe('/icons/cinc-white.svg')
      isDark.value = false
    })

    it('keeps the light mark in dark mode for brands with no dark variant', () => {
      // heimdall ships one asset only; it must not resolve to undefined/null
      isDark.value = false
      const light = srcFor('Heimdall')
      isDark.value = true
      expect(srcFor('Heimdall')).toBe(light)
      isDark.value = false
    })

    it('does not use the dark variant in light mode', () => {
      isDark.value = false
      expect(srcFor('Cinc Auditor')).not.toContain('white')
    })

    it('swaps the src on an ALREADY-MOUNTED instance when the theme flips', async () => {
      // This is the real-world path: SSR emits the light mark, then the client
      // hydrates in dark mode. Mounting fresh per theme (as the tests above do)
      // would not catch a component that reads isDark once and never updates.
      isDark.value = false
      const wrapper = mount(BrandIcon, { props: { name: 'Cinc Auditor' } })
      expect(wrapper.find('img.brand-icon-local').attributes('src')).toBe('/icons/cinc.svg')

      isDark.value = true
      await nextTick()
      expect(wrapper.find('img.brand-icon-local').attributes('src')).toBe('/icons/cinc-white.svg')

      isDark.value = false
      await nextTick()
      expect(wrapper.find('img.brand-icon-local').attributes('src')).toBe('/icons/cinc.svg')
    })
  })
})
