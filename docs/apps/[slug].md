---
layout: doc
aside: false
wideLayout: true
---

<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'
import AppDetail from '../.vitepress/theme/components/AppDetail.vue'
import { data as toolsData } from '../.vitepress/loaders/tools.data'

const { params } = useData()

// Find the tool matching this slug
const tool = computed(() => {
  return toolsData.tools.find(t => t.slug === params.value.slug)
})

// Set page title dynamically
const pageTitle = computed(() => {
  return tool.value ? `${tool.value.name} - SAF Apps` : 'SAF Apps'
})
</script>

<AppDetail v-if="tool" :tool="tool" />

<div v-else class="not-found">
  <h1>Tool Not Found</h1>
  <p>The tool "{{ params.slug }}" could not be found.</p>
  <p><a href="/apps/">← Back to Apps</a></p>
</div>

<style scoped>
.not-found {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
