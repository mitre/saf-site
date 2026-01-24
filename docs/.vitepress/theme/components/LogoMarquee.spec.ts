import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LogoMarquee from './LogoMarquee.vue'

const sampleItems = [
  { name: 'GitHub', href: 'https://github.com' },
  { name: 'Oracle' },
  { name: 'AWS' }
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
})
