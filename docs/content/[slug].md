---
layout: doc
aside: false
---

<script setup>
import { useData } from 'vitepress'
import ContentDetail from '../.vitepress/theme/components/ContentDetail.vue'

const { params } = useData()
const content = params.value.content
const relatedContent = params.value.relatedContent || []
</script>

<ContentDetail :content="content" :related-content="relatedContent" />
