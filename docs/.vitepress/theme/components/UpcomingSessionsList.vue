<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TrainingClass {
  id: string
  title: string
  slug: string
  description: string
  objectives: string[]
  course_url?: string
  youtube_url?: string
  order: number
}

interface UpcomingSession {
  id: string
  class: string
  date: string
  signup_url?: string
  status: 'scheduled' | 'cancelled'
  expand?: {
    class?: TrainingClass
  }
}

interface Props {
  sessions: UpcomingSession[]
}

defineProps<Props>()

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}
</script>

<template>
  <div v-if="sessions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card v-for="session in sessions" :key="session.id" class="upcoming-session-card">
      <CardHeader>
        <CardTitle>{{ session.expand?.class?.title }}</CardTitle>
        <CardDescription class="flex items-center gap-2 text-base">
          <Calendar :size="16" />
          {{ formatDate(session.date) }}
        </CardDescription>
      </CardHeader>
      <CardContent v-if="session.signup_url">
        <Button as="a" :href="session.signup_url" target="_blank" rel="noopener noreferrer" class="w-full">
          Sign Up
        </Button>
      </CardContent>
    </Card>
  </div>
  <p v-else class="text-center text-muted-foreground">
    No upcoming sessions scheduled at this time. Check back soon or view our class recordings below.
  </p>
</template>

<style scoped>
.upcoming-session-card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.upcoming-session-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
