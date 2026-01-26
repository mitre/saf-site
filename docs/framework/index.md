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
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <a v-for="pillar in pillars" :key="pillar.title" :href="pillar.href" class="pillar-card block p-6 bg-card rounded-lg hover:shadow-lg transition-all border border-border hover:border-[--vp-c-brand-1]">
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

.pillar-card {
  text-decoration: none !important;
  color: inherit !important;
}

.pillar-card:hover {
  text-decoration: none !important;
}

/* Lighten pillar cards in dark mode for better contrast */
.dark .pillar-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
