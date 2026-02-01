---
title: Plan
layout: doc
aside: false
---

<script setup>
import { FileSearch, PenTool } from 'lucide-vue-next'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'

const planTools = [
  { name: 'Vulcan', href: '/apps/' },
  { name: 'SAF CLI', href: '/apps/' }
]
</script>

<PageSection
  orientation="horizontal"
  headline="SAF Framework"
  description="It's hard to hit a target that you can't see. Similarly, it's hard to implement quality security automation without understanding your requirements. The Plan phase of the MITRE SAF(tm) helps you identify which security guidance applies to your software components."
  :links="[
    { label: 'Browse Security Content', href: '/content/', variant: 'default' },
    { label: 'View Framework', href: '/framework/', variant: 'outline' }
  ]"
>
  <template #title>
    <span class="framework-page-title">
      <PillarIcon pillar="plan" :size="36" class="framework-mobile-icon" />
      Plan
    </span>
  </template>

  <div class="framework-desktop-icon">
    <PillarIcon pillar="plan" :size="280" />
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Use Cases"
  title="Two Ways to Plan Your Security"
  description="The Plan pillar supports both teams implementing existing software and developers creating new components. Start by identifying your software components, then either search for applicable security guidance from government and industry sources or create your own comprehensive validation profiles. Whether you're implementing a component into an existing system or developing new software from scratch, Plan connects you with the right baselines and helps you create documentation where standards don't yet exist."
>
  <FeatureList
    :items="[
      {
        icon: FileSearch,
        title: 'Find Existing Guidance',
        description: 'Discover which STIGs, CIS Benchmarks, and security baselines apply to your technology stack. Browse our content library to find validated InSpec profiles and hardening guides for common software components.'
      },
      {
        icon: PenTool,
        title: 'Create New Documentation',
        description: 'Build security guidance for software components that lack government or industry standards. Author InSpec profiles to define security requirements and provide clear configuration guidance for your customers. Use Vulcan to create comprehensive security validation profiles that document security controls and testing procedures.'
      }
    ]"
    gap="lg"
  />
</PageSection>

<PageSection
  orientation="horizontal"
  headline="Tools"
  title="Plan with SAF Tools"
  description="Use Vulcan to author security guidance or browse our content library for existing baselines."
>
  <template #body>
    <FeatureList
      :items="[
        {
          title: 'Vulcan',
          description: 'Author and edit security guidance documents that serve as a basis for later automation content. Create comprehensive documentation of security requirements, controls, and validation procedures.',
          href: '/apps/'
        },
        {
          title: 'SAF CLI',
          description: 'Build the foundation of an InSpec profile from your security guidance documents using SAF CLI.',
          href: '/apps/'
        }
      ]"
      gap="lg"
    />
  </template>

  <LogoGrid :items="planTools" :size="56" :showNames="true" variant="card" :columns="2" />
</PageSection>

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}

/* Framework page icon responsive behavior */
.framework-page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Mobile: show small icon next to title */
.framework-mobile-icon {
  display: inline-block;
}

/* Mobile: hide large icon */
.framework-desktop-icon {
  display: none;
}

/* Desktop (1024px+): hide small icon, show large icon */
@media (min-width: 1024px) {
  .framework-mobile-icon {
    display: none;
  }

  .framework-desktop-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }
}
</style>
