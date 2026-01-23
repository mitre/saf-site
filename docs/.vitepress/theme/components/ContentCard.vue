<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PillarBadge, { type PillarType } from './PillarBadge.vue'
import { getStatusVariant } from '@/lib/utils'

export interface ContentItem {
  id: string
  slug: string
  name: string
  description?: string
  content_type: 'validation' | 'hardening'
  target_name?: string
  standard_name?: string
  standard_short_name?: string
  technology_name?: string
  version?: string
  status?: string
}

const props = defineProps<{
  content: ContentItem
}>()

// Map content_type to pillar
const pillar = computed<PillarType>(() => {
  return props.content.content_type === 'validation' ? 'validate' : 'harden'
})

// Generate URL based on content type
const contentUrl = computed(() => {
  return `/content/${props.content.slug}.html`
})
</script>

<template>
  <a :href="contentUrl" class="content-card-link">
    <Card class="content-card hover:border-border">
      <CardHeader class="p-6 pb-3">
        <div class="flex items-start justify-between gap-3">
          <CardTitle class="text-[0.9375rem] leading-snug font-semibold text-foreground">
            {{ content.name }}
          </CardTitle>
          <div class="flex flex-wrap gap-1 shrink-0">
            <PillarBadge :pillar="pillar" size="sm" />
            <Badge
              v-if="content.status"
              :variant="getStatusVariant(content.status)"
              class="uppercase text-[0.625rem] px-2 py-0.5"
            >
              {{ content.status }}
            </Badge>
            <Badge
              v-if="content.standard_short_name || content.standard_name"
              class="text-[0.625rem] px-2 py-0.5"
            >
              {{ content.standard_short_name || content.standard_name }}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent class="flex-1 px-6 pt-0 pb-4">
        <p class="text-[0.8125rem] leading-relaxed text-muted-foreground line-clamp-2 m-0">
          {{ content.description }}
        </p>
      </CardContent>

      <CardFooter class="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground mt-auto">
        <span class="font-medium">{{ content.technology_name }}</span>
        <div class="flex items-center gap-1.5 ml-auto">
          <span v-if="content.version" class="font-mono text-[0.6875rem]">v{{ content.version }}</span>
          <Badge
            v-if="content.target_name"
            variant="outline"
            class="text-[0.625rem] px-2 py-0.5 max-w-36 truncate"
          >
            {{ content.target_name }}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  </a>
</template>

<style scoped>
.content-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.content-card {
  height: 100%;
  min-height: 10rem;
  display: flex;
  flex-direction: column;
}
</style>
