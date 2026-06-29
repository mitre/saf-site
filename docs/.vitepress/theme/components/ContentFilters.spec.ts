import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ContentFilters from './ContentFilters.vue'

describe('contentFilters accessibility', () => {
  it('programmatically associates the Search label with its input', () => {
    const wrapper = mount(ContentFilters, { props: { items: [] } })

    const searchLabel = wrapper
      .findAll('label.filter-label')
      .find(label => label.text() === 'Search')
    expect(searchLabel).toBeTruthy()

    const labelFor = searchLabel!.attributes('for')
    expect(labelFor).toBeTruthy()

    // The id falls through to the native <input> rendered by <Input>.
    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.attributes('id')).toBe(labelFor)
  })
})
