import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import SchemaViewer from './SchemaViewer.vue'

// vue3-json-viewer is browser-only and dynamically imported by the component.
// Stub it with a component that serialises the `value` it receives, so tests
// can assert *which* (sub)schema node is being displayed.
vi.mock('vue3-json-viewer', () => ({
  JsonViewer: defineComponent({
    name: 'JsonViewerStub',
    props: { value: { type: null, default: null } },
    setup: props => () => h('pre', { 'data-testid': 'json' }, JSON.stringify(props.value)),
  }),
}))

const SCHEMA = {
  type: 'object',
  title: 'Exec JSON',
  properties: {
    platform: { $ref: '#/definitions/Platform' },
    statistics: { $ref: '#/definitions/Statistics' },
  },
  definitions: {
    Platform: { type: 'object', title: 'Platform schema', properties: { name: { type: 'string' } } },
    Statistics: { type: 'object', title: 'Statistics schema' },
  },
}

const TABS = [
  { label: 'Full Schema', pointer: '' },
  { label: 'Platform', pointer: 'definitions/Platform' },
  { label: 'Statistics', pointer: 'definitions/Statistics' },
]

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => SCHEMA,
  })))
}

async function mountReady(props: Record<string, unknown>) {
  stubFetch()
  const wrapper = mount(SchemaViewer, { props: { src: '/schema.json', ...props } })
  // onMounted does a dynamic import (needs a macrotask, so flushPromises alone
  // isn't enough) then fetches + parses the schema. Wait for loading to clear.
  await vi.waitFor(() => expect(wrapper.find('.schema-viewer-loading').exists()).toBe(false))
  return wrapper
}

describe('schemaViewer with tabs', () => {
  it('renders an accessible tablist with one tab per entry', async () => {
    const wrapper = await mountReady({ tabs: TABS })

    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.exists()).toBe(true)

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(TABS.length)
    expect(tabs.map(t => t.text())).toEqual(['Full Schema', 'Platform', 'Statistics'])
  })

  it('shows the whole document on the first (Full Schema) tab', async () => {
    const wrapper = await mountReady({ tabs: TABS })

    const json = wrapper.get('[data-testid="json"]').text()
    expect(json).toContain('Exec JSON')
    expect(json).toContain('definitions')
  })

  it('switches the displayed node when another tab is selected', async () => {
    const wrapper = await mountReady({ tabs: TABS })

    const platformTab = wrapper.findAll('[role="tab"]').find(t => t.text() === 'Platform')!
    // Reka's tabs use automatic activation — selection follows focus.
    await platformTab.trigger('focus')
    await platformTab.trigger('click')

    // Reka mounts only the active panel's content, so once it swaps the visible
    // viewer shows just the Platform sub-schema, not the full root document.
    await vi.waitFor(() => {
      const json = wrapper.get('[data-testid="json"]').text()
      expect(json).toContain('Platform schema')
      expect(json).not.toContain('definitions')
    })
  })

  it('falls back to the full document with no tab bar when tabs are omitted', async () => {
    const wrapper = await mountReady({})

    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
    const json = wrapper.get('[data-testid="json"]').text()
    expect(json).toContain('Exec JSON')
    expect(json).toContain('definitions')
  })

  it('surfaces a fetch failure as an error message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    const wrapper = mount(SchemaViewer, { props: { src: '/missing.json', tabs: TABS } })

    await vi.waitFor(() => expect(wrapper.find('.schema-viewer-error').exists()).toBe(true))
    expect(wrapper.find('.schema-viewer-error').text()).toContain('404')
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
  })
})
