import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LogoGrid from './LogoGrid.vue'

const sampleItems = [
  { name: 'GitHub', href: 'https://github.com' },
  { name: 'Oracle', description: 'Database partner' },
  { name: 'AWS', href: 'https://aws.amazon.com' },
  { name: 'Custom', image: '/logos/custom.png' }
]

describe('LogoGrid', () => {
  describe('rendering', () => {
    it('renders all logo items', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      expect(wrapper.findAll('.logo-item')).toHaveLength(4)
    })

    it('renders title when provided', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems, title: 'Our Partners' }
      })

      expect(wrapper.find('.logo-grid-title').text()).toBe('Our Partners')
    })

    it('does not render title when not provided', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      expect(wrapper.find('.logo-grid-title').exists()).toBe(false)
    })
  })

  describe('links', () => {
    it('renders anchor tags for items with href', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      const links = wrapper.findAll('a.logo-item')
      expect(links).toHaveLength(2) // GitHub and AWS

      const githubLink = links[0]
      expect(githubLink.attributes('href')).toBe('https://github.com')
      expect(githubLink.attributes('target')).toBe('_blank')
      expect(githubLink.attributes('rel')).toBe('noopener noreferrer')
    })

    it('renders div for items without href', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      const divs = wrapper.findAll('div.logo-item')
      expect(divs).toHaveLength(2) // Oracle and Custom
    })
  })

  describe('images', () => {
    it('uses custom image when provided', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      const img = wrapper.find('img.logo-image')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('/logos/custom.png')
      expect(img.attributes('alt')).toBe('Custom')
    })

    it('uses BrandIcon for items without custom image', () => {
      const wrapper = mount(LogoGrid, {
        props: {
          items: [{ name: 'GitHub' }]
        }
      })

      // BrandIcon should be rendered (not img.logo-image)
      expect(wrapper.find('img.logo-image').exists()).toBe(false)
      expect(wrapper.find('.brand-icon, .brand-icon-fallback').exists()).toBe(true)
    })
  })

  describe('name labels', () => {
    it('shows name labels when showNames is true', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems, showNames: true }
      })

      const names = wrapper.findAll('.logo-name')
      expect(names).toHaveLength(4)
      expect(names[0].text()).toBe('GitHub')
    })

    it('hides name labels by default', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      expect(wrapper.find('.logo-name').exists()).toBe(false)
    })
  })

  describe('variants', () => {
    it('applies default variant class', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      expect(wrapper.find('.logo-grid--default').exists()).toBe(true)
    })

    it('applies compact variant class', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems, variant: 'compact' }
      })

      expect(wrapper.find('.logo-grid--compact').exists()).toBe(true)
    })

    it('applies card variant class', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems, variant: 'card' }
      })

      expect(wrapper.find('.logo-grid--card').exists()).toBe(true)
    })
  })

  describe('sizing', () => {
    it('passes size prop to BrandIcon', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: [{ name: 'GitHub' }], size: 64 }
      })

      // Check that size is passed (via the rendered icon)
      const brandIcon = wrapper.findComponent({ name: 'BrandIcon' })
      expect(brandIcon.props('size')).toBe(64)
    })

    it('applies size to custom images', () => {
      const wrapper = mount(LogoGrid, {
        props: {
          items: [{ name: 'Custom', image: '/logo.png' }],
          size: 64
        }
      })

      const img = wrapper.find('img.logo-image')
      expect(img.attributes('width')).toBe('64')
      expect(img.attributes('height')).toBe('64')
    })
  })

  describe('columns', () => {
    it('uses auto-fit columns by default', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      const grid = wrapper.find('.logo-grid-items')
      expect(grid.attributes('style')).toBeUndefined()
    })

    it('applies fixed columns when specified', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems, columns: 4 }
      })

      const grid = wrapper.find('.logo-grid-items')
      expect(grid.attributes('style')).toContain('grid-template-columns: repeat(4, 1fr)')
    })
  })

  describe('accessibility', () => {
    it('uses description as title attribute when provided', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      const oracleItem = wrapper.findAll('.logo-item')[1]
      expect(oracleItem.attributes('title')).toBe('Database partner')
    })

    it('falls back to name for title attribute', () => {
      const wrapper = mount(LogoGrid, {
        props: { items: sampleItems }
      })

      const githubItem = wrapper.findAll('.logo-item')[0]
      expect(githubItem.attributes('title')).toBe('GitHub')
    })
  })
})
