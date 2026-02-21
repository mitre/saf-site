<!--
  Simple client-side typography processor
  Handles Vue component props that aren't processed by markdown-it
-->
<script setup lang="ts">
import { useRoute } from 'vitepress'
import { onMounted, watch } from 'vue'

/**
 * Simple text replacement for rendered HTML
 */
function processDOM() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip script, style, code, pre elements
        const parent = node.parentElement
        if (!parent)
          return NodeFilter.FILTER_REJECT

        const tagName = parent.tagName.toLowerCase()
        if (['script', 'style', 'code', 'pre'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT
        }

        // Only process if text contains our patterns
        const text = node.textContent || ''
        if (text.match(/\((tm|r|c)\)/i)) {
          return NodeFilter.FILTER_ACCEPT
        }

        return NodeFilter.FILTER_REJECT
      },
    },
  )

  const nodesToProcess: Text[] = []
  let node = walker.nextNode()

  while (node) {
    nodesToProcess.push(node as Text)
    node = walker.nextNode()
  }

  // Process collected text nodes
  nodesToProcess.forEach((textNode) => {
    const text = textNode.textContent || ''
    const transformed = text
      .replace(/\(tm\)/gi, '<span class="ss-tm">™</span>')
      .replace(/\(r\)/gi, '<span class="ss-reg">®</span>')
      .replace(/\(c\)/gi, '©')

    if (transformed !== text) {
      // Create a temporary container to parse the HTML
      const temp = document.createElement('span')
      temp.innerHTML = transformed

      // Replace the text node with the parsed content
      const fragment = document.createDocumentFragment()
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild)
      }
      textNode.parentNode?.replaceChild(fragment, textNode)
    }
  })
}

// Process on mount
onMounted(() => {
  // Use requestIdleCallback for better performance
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      processDOM()
    }, { timeout: 1000 })
  }
  else {
    setTimeout(processDOM, 100)
  }
})

// Re-process on route change
const route = useRoute()
watch(() => route.path, () => {
  setTimeout(processDOM, 100)
})
</script>

<template>
  <div style="display: none;" />
</template>
