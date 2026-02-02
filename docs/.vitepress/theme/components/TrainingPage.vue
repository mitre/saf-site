<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import BrandIcon from './icons/BrandIcon.vue'

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
  classes: TrainingClass[]
  upcomingSessions: UpcomingSession[]
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

// Extract YouTube video ID from URL
function getYouTubeId(url?: string) {
  if (!url)
    return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  return match ? match[1] : null
}
</script>

<template>
  <div>
    <PageSection
      orientation="vertical"
      headline="MITRE SAF Training"
      title="Our Training"
      description="The MITRE SAF™ team offers training classes. Dates and sign-up links to participate in synchronous (typically virtual) class offerings are posted on this page when training dates are finalized. To preview classes, watch asynchronously, or reference class content, see the class details, materials, and recordings below."
    >
      <div class="flex gap-4 flex-wrap">
        <Button as="a" href="https://mitre.github.io/saf-training/" target="_blank" rel="noopener noreferrer" variant="default">
          <BrandIcon name="github" :size="16" class="mr-2" />
          Training Site - GitHub
        </Button>
        <Button as="a" href="https://mitre-saf-training.netlify.app/" target="_blank" rel="noopener noreferrer" variant="outline">
          <BrandIcon name="netlify" :size="16" class="mr-2" />
          Training Site - Netlify
        </Button>
      </div>
    </PageSection>

    <PageSection
      variant="muted"
      orientation="vertical"
      title="Upcoming Classes"
      description="Register for upcoming live training sessions. All times are shown in EST."
    >
      <div v-if="upcomingSessions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card v-for="session in upcomingSessions" :key="session.id" class="upcoming-session-card">
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
    </PageSection>

    <PageSection
      orientation="vertical"
      title="Classes"
      description="Browse our training offerings. Each class includes learning objectives, course materials, and recordings of past sessions."
    >
      <div class="space-y-12">
        <div v-for="(trainingClass, index) in classes" :key="trainingClass.id" class="class-section">
          <div v-if="index > 0" class="class-divider" />

          <div class="class-content">
            <h2 class="class-title">
              {{ trainingClass.title }}
            </h2>

            <div class="class-description" v-html="trainingClass.description" />

            <div v-if="trainingClass.course_url" class="course-button-container">
              <Button as="a" :href="trainingClass.course_url" target="_blank" rel="noopener noreferrer" variant="outline">
                View Course Materials
              </Button>
            </div>

            <div v-if="trainingClass.objectives && trainingClass.objectives.length > 0" class="objectives-section">
              <h3 class="objectives-title">
                Learning Objectives:
              </h3>
              <ul class="objectives-list">
                <li v-for="(objective, idx) in trainingClass.objectives" :key="idx">
                  {{ objective }}
                </li>
              </ul>
            </div>

            <div v-if="getYouTubeId(trainingClass.youtube_url)" class="video-section">
              <div class="video-container">
                <iframe
                  :src="`https://www.youtube-nocookie.com/embed/${getYouTubeId(trainingClass.youtube_url)}`"
                  title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="video-iframe"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  </div>
</template>

<style scoped>
.upcoming-session-card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.upcoming-session-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.class-section {
  scroll-margin-top: 80px;
}

.class-divider {
  height: 1px;
  background: var(--vp-c-divider);
  margin: 3rem 0;
}

.class-content {
  /* Full width to match section container */
}

.class-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1.5rem;
  border: none !important;
  padding: 0 !important;
}

.class-description {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.class-description :deep(p) {
  margin: 0 0 1rem;
}

.class-description :deep(p:last-child) {
  margin-bottom: 0;
}

.course-button-container {
  margin-bottom: 2rem;
}

.objectives-section {
  margin-bottom: 2rem;
}

.objectives-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
}

.objectives-list {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0;
}

.objectives-list li {
  font-size: 0.9375rem;
  line-height: 1.8;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.video-section {
  margin-top: 2rem;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}
</style>
