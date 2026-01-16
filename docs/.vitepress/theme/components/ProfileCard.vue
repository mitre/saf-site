<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
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
    <Card class="profile-card hover:border-border">
      <CardHeader class="p-6 pb-3">
        <div class="flex items-start justify-between gap-3">
          <CardTitle class="text-[0.9375rem] leading-snug font-semibold text-foreground">
            {{ profile.name }}
          </CardTitle>
          <div class="flex flex-wrap gap-1 shrink-0">
            <Badge
              v-if="profile.status"
              :variant="statusVariant(profile.status)"
              class="uppercase text-[0.625rem] px-2 py-0.5"
            >
              {{ profile.status }}
            </Badge>
            <Badge
              v-if="profile.standard_short_name || profile.standard_name"
              class="text-[0.625rem] px-2 py-0.5"
            >
              {{ profile.standard_short_name || profile.standard_name }}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent class="flex-1 px-6 pt-0 pb-4">
        <p class="text-[0.8125rem] leading-relaxed text-muted-foreground line-clamp-2 m-0">
          {{ profile.description }}
        </p>
      </CardContent>

      <CardFooter class="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground mt-auto">
        <span class="font-medium">{{ profile.technology_name }}</span>
        <div class="flex items-center gap-1.5 ml-auto">
          <span v-if="profile.version" class="font-mono text-[0.6875rem]">v{{ profile.version }}</span>
          <Badge
            v-if="profile.target_name"
            variant="outline"
            class="text-[0.625rem] px-2 py-0.5 max-w-36 truncate"
          >
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
  text-decoration: none;
  color: inherit;
}

.profile-card {
  height: 100%;
  min-height: 10rem;
  display: flex;
  flex-direction: column;
}
</style>
