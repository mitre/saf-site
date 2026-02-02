---
title: MITRE SAF Framework
layout: doc
aside: false
---

<script setup>
import { h } from 'vue'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'
import { SafLogoIcon } from '../.vitepress/theme/components/icons/tools'

const pillars = [
  {
    icon: h(PillarIcon, { pillar: 'plan', size: 64 }),
    title: 'Plan',
    description: 'Identify security requirements and locate applicable guidance for your technology stack',
    href: '/framework/plan'
  },
  {
    icon: h(PillarIcon, { pillar: 'harden', size: 64 }),
    title: 'Harden',
    description: 'Apply security configurations and controls using automated hardening content',
    href: '/framework/harden'
  },
  {
    icon: h(PillarIcon, { pillar: 'validate', size: 64 }),
    title: 'Validate',
    description: 'Test security controls with automated validation using InSpec profiles',
    href: '/framework/validate'
  },
  {
    icon: h(PillarIcon, { pillar: 'normalize', size: 64 }),
    title: 'Normalize',
    description: 'Convert security scan results into a common format for analysis',
    href: '/framework/normalize'
  },
  {
    icon: h(PillarIcon, { pillar: 'visualize', size: 64 }),
    title: 'Visualize',
    description: 'View and analyze security posture through dashboards and reports',
    href: '/framework/visualize'
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="The Framework"
  title="Building a Security Automation Capability"
  description="The MITRE Security Automation Framework provides a complete lifecycle approach to security automation, from initial project planning all the way through operational monitoring. Approaching security automation through a refined and field-tested framework will help you achieve your security goals more efficiently."
  :links="[
    { label: 'Browse Security Content', href: '/content/', variant: 'default' },
    { label: 'View SAF Tools', href: '/apps/', variant: 'outline' }
  ]"
/>

<PageSection
  variant="muted"
  headline="The Five Pillars"
  title="A Complete Security Automation Lifecycle"
  description="Each pillar addresses a specific phase in the security automation journey. Jump in at any point or follow the complete workflow."
>
  <div class="pillar-grid">
    <a v-for="(pillar, index) in pillars" :key="pillar.title" :href="pillar.href" :class="['pillar-card', `pillar-${index + 1}`]">
      <div class="flex flex-col items-center text-center gap-4">
        <component :is="pillar.icon" />
        <div>
          <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-2">{{ pillar.title }}</h3>
          <p class="text-sm text-[--vp-c-text-2]">{{ pillar.description }}</p>
        </div>
      </div>
    </a>
  </div>
</PageSection>

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}

/* Pillar grid: 3 cards on top, 2 centered on bottom, all same width */
.pillar-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.5rem;
}

/* Mobile: stack vertically */
@media (max-width: 767px) {
  .pillar-grid {
    grid-template-columns: 1fr;
  }
  .pillar-card {
    grid-column: 1 !important;
  }
}

/* Tablet and up: 3-2 layout */
@media (min-width: 768px) {
  /* Top row: 3 cards, each spans 2 columns */
  .pillar-1,
  .pillar-2,
  .pillar-3 {
    grid-column: span 2;
  }

  /* Bottom row: 2 cards centered, each spans 2 columns */
  .pillar-4 {
    grid-column: 2 / 4;
  }

  .pillar-5 {
    grid-column: 5 / 7;
  }
}

.pillar-card {
  display: block;
  padding: 1.5rem;
  background-color: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit !important;
  transition: border-color 0.1s ease, box-shadow 0.1s ease;
}

.pillar-card:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  border-color: var(--vp-c-brand-1);
  text-decoration: none !important;
}

/* Lighten pillar cards in dark mode for better contrast */
.dark .pillar-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
