import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import CardGrid from './CardGrid.vue'

describe('cardGrid', () => {
  const cards = {
    default: () => [
      h('article', { class: 'card' }, 'A'),
      h('article', { class: 'card' }, 'B'),
      h('article', { class: 'card' }, 'C'),
    ],
  }

  it('renders as a list (ul + role=list)', () => {
    const wrapper = mount(CardGrid, { slots: cards })

    const ul = wrapper.find('ul.card-grid')
    expect(ul.exists()).toBe(true)
    expect(ul.attributes('role')).toBe('list')
  })

  it('wraps each slotted card in its own list item', () => {
    const wrapper = mount(CardGrid, { slots: cards })

    const lis = wrapper.findAll('li.card-grid__item')
    expect(lis).toHaveLength(3)
    // The original card is preserved inside the wrapper.
    expect(lis[0].find('.card').text()).toBe('A')
    expect(lis[2].find('.card').text()).toBe('C')
  })

  it('applies the column modifier class', () => {
    const wrapper = mount(CardGrid, { props: { columns: 3 }, slots: cards })

    expect(wrapper.find('ul').classes()).toContain('card-grid--cols-3')
  })
})
