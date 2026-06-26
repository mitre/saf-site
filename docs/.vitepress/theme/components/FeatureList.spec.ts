import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import FeatureList from './FeatureList.vue'

describe('featureList', () => {
  it('renders the items prop as a list (ul role=list + one li per item)', () => {
    const wrapper = mount(FeatureList, {
      props: { items: [{ title: 'One' }, { title: 'Two' }] },
    })

    const ul = wrapper.find('ul.feature-list')
    expect(ul.exists()).toBe(true)
    expect(ul.attributes('role')).toBe('list')
    expect(wrapper.findAll('li.feature-list__item')).toHaveLength(2)
  })

  it('wraps custom slot content in list items', () => {
    const wrapper = mount(FeatureList, {
      slots: {
        default: () => [h('div', 'A'), h('div', 'B'), h('div', 'C')],
      },
    })

    const lis = wrapper.findAll('li.feature-list__item')
    expect(lis).toHaveLength(3)
    expect(lis[1].text()).toBe('B')
  })
})
