---
layout: doc
title: Icon Test
---

<script setup>
import PillarIcon from './.vitepress/theme/components/icons/PillarIcon.vue'
import { HeimdallIcon, SafLogoIcon } from './.vitepress/theme/components/icons/tools'
</script>

# SAF Pillar Icons Test

Toggle dark mode (top right) to see the color adaptation.

## Pillar Icons (Default Size)

<div style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; margin: 2rem 0;">
  <div style="text-align: center;">
    <PillarIcon pillar="validate" />
    <p>Validate</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="harden" />
    <p>Harden</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="plan" :size="100" />
    <p>Plan</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="normalize" />
    <p>Normalize</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="visualize" />
    <p>Visualize</p>
  </div>
</div>

## Pillar Icons (Smaller - 48px)

<div style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; margin: 2rem 0;">
  <div style="text-align: center;">
    <PillarIcon pillar="validate" :size="48" />
    <p>Validate</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="harden" :size="48" />
    <p>Harden</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="plan" :size="48" />
    <p>Plan</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="normalize" :size="48" />
    <p>Normalize</p>
  </div>
  <div style="text-align: center;">
    <PillarIcon pillar="visualize" :size="48" />
    <p>Visualize</p>
  </div>
</div>

## Tool Icons

<div style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; margin: 2rem 0;">
  <div style="text-align: center;">
    <HeimdallIcon :size="80" />
    <p>Heimdall</p>
  </div>
  <div style="text-align: center;">
    <SafLogoIcon :size="80" />
    <p>SAF Logo</p>
  </div>
</div>
