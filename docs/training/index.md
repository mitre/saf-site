---
title: Training
layout: doc
aside: false
wideLayout: true
---

<script setup>
import { Button } from '../.vitepress/theme/components/ui/button'
import BrandIcon from '../.vitepress/theme/components/icons/BrandIcon.vue'
import UpcomingSessionsList from '../.vitepress/theme/components/UpcomingSessionsList.vue'
import TrainingClassList from '../.vitepress/theme/components/TrainingClassList.vue'
import { data as trainingData } from '../.vitepress/loaders/training.data'
</script>

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
  id="upcoming-classes"
  variant="muted"
  orientation="vertical"
  title="Upcoming Classes"
  description="Register for upcoming live training sessions. All times are shown in EST."
>
  <UpcomingSessionsList :sessions="trainingData.upcomingSessions" />
</PageSection>

<PageSection
  id="classes"
  orientation="vertical"
  title="Classes"
  description="Browse our training offerings. Each class includes learning objectives, course materials, and recordings of past sessions."
>
  <TrainingClassList :classes="trainingData.classes" />
</PageSection>
