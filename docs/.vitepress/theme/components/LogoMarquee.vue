<script setup lang="ts">
/**
 * LogoMarquee - Animated scrolling logo display
 *
 * Creates an infinite horizontal scroll of logos.
 * Good for partner/sponsor sections that need visual interest.
 */
import BrandIcon from './icons/BrandIcon.vue'

export interface LogoItem {
  name: string
  href?: string
  image?: string
}

export interface LogoMarqueeProps {
  items: LogoItem[]
  /** Animation duration in seconds */
  duration?: number
  /** Pause animation on hover */
  pauseOnHover?: boolean
  /** Reverse scroll direction */
  reverse?: boolean
  /** Logo size in pixels */
  size?: number
  /** Number of times to repeat items (for seamless loop) */
  repeat?: number
  /** Show gradient overlay at edges */
  overlay?: boolean
}

const props = withDefaults(defineProps<LogoMarqueeProps>(), {
  duration: 30,
  pauseOnHover: true,
  reverse: false,
  size: 40,
  repeat: 2,
  overlay: true
})
</script>

<template>
  <div
    class="logo-marquee"
    :class="{
      'logo-marquee--pause-hover': pauseOnHover,
      'logo-marquee--reverse': reverse,
      'logo-marquee--overlay': overlay
    }"
    :style="{ '--marquee-duration': `${duration}s` }"
  >
    <div class="logo-marquee-track">
      <!-- Repeat content for seamless loop -->
      <div
        v-for="i in repeat"
        :key="i"
        class="logo-marquee-content"
      >
        <component
          :is="item.href ? 'a' : 'span'"
          v-for="item in items"
          :key="`${i}-${item.name}`"
          :href="item.href"
          :target="item.href?.startsWith('http') ? '_blank' : undefined"
          :rel="item.href?.startsWith('http') ? 'noopener noreferrer' : undefined"
          class="logo-marquee-item"
          :title="item.name"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            :width="size"
            :height="size"
            class="logo-image"
          />
          <BrandIcon
            v-else
            :name="item.name"
            :size="size"
          />
        </component>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo-marquee {
  position: relative;
  overflow: hidden;
  padding: 1rem 0;
}

.logo-marquee-track {
  display: flex;
  width: max-content;
  animation: marquee var(--marquee-duration, 30s) linear infinite;
}

.logo-marquee--reverse .logo-marquee-track {
  animation-direction: reverse;
}

.logo-marquee--pause-hover:hover .logo-marquee-track {
  animation-play-state: paused;
}

.logo-marquee-content {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 0 1.5rem;
}

.logo-marquee-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.logo-marquee-item:hover {
  opacity: 1;
}

.logo-image {
  object-fit: contain;
}

/* Gradient overlay at edges */
.logo-marquee--overlay::before,
.logo-marquee--overlay::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  z-index: 1;
  pointer-events: none;
}

.logo-marquee--overlay::before {
  left: 0;
  background: linear-gradient(to right, var(--vp-c-bg), transparent);
}

.logo-marquee--overlay::after {
  right: 0;
  background: linear-gradient(to left, var(--vp-c-bg), transparent);
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .logo-marquee-track {
    animation: none;
  }
}
</style>
