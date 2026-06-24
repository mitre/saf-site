<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import SmartScriptProcessor from './components/SmartScriptProcessor.vue'

const { Layout } = DefaultTheme

// Detect wide layout pages via frontmatter
const { frontmatter } = useData()
const isWideLayout = computed(() => {
  return frontmatter.value.wideLayout === true
})
</script>

<template>
  <Layout :class="{ 'wide-layout': isWideLayout }">
    <template #layout-bottom>
      <!-- Client-side processor for Vue component content -->
      <SmartScriptProcessor />
    </template>
    <template #doc-after>
      <!-- Shared site footer (also rendered on the home page via index.md) -->
      <SiteFooter />
    </template>
  </Layout>
</template>
