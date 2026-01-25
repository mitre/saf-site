---
title: Validate - SAF Framework
layout: doc
aside: false
---

<script setup>
import { TestTube2, Repeat2, Zap } from 'lucide-vue-next'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'

const validateTools = [
  { name: 'InSpec', href: '/content/?technology=InSpec' },
  { name: 'SAF CLI', href: '/apps/' }
]
</script>

<PageSection
  orientation="horizontal"
  headline="SAF Framework"
  description="Security testing doesn't have to be a manual, error-prone process. The Validate phase of the MITRE SAF helps you test and verify security controls automatically. Transform security requirements from PDFs and spreadsheets into executable tests that run in seconds, providing consistent, repeatable, and tailorable security compliance validation across your entire infrastructure."
  :links="[
    { label: 'Browse Validation Profiles', href: '/content/', variant: 'default' },
    { label: 'View Framework', href: '/framework/', variant: 'outline' }
  ]"
>
  <template #title>
    <span class="framework-page-title">
      <PillarIcon pillar="validate" :size="36" class="framework-mobile-icon" />
      Validate
    </span>
  </template>

  <div class="framework-desktop-icon">
    <PillarIcon pillar="validate" :size="280" />
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Use Cases"
  title="Automated Security Testing"
  description="The Validate pillar enables continuous security compliance through automated testing. Validate a wide variety of common system components regardless of deployment strategy -- cloud platforms, container images, virtual machines, databases, network equipment, and more. Run InSpec profiles to validate systems against STIGs, CIS Benchmarks, and custom security baselines."
>
  <FeatureList
    :items="[
      {
        icon: TestTube2,
        title: 'Security Compliance Testing',
        description: 'Test systems against government and industry security standards. Run InSpec profiles that implement STIGs, CIS Benchmarks, and other compliance frameworks. Generate detailed reports in the Heimdall Data Format (HDF) showing which controls pass, fail, or are not applicable to your systems.'
      },
      {
        icon: Repeat2,
        title: 'Continuous Validation',
        description: 'Integrate security testing into your CI/CD pipeline. Validate container images before deployment, test infrastructure changes before they reach production, and monitor running systems for configuration drift. Catch security issues early when they\'re easiest to fix.'
      },
      {
        icon: Zap,
        title: 'Fast and Repeatable',
        description: 'Automated tests run in seconds, not hours. Unlike manual security assessments that take weeks, automated validation provides instant feedback. Run the same tests consistently across thousands of systems, eliminating human error and reducing assessment costs, or integrate them seamlessly into CI/CD pipelines.'
      }
    ]"
    gap="lg"
  />
</PageSection>

<PageSection
  orientation="horizontal"
  headline="Tools"
  title="Validate with SAF"
  description="Use InSpec profiles from our content library and accelerate profile development with SAF CLI."
>
  <template #body>
    <FeatureList
      :items="[
        {
          title: 'InSpec Profiles',
          description: 'Browse our library of validated InSpec profiles for common platforms and applications. Each profile implements security requirements from STIGs, CIS Benchmarks, and other frameworks as executable tests. Download and run profiles directly or customize them for your environment.',
          href: '/content/'
        },
        {
          title: 'SAF CLI',
          description: 'Rapidly generate the scaffolding for an InSpec testing profile using a benchmark document (STIGs, CIS Benchmarks) and the SAF CLI. Use SAF CLI to accelerate updates to test profiles when new benchmarks are released.',
          href: '/apps/'
        }
      ]"
      gap="lg"
    />
  </template>

  <LogoGrid :items="validateTools" :size="56" :showNames="true" variant="card" :columns="2" />
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
