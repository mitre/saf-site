import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BrandIcon from './BrandIcon.vue'

// A name that resolves to neither a local SVG nor a known icon falls through to
// the generic fallback span, which is the most predictable render path to test.
const UNKNOWN = 'Zzz Unknown Brand 999'

describe('brandIcon accessibility', () => {
  it('exposes the brand name as an accessible image by default', () => {
    const wrapper = mount(BrandIcon, { props: { name: UNKNOWN } })

    const root = wrapper.find('.brand-icon-fallback')
    expect(root.attributes('role')).toBe('img')
    expect(root.attributes('aria-label')).toBe(UNKNOWN)
    expect(root.attributes('aria-hidden')).toBeUndefined()
  })

  it('hides itself from assistive tech when decorative', () => {
    const wrapper = mount(BrandIcon, { props: { name: UNKNOWN, decorative: true } })

    const root = wrapper.find('.brand-icon-fallback')
    expect(root.attributes('aria-hidden')).toBe('true')
    expect(root.attributes('role')).toBeUndefined()
    expect(root.attributes('aria-label')).toBeUndefined()
  })
})
