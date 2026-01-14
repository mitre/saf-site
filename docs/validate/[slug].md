---
layout: doc
aside: false
---

<script setup>
import { useData } from 'vitepress'
import ContentDetail from '../.vitepress/theme/components/ContentDetail.vue'

const { params } = useData()
const content = params.value.content
</script>

<ContentDetail :content="content" />
