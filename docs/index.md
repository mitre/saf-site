---
layout: home

hero:
  name: MITRE SAF
  text: Security Automation Framework
  tagline: Open source security testing and compliance automation toolkit
  actions:
    - theme: brand
      text: Get Started
      link: /docs/
    - theme: alt
      text: View on GitHub
      link: https://github.com/mitre/saf

features:
  - icon: 🎯
    title: Plan
    details: Identify and prioritize security requirements for your systems
  - icon: 🔒
    title: Harden
    details: Apply security baselines and hardening guidance automatically
  - icon: ✅
    title: Validate
    details: Test and verify security compliance with InSpec profiles
  - icon: 📊
    title: Normalize
    details: Convert security results into standardized formats
  - icon: 📈
    title: Visualize
    details: View and analyze security posture with Heimdall
  - icon: 🤝
    title: Collaborate
    details: Share security content and collaborate with teams
---

<script setup>
import PillarIcon from './.vitepress/theme/components/icons/PillarIcon.vue'
import { SafLogoIcon } from './.vitepress/theme/components/icons/tools'
</script>

<PageSection
  orientation="horizontal"
  headline="Why SAF?"
  title="Streamline Security for Modern DevOps"
  description="The MITRE Security Automation Framework brings together applications, techniques, libraries, and tools developed by MITRE and the security community to streamline security automation for systems and DevOps pipelines."
>
  <template #body>
    <FeatureList
      :items="[
        {
          title: 'Built for Speed',
          description: 'Integrate security into CI/CD pipelines without slowing down delivery'
        },
        {
          title: 'Open Source',
          description: 'Community-driven tools and content validated by security experts'
        },
        {
          title: 'Standards-Based',
          description: 'Leverage STIGs, CIS Benchmarks, and industry frameworks'
        }
      ]"
      gap="md"
    />
  </template>

  <div class="flex items-center justify-center" style="min-height: 300px;">
    <SafLogoIcon :size="240" />
  </div>
</PageSection>

---

<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="Get Started"
  title="Ready to Automate Your Security?"
  description="Explore the framework pillars to find the tools and content you need."
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <a href="/framework/plan" class="block p-6 border border-[--vp-c-divider] rounded-lg hover:border-[--vp-c-brand-1] hover:shadow-md transition-all">
      <div class="flex items-start gap-4">
        <div class="shrink-0">
          <PillarIcon pillar="plan" :size="48" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-2">Start with Planning</h3>
          <p class="text-sm text-[--vp-c-text-2]">Identify security requirements for your systems</p>
        </div>
      </div>
    </a>
    <a href="/content/" class="block p-6 border border-[--vp-c-divider] rounded-lg hover:border-[--vp-c-brand-1] hover:shadow-md transition-all">
      <div class="flex items-start gap-4">
        <div class="shrink-0">
          <PillarIcon pillar="validate" :size="48" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-2">Browse Security Content</h3>
          <p class="text-sm text-[--vp-c-text-2]">Find InSpec profiles and hardening guides</p>
        </div>
      </div>
    </a>
  </div>
</PageSection>

---

## What is MITRE SAF?

The Security Automation Framework (SAF) is a comprehensive suite of open source tools and techniques for security automation, compliance validation, and continuous monitoring.

## Quick Start

```bash
# Install SAF CLI
npm install -g @mitre/saf

# Validate your system
saf validate threshold -i results.json
```

## Community

Join our community to learn more and contribute:

- [GitHub Discussions](https://github.com/mitre/saf/discussions)
- [Issue Tracker](https://github.com/mitre/saf/issues)
- Email: saf@mitre.org

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}
</style>
