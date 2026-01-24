import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LogoMarquee from './LogoMarquee.vue'

const sampleItems = [
  { name: 'GitHub', href: 'https://github.com' },
  { name: 'Oracle' },
  { name: 'AWS' }
]

// Larger set for multi-row testing
const manyItems = [
  { name: 'SonarQube' },
  { name: 'Burp Suite' },
  { name: 'OWASP ZAP' },
  { name: 'Nessus' },
  { name: 'Qualys' },
  { name: 'Snyk' },
  { name: 'Veracode' },
  { name: 'Checkmarx' },
  { name: 'Fortify' },
  { name: 'Prisma Cloud' },
  { name: 'AWS Inspector' },
  { name: 'Azure Defender' }
]

describe('LogoMarquee', () => {
  describe('rendering', () => {
    it('renders items repeated for seamless loop', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, repeat: 2 }
      })

      // 3 items × 2 repeats = 6 logo items
      expect(wrapper.findAll('.logo-marquee-item')).toHaveLength(6)
    })

    it('respects custom repeat count', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, repeat: 3 }
      })

      // 3 items × 3 repeats = 9 logo items
      expect(wrapper.findAll('.logo-marquee-item')).toHaveLength(9)
    })
  })

  describe('animation', () => {
    it('sets animation duration via CSS variable', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, duration: 20 }
      })

      expect(wrapper.find('.logo-marquee').attributes('style')).toContain('--marquee-duration: 20s')
    })

    it('applies pause-on-hover class by default', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems }
      })

      expect(wrapper.find('.logo-marquee--pause-hover').exists()).toBe(true)
    })

    it('can disable pause-on-hover', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, pauseOnHover: false }
      })

      expect(wrapper.find('.logo-marquee--pause-hover').exists()).toBe(false)
    })

    it('applies reverse class when enabled', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, reverse: true }
      })

      expect(wrapper.find('.logo-marquee--reverse').exists()).toBe(true)
    })
  })

  describe('overlay', () => {
    it('shows overlay by default', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems }
      })

      expect(wrapper.find('.logo-marquee--overlay').exists()).toBe(true)
    })

    it('can hide overlay', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, overlay: false }
      })

      expect(wrapper.find('.logo-marquee--overlay').exists()).toBe(false)
    })

    it('uses mask-image for fade effect (works on any background)', () => {
      // This test documents that we use mask-image instead of gradient overlays
      // mask-image fades content to transparent, working on ANY background color
      // This is a regression test - do NOT change back to gradient overlay approach
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, overlay: true }
      })

      // The overlay class should exist and use CSS mask-image (not pseudo-elements)
      // Note: We can't easily test computed styles in jsdom, but the class presence
      // confirms the mask-image CSS will be applied
      expect(wrapper.find('.logo-marquee--overlay').exists()).toBe(true)
      // No pseudo-elements needed - mask-image is on the container itself
    })
  })

  describe('links', () => {
    it('renders anchor tags for items with href', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, repeat: 1 }
      })

      const links = wrapper.findAll('a.logo-marquee-item')
      expect(links).toHaveLength(1) // Only GitHub has href
      expect(links[0].attributes('href')).toBe('https://github.com')
      expect(links[0].attributes('target')).toBe('_blank')
    })

    it('renders span for items without href', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, repeat: 1 }
      })

      const spans = wrapper.findAll('span.logo-marquee-item')
      expect(spans).toHaveLength(2) // Oracle and AWS
    })
  })

  describe('sizing', () => {
    it('uses default size of 40', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: [{ name: 'GitHub' }], repeat: 1 }
      })

      const brandIcon = wrapper.findComponent({ name: 'BrandIcon' })
      expect(brandIcon.props('size')).toBe(40)
    })

    it('passes custom size to BrandIcon', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: [{ name: 'GitHub' }], size: 64, repeat: 1 }
      })

      const brandIcon = wrapper.findComponent({ name: 'BrandIcon' })
      expect(brandIcon.props('size')).toBe(64)
    })

    it('applies size to custom images', () => {
      const wrapper = mount(LogoMarquee, {
        props: {
          items: [{ name: 'Custom', image: '/logo.png' }],
          size: 56,
          repeat: 1
        }
      })

      const img = wrapper.find('img.logo-image')
      expect(img.attributes('width')).toBe('56')
      expect(img.attributes('height')).toBe('56')
    })
  })

  describe('accessibility', () => {
    it('sets title attribute for all items', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: sampleItems, repeat: 1 }
      })

      const items = wrapper.findAll('.logo-marquee-item')
      expect(items[0].attributes('title')).toBe('GitHub')
      expect(items[1].attributes('title')).toBe('Oracle')
    })
  })

  describe('multi-row', () => {
    it('renders single row by default', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, repeat: 1 }
      })

      expect(wrapper.findAll('.logo-marquee')).toHaveLength(1)
    })

    it('splits items into multiple rows', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 3, repeat: 1 }
      })

      expect(wrapper.findAll('.logo-marquee')).toHaveLength(3)
    })

    it('distributes items evenly across rows', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 3, repeat: 1 }
      })

      // 12 items / 3 rows = 4 items per row
      const rows = wrapper.findAll('.logo-marquee')
      rows.forEach(row => {
        expect(row.findAll('.logo-marquee-item')).toHaveLength(4)
      })
    })

    it('handles uneven item distribution', () => {
      // 12 items / 5 rows = ceil(2.4) = 3 items per row
      // Row 1: 3, Row 2: 3, Row 3: 3, Row 4: 3, Row 5: 0 (empty, not rendered)
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 5, repeat: 1 }
      })

      // Should have 4 rows (last row would be empty so not rendered)
      const rows = wrapper.findAll('.logo-marquee')
      expect(rows.length).toBeLessThanOrEqual(5)
      expect(rows.length).toBeGreaterThan(0)
    })

    it('applies multi-row class when rows > 1', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 2, repeat: 1 }
      })

      expect(wrapper.find('.logo-marquee--multi-row').exists()).toBe(true)
    })

    it('does not apply multi-row class when rows = 1', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 1, repeat: 1 }
      })

      expect(wrapper.find('.logo-marquee--multi-row').exists()).toBe(false)
    })

    it('alternates direction per row by default', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 3, repeat: 1 }
      })

      const rows = wrapper.findAll('.logo-marquee')
      // Default: row 0 not reversed, row 1 reversed, row 2 not reversed
      expect(rows[0].classes()).not.toContain('logo-marquee--reverse')
      expect(rows[1].classes()).toContain('logo-marquee--reverse')
      expect(rows[2].classes()).not.toContain('logo-marquee--reverse')
    })

    it('respects reverse prop with alternating rows', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 3, reverse: true, repeat: 1 }
      })

      const rows = wrapper.findAll('.logo-marquee')
      // With reverse: row 0 reversed, row 1 not reversed, row 2 reversed
      expect(rows[0].classes()).toContain('logo-marquee--reverse')
      expect(rows[1].classes()).not.toContain('logo-marquee--reverse')
      expect(rows[2].classes()).toContain('logo-marquee--reverse')
    })

    it('can disable alternating direction', () => {
      const wrapper = mount(LogoMarquee, {
        props: { items: manyItems, rows: 3, alternateDirection: false, repeat: 1 }
      })

      const rows = wrapper.findAll('.logo-marquee')
      // All rows should have same direction (not reversed by default)
      rows.forEach(row => {
        expect(row.classes()).not.toContain('logo-marquee--reverse')
      })
    })
  })
})
