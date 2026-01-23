<script setup lang="ts">
import { computed } from 'vue'
import ValidateIcon from './pillars/ValidateIcon.vue'
import HardenIcon from './pillars/HardenIcon.vue'
import PlanIcon from './pillars/PlanIcon.vue'
import NormalizeIcon from './pillars/NormalizeIcon.vue'
import VisualizeIcon from './pillars/VisualizeIcon.vue'

export type PillarType = 'validate' | 'harden' | 'plan' | 'normalize' | 'visualize'

const props = defineProps<{
  pillar: PillarType
  size?: number | string
}>()

const iconComponent = computed(() => {
  const icons = {
    validate: ValidateIcon,
    harden: HardenIcon,
    plan: PlanIcon,
    normalize: NormalizeIcon,
    visualize: VisualizeIcon
  }
  return icons[props.pillar]
})
</script>

<template>
  <component :is="iconComponent" :size="size" />
</template>
