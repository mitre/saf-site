<script setup lang="ts">
import PillarBadge from './PillarBadge.vue'
</script>

<template>
  <Story title="Display/PillarBadge">
    <Variant title="All Pillars">
      <div class="flex flex-wrap gap-3">
        <PillarBadge pillar="validate" />
        <PillarBadge pillar="harden" />
        <PillarBadge pillar="plan" />
        <PillarBadge pillar="normalize" />
        <PillarBadge pillar="visualize" />
      </div>
    </Variant>

    <Variant title="Without Labels">
      <div class="flex flex-wrap gap-3">
        <PillarBadge pillar="validate" :show-label="false" />
        <PillarBadge pillar="harden" :show-label="false" />
        <PillarBadge pillar="plan" :show-label="false" />
        <PillarBadge pillar="normalize" :show-label="false" />
        <PillarBadge pillar="visualize" :show-label="false" />
      </div>
    </Variant>

    <Variant title="Sizes">
      <div class="flex flex-col gap-6">
        <div>
          <p class="text-sm text-gray-600 mb-2">
            Small
          </p>
          <div class="flex flex-wrap gap-2">
            <PillarBadge pillar="validate" size="sm" />
            <PillarBadge pillar="harden" size="sm" />
            <PillarBadge pillar="plan" size="sm" />
          </div>
        </div>

        <div>
          <p class="text-sm text-gray-600 mb-2">
            Medium (default)
          </p>
          <div class="flex flex-wrap gap-2">
            <PillarBadge pillar="validate" size="md" />
            <PillarBadge pillar="harden" size="md" />
            <PillarBadge pillar="plan" size="md" />
          </div>
        </div>

        <div>
          <p class="text-sm text-gray-600 mb-2">
            Large
          </p>
          <div class="flex flex-wrap gap-2">
            <PillarBadge pillar="validate" size="lg" />
            <PillarBadge pillar="harden" size="lg" />
            <PillarBadge pillar="plan" size="lg" />
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>

<docs lang="md">
# PillarBadge

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pillar` | `PillarType` | `-` |  **(required)** |
| `showLabel` | `boolean` | `-` |  |
| `size` | `union` | `-` |  |
</docs>
