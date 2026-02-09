<script setup lang="ts">
import type { Component } from 'vue'
import { useData } from 'vitepress'
import { onMounted, ref, shallowRef } from 'vue'

const props = withDefaults(defineProps<{
  /** URL path to the JSON file to display */
  src: string
  /** Initial expansion depth */
  expandDepth?: number
}>(), {
  expandDepth: 2,
})

const { isDark } = useData()

const jsonData = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const ViewerComponent = shallowRef<Component | null>(null)

onMounted(async () => {
  try {
    // Dynamically import vue3-json-viewer (browser-only)
    const mod = await import('vue3-json-viewer')
    ViewerComponent.value = mod.JsonViewer ?? mod.default

    const res = await fetch(props.src)
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
    <component
      :is="ViewerComponent"
      v-else-if="jsonData && ViewerComponent"
      :value="jsonData"
      :expand-depth="expandDepth"
      :theme="isDark ? 'dark' : 'light'"
      copyable
      boxed
      expanded
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

/* Override vue3-json-viewer defaults for VitePress compatibility */
.jv-container {
  font-family: var(--vp-font-family-mono) !important;
  font-size: 13px !important;
  border-radius: 8px !important;
  max-height: 900px;
  overflow: auto;
}
</style>
