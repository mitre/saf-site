<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Profile {
  id: string
  slug: string
  name: string
  description?: string
  target_name?: string
  standard_name?: string
  standard_short_name?: string
  technology_name?: string
  version?: string
  status?: string
}

defineProps<{
  profile: Profile
}>()

// Map status to badge variant
const statusVariant = (status?: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'beta': return 'warning'
    case 'deprecated': return 'destructive'
    case 'draft': return 'secondary'
    default: return 'default'
  }
}
</script>

<template>
  <a :href="`/validate/${profile.slug}.html`" class="profile-card-link">
    <Card class="h-full min-h-[160px] flex flex-col hover:border-primary transition-colors">
      <CardHeader class="p-4 pb-2">
        <div class="flex items-start justify-between gap-3">
          <CardTitle class="!text-base !leading-tight !text-[var(--vp-c-text-1)]">{{ profile.name }}</CardTitle>
          <div class="flex flex-wrap gap-1 shrink-0">
            <Badge v-if="profile.status" :variant="statusVariant(profile.status)" class="uppercase text-[10px]">
              {{ profile.status }}
            </Badge>
            <Badge v-if="profile.standard_short_name || profile.standard_name" class="text-[10px]">
              {{ profile.standard_short_name || profile.standard_name }}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent class="flex-1 p-4 pt-0">
        <p class="text-sm text-[var(--vp-c-text-2)] line-clamp-2 m-0">
          {{ profile.description }}
        </p>
      </CardContent>

      <CardFooter class="p-4 pt-3 border-t border-[var(--vp-c-divider)] text-xs text-[var(--vp-c-text-3)]">
        <span class="font-medium">{{ profile.technology_name }}</span>
        <div class="flex items-center gap-1.5 ml-auto">
          <span v-if="profile.version" class="font-mono text-[11px]">v{{ profile.version }}</span>
          <Badge v-if="profile.target_name" variant="outline" class="text-[10px] max-w-[140px] truncate">
            {{ profile.target_name }}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  </a>
</template>

<style scoped>
.profile-card-link {
  display: block;
  text-decoration: none !important;
  color: inherit !important;
}
.profile-card-link:hover {
  text-decoration: none !important;
}
</style>
