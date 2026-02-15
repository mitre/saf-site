<script setup lang="ts">
import { computed } from 'vue'
import HardenIcon from './icons/pillars/HardenIcon.vue'
import NormalizeIcon from './icons/pillars/NormalizeIcon.vue'
import PlanIcon from './icons/pillars/PlanIcon.vue'
import ValidateIcon from './icons/pillars/ValidateIcon.vue'
import VisualizeIcon from './icons/pillars/VisualizeIcon.vue'

export type PillarType = 'validate' | 'harden' | 'plan' | 'normalize' | 'visualize'

const props = defineProps<{
  pillar: PillarType
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()

const pillarConfig = {
  validate: {
    label: 'Validate',
    icon: ValidateIcon,
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
  },
  harden: {
    label: 'Harden',
    icon: HardenIcon,
    bgClass: 'bg-green-500/15',
    textClass: 'text-green-600 dark:text-green-400',
    borderClass: 'border-green-500/30',
  },
  plan: {
    label: 'Plan',
    icon: PlanIcon,
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/30',
  },
  normalize: {
    label: 'Normalize',
    icon: NormalizeIcon,
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-500/30',
  },
  visualize: {
    label: 'Visualize',
    icon: VisualizeIcon,
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500/30',
  },
} as const

const config = computed(() => pillarConfig[props.pillar])

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        badge: 'px-1.5 py-0.5 text-[0.625rem] gap-1',
        icon: 'w-3 h-3',
      }
    case 'lg':
      return {
        badge: 'px-3 py-1.5 text-sm gap-2',
        icon: 'w-5 h-5',
      }
    default: // md
      return {
        badge: 'px-2 py-1 text-xs gap-1.5',
        icon: 'w-4 h-4',
      }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center font-medium rounded-md border" :class="[
      config.bgClass,
      config.textClass,
      config.borderClass,
      sizeClasses.badge,
    ]"
    :title="config.label"
  >
    <component :is="config.icon" :class="sizeClasses.icon" />
    <span v-if="showLabel !== false">{{ config.label }}</span>
  </span>
</template>
