<script setup lang="ts">
import type { Component } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { useData, withBase } from 'vitepress'
import { computed, onMounted, ref, shallowRef } from 'vue'

/**
 * A single sub-schema tab.
 */
export interface SchemaTab {
  /** Label shown on the tab button. */
  label: string
  /**
   * JSON-pointer-style path into the loaded document, slash-separated
   * (e.g. `'definitions/Platform'`). An empty string targets the whole
   * document — use it for a "Full Schema" tab.
   */
  pointer: string
}

const props = withDefaults(defineProps<{
  /** URL path to the JSON file to display */
  src: string
  /** Initial expansion depth */
  expandDepth?: number
  /**
   * Optional sub-schema tabs. When provided, a tab bar is rendered above the
   * viewer so users can jump straight to a referenced sub-schema/primitive
   * (the targets of the schema's `$ref`s) instead of hunting for it inside the
   * full document. Without this prop the viewer shows the whole document, as
   * before.
   */
  tabs?: SchemaTab[]
}>(), {
  expandDepth: 2,
})

const { isDark } = useData()

const jsonData = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const ViewerComponent = shallowRef<Component | null>(null)

const activeTab = ref(props.tabs?.[0]?.pointer ?? '')

/**
 * Resolve a slash-separated JSON pointer against the loaded document.
 * An empty pointer returns the whole document. Returns `undefined` if any
 * segment is missing, so the viewer can show nothing rather than throw.
 */
function resolvePointer(pointer: string): unknown {
  if (!jsonData.value || pointer === '')
    return jsonData.value
  return pointer.split('/').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object')
      return (node as Record<string, unknown>)[key]
    return undefined
  }, jsonData.value)
}

const theme = computed(() => (isDark.value ? 'dark' : 'light'))

onMounted(async () => {
  try {
    // Dynamically import vue3-json-viewer (browser-only)
    const mod = await import('vue3-json-viewer')
    ViewerComponent.value = mod.JsonViewer ?? mod.default

    const res = await fetch(withBase(props.src))
    if (!res.ok)
      throw new Error(`Failed to load schema: ${res.status}`)
    jsonData.value = await res.json()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load schema'
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="schema-viewer">
    <div v-if="loading" class="schema-viewer-loading">
      Loading schema...
    </div>
    <div v-else-if="error" class="schema-viewer-error">
      {{ error }}
    </div>

    <!-- Tabbed view: one tab per referenced sub-schema. -->
    <TabsRoot v-else-if="tabs?.length && jsonData && ViewerComponent" v-model="activeTab" class="schema-tabs">
      <TabsList class="schema-tablist" aria-label="HDF schema sections">
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.pointer"
          :value="tab.pointer"
          class="schema-tab"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        v-for="tab in tabs"
        :key="tab.pointer"
        :value="tab.pointer"
        class="schema-tabpanel"
      >
        <component
          :is="ViewerComponent"
          :value="resolvePointer(tab.pointer)"
          :expand-depth="expandDepth"
          :theme="theme"
          copyable
          sort
        />
      </TabsContent>
    </TabsRoot>

    <!-- Default: whole document, no tabs. -->
    <component
      :is="ViewerComponent"
      v-else-if="jsonData && ViewerComponent"
      :value="jsonData"
      :expand-depth="expandDepth"
      :theme="theme"
      copyable
      sort
    />
  </div>
</template>

<style>
@import 'vue3-json-viewer/dist/vue3-json-viewer.css';

.schema-viewer {
  margin: 1rem 0;
}

.schema-viewer-loading,
.schema-viewer-error {
  padding: 2rem;
  text-align: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.schema-viewer-error {
  color: var(--vp-c-danger-1, #e53e3e);
}

.schema-tablist {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 0.75rem;
}

.schema-tab {
  appearance: none;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.1s, border-color 0.1s;
}

.schema-tab:hover {
  color: var(--vp-c-text-1);
}

.schema-tab[data-state='active'] {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* Keyboard focus must be clearly visible (WCAG 2.4.7). */
.schema-tab:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Override vue3-json-viewer defaults for VitePress compatibility.
   We intentionally do NOT use the viewer's own `boxed` mode: it clamps the
   code to 300px and adds a "show more" gradient/chevron (.jv-more) that stays
   pinned to the bottom even once expanded. Instead we box and scroll the
   schema ourselves here. */
.jv-container {
  font-family: var(--vp-font-family-mono) !important;
  font-size: 13px !important;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px !important;
  max-height: 900px;
  overflow: auto;
}
</style>
