<script setup lang="ts">
withDefaults(defineProps<{
  /** Number of columns at tablet+ breakpoint */
  columns?: 2 | 3
}>(), {
  columns: 2,
})
</script>

<template>
  <div class="card-grid" :class="`card-grid--cols-${columns}`">
    <slot />
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;
}

@media (min-width: 640px) {
  .card-grid--cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-grid--cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
