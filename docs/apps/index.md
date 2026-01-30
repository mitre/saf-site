---
title: SAF Apps
layout: doc
aside: false
---

<script setup>
import { Shield, Eye, Terminal, FileCode, PenTool } from 'lucide-vue-next'

const apps = [
  {
    icon: Eye,
    name: 'Heimdall',
    description: 'Security data visualization and analysis platform. View compliance dashboards, compare results, and generate reports.',
    href: '/apps/heimdall',
    repo: 'https://github.com/mitre/heimdall2',
    demo: 'https://heimdall-demo.mitre.org'
  },
  {
    icon: Terminal,
    name: 'SAF CLI',
    description: 'Command-line tool for security automation. Convert security tool outputs to HDF, generate InSpec profiles, and more.',
    href: '/apps/saf-cli',
    repo: 'https://github.com/mitre/saf',
    docs: 'https://saf-cli.mitre.org'
  },
  {
    icon: PenTool,
    name: 'Vulcan',
    description: 'Security guidance authoring tool. Create and edit security requirements documents that serve as the foundation for automation.',
    href: '/apps/vulcan',
    repo: 'https://github.com/mitre/vulcan',
    demo: 'https://vulcan-demo.mitre.org'
  },
  {
    icon: Shield,
    name: 'InSpec',
    description: 'Open-source testing framework for infrastructure. Write compliance-as-code profiles to validate security controls.',
    href: 'https://www.inspec.io',
    repo: 'https://github.com/inspec/inspec',
    docs: 'https://docs.chef.io/inspec/',
    external: true
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="MITRE SAF"
  title="Security Automation Tools"
  description="The MITRE Security Automation Framework provides a comprehensive suite of open-source tools to support every phase of the security automation lifecycle. From planning and authoring security requirements to validating controls and visualizing results, SAF tools enable teams to build, test, and maintain secure systems efficiently."
/>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Available Tools"
  title="Complete Security Automation Toolkit"
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <a
      v-for="app in apps"
      :key="app.name"
      :href="app.href"
      :target="app.external ? '_blank' : undefined"
      :rel="app.external ? 'noopener noreferrer' : undefined"
      class="app-card block p-6 bg-card rounded-lg border border-border hover:border-[--vp-c-brand-1] hover:shadow-lg transition-all"
    >
      <div class="flex items-start gap-4 mb-4">
        <component :is="app.icon" class="text-[--vp-c-brand-1] flex-shrink-0" :size="32" />
        <div>
          <h3 class="text-xl font-semibold text-[--vp-c-text-1] mb-2">{{ app.name }}</h3>
          <p class="text-sm text-[--vp-c-text-2]">{{ app.description }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-3 text-sm">
        <span v-if="app.demo" class="text-[--vp-c-brand-1]">
          Try Demo →
        </span>
        <span v-if="app.repo" class="text-[--vp-c-brand-1]">
          GitHub →
        </span>
        <span v-if="app.docs" class="text-[--vp-c-brand-1]">
          Documentation →
        </span>
      </div>
    </a>
  </div>
</PageSection>

<PageSection
  orientation="vertical"
  headline="Getting Started"
  title="Choose Your Starting Point"
  description="Jump in at any phase of the security automation lifecycle based on your current needs and maturity level."
>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="getting-started-card p-6 bg-card rounded-lg border border-border">
      <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-3">New to Security Automation?</h3>
      <p class="text-sm text-[--vp-c-text-2] mb-4">Start by validating your systems with existing InSpec profiles, then visualize the results in Heimdall.</p>
      <div class="flex flex-col gap-2 text-sm">
        <a href="/content/" class="text-[--vp-c-brand-1] hover:underline">Browse Security Profiles →</a>
        <a href="/apps/heimdall" class="text-[--vp-c-brand-1] hover:underline">Learn About Heimdall →</a>
      </div>
    </div>

    <div class="getting-started-card p-6 bg-card rounded-lg border border-border">
      <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-3">Already Running Security Scans?</h3>
      <p class="text-sm text-[--vp-c-text-2] mb-4">Use SAF CLI to convert your existing security tool outputs (Nessus, SonarQube, etc.) into a common format.</p>
      <div class="flex flex-col gap-2 text-sm">
        <a href="/apps/saf-cli" class="text-[--vp-c-brand-1] hover:underline">Learn About SAF CLI →</a>
        <a href="/framework/normalize" class="text-[--vp-c-brand-1] hover:underline">Normalization Guide →</a>
      </div>
    </div>

    <div class="getting-started-card p-6 bg-card rounded-lg border border-border">
      <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-3">Creating Custom Requirements?</h3>
      <p class="text-sm text-[--vp-c-text-2] mb-4">Use Vulcan to author security guidance documents, then generate InSpec profiles from your requirements.</p>
      <div class="flex flex-col gap-2 text-sm">
        <a href="/apps/vulcan" class="text-[--vp-c-brand-1] hover:underline">Learn About Vulcan →</a>
        <a href="/framework/plan" class="text-[--vp-c-brand-1] hover:underline">Planning Guide →</a>
      </div>
    </div>
  </div>
</PageSection>

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}

.app-card {
  text-decoration: none !important;
}

.app-card:hover {
  text-decoration: none !important;
}

/* Lighten cards in dark mode for better contrast */
.dark .app-card,
.dark .getting-started-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
