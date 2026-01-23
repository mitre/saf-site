<script setup lang="ts">
defineProps<{
  size?: number | string
}>()
</script>

<template>
  <svg
    :width="size || 99"
    :height="size ? Number(size) * (97/99) : 97"
    viewBox="0 0 99 97"
    xmlns="http://www.w3.org/2000/svg"
    class="pillar-icon pillar-icon-normalize"
  >
    <title>Normalize Icon</title>
    <g fill="none" fill-rule="evenodd">
      <!-- Gray secondary elements (document shapes) -->
      <path d="M7.07142857,60.3571429 C5.79385714,60.3571429 4.71428571,59.2939286 4.71428571,58.0357143 L4.71428571,6.96428571 C4.71428571,5.70607143 5.79385714,4.64285714 7.07142857,4.64285714 C10.4472194,4.64285714 12.9790626,4.64285714 14.666958,4.64285714 C24.5028721,4.64285714 39.2567432,4.64285714 58.9285714,4.64285714 C60.2061429,4.64285714 61.2857143,5.70607143 61.2857143,6.96428571 L61.2857143,27.8571429 L66,27.8571429 L66,6.96428571 C66,3.13392857 62.8178571,0 58.9285714,0 L7.07142857,0 C3.18214286,0 0,3.13392857 0,6.96428571 L0,58.0357143 C0,61.8660714 3.18214286,65 7.07142857,65 L28.2857143,65 L28.2857143,60.3571429 L7.07142857,60.3571429 Z" class="pillar-icon-secondary" fill-rule="nonzero"/>
      <path d="M89.9285714,30 L68.7142857,30 L68.7142857,34.6428571 L89.9285714,34.6428571 C91.2061429,34.6428571 92.2857143,35.7060714 92.2857143,36.9642857 L92.2857143,88.0357143 C92.2857143,89.2939286 91.2061429,90.3571429 89.9285714,90.3571429 L38.0714286,90.3571429 C36.7938571,90.3571429 35.7142857,89.2939286 35.7142857,88.0357143 L35.7142857,67.1428571 L31,67.1428571 L31,88.0357143 C31,91.8660714 34.1821429,95 38.0714286,95 L89.9285714,95 C93.8178571,95 97,91.8660714 97,88.0357143 L97,36.9642857 C97,33.1339286 93.8178571,30 89.9285714,30 Z" class="pillar-icon-secondary" fill-rule="nonzero"/>
      <path d="M46.5,28 L46.5,5" class="pillar-icon-secondary-stroke" stroke-width="4"/>
      <path d="M33.5,32.3053435 L33.5,5" class="pillar-icon-secondary-stroke" stroke-width="4"/>
      <path d="M19.5,60 L19.5,5" class="pillar-icon-secondary-stroke" stroke-width="4"/>
      <path d="M6.64668347,5 L61.3973352,5" class="pillar-icon-secondary-stroke"/>
      <path d="M5.64668347,12 L60.3973352,12" class="pillar-icon-secondary-stroke" stroke-width="3"/>
      <g transform="translate(70.5, 62) scale(-1, -1) translate(-70.5, -62) translate(49, 34)">
        <path d="M42.1127292,24.7694746 L42.1127292,0" class="pillar-icon-secondary-stroke" stroke-width="4"/>
        <path d="M26.9384401,27.7010731 L26.9384401,0" class="pillar-icon-secondary-stroke" stroke-width="4"/>
        <path d="M0.646465584,47.6135266 L25.3538291,47.6135266" class="pillar-icon-secondary-stroke" stroke-width="3"/>
        <path d="M13.3867925,55.4021463 L13.3867925,0" class="pillar-icon-secondary-stroke" stroke-width="4"/>
      </g>
      <path d="M5.5,60 L5.5,5" class="pillar-icon-secondary-stroke"/>

      <!-- Blue primary elements (accent rectangles and corners) -->
      <rect class="pillar-icon-primary" stroke-width="3" x="30" y="46" width="5" height="9"/>
      <rect class="pillar-icon-primary" stroke-width="3" x="46" y="30" width="10" height="5"/>
      <rect class="pillar-icon-primary" stroke-width="3" x="61" y="40" width="5" height="9"/>
      <rect class="pillar-icon-primary" stroke-width="3" x="40" y="60" width="10" height="5"/>
      <path d="M56,65 L58.5,65 C62.625,65 66,61.9625 66,58.25 L66,56 L61,56 L61,58.25 C61,59.4695 59.855,60.5 58.5,60.5 L56,60.5 L56,65 Z" class="pillar-icon-primary" stroke-width="3" fill-rule="nonzero"/>
      <path d="M35,36.75 C35,35.5305 36.145,34.5 37.5,34.5 L40,34.5 L40,30 L37.5,30 C33.375,30 30,33.0375 30,36.75 L30,39 L35,39 L35,36.75 Z" class="pillar-icon-primary" stroke-width="3" fill-rule="nonzero"/>
    </g>
  </svg>
</template>

<style scoped>
.pillar-icon-primary {
  fill: var(--pillar-primary, #005B94);
  stroke: var(--pillar-primary, #005B94);
}
.pillar-icon-secondary {
  fill: var(--pillar-secondary, #CBD2DF);
  stroke: var(--pillar-secondary, #CBD2DF);
}
.pillar-icon-secondary-stroke {
  stroke: var(--pillar-secondary, #CBD2DF);
  fill: none;
}
</style>
