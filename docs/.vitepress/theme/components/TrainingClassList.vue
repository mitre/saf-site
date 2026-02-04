<script setup lang="ts">
import { Button } from '@/components/ui/button'

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

interface Props {
  classes: TrainingClass[]
}

defineProps<Props>()

// Extract YouTube video ID from URL
function getYouTubeId(url?: string) {
  if (!url)
    return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  return match ? match[1] : null
}
</script>

<template>
  <div class="space-y-12">
    <div v-for="(trainingClass, index) in classes" :id="`class-${trainingClass.slug}`" :key="trainingClass.id" class="class-section">
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
</template>

<style scoped>
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
