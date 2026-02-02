---
title: Training
layout: doc
aside: false
---

<script setup>
import TrainingPage from '../.vitepress/theme/components/TrainingPage.vue'
import { data as trainingData } from '../.vitepress/loaders/training.data'
</script>

<TrainingPage :classes="trainingData.classes" :upcoming-sessions="trainingData.upcomingSessions" />
