---
layout: doc
aside: false
---

<script setup>
import { useData } from 'vitepress'
import ProfileDetail from '../.vitepress/theme/components/ProfileDetail.vue'

const { params } = useData()
const profile = params.value.profile
</script>

<ProfileDetail :profile="profile" />
