<template>
  <!-- Legacy wrapper - delegates to ContentDetail -->
  <ContentDetail :content="mappedContent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ContentDetail from './ContentDetail.vue'
import type { ContentItem } from '../composables/useContentDetail'

/**
 * Legacy Profile interface (before composables refactor)
 * Maps to ContentItem for backwards compatibility
 */
interface Profile {
  id: string
  slug: string
  name: string
  description: string
  long_description?: string
  version: string
  status: string
  target_name: string
  target_slug: string
  standard_name: string
  standard_short_name: string
  standard_slug: string
  technology_name: string
  technology_slug: string
  technology_logo?: string
  vendor_name: string
  vendor_slug: string
  maintainer_name: string
  maintainer_slug: string
  github_url: string
  documentation_url?: string
  control_count?: number
  stig_id?: string
  benchmark_version?: string
  license?: string
  release_date?: string
}

const props = defineProps<{
  profile: Profile
}>()

/**
 * Map legacy Profile to ContentItem
 * Adds content_type: 'validation' since ProfileDetail was always for validation
 */
const mappedContent = computed<ContentItem>(() => ({
  ...props.profile,
  content_type: 'validation'
}))
</script>
