<script setup lang="ts">
defineProps<{
  size?: number | string
  class?: string
}>()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    :width="size || 24"
    :height="size || 24"
    :class="$props.class"
  >
    <!-- Background rounded square - uses currentColor for theming -->
    <rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor" />
    <!-- Checkmark - always white for contrast -->
    <path
      d="M7 12.5l3 3 7-7"
      stroke="white"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
