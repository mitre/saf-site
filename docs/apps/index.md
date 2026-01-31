---
title: SAF Apps
layout: doc
aside: false
---

<script setup>
import { Eye, Terminal, PenTool, BookText } from 'lucide-vue-next'
import BrandIcon from '../.vitepress/theme/components/icons/BrandIcon.vue'

const apps = [
  {
    icon: 'heimdall',
    name: 'Heimdall',
    description: 'Security data visualization and analysis platform. View compliance dashboards, compare results, and generate reports.',
    href: '/apps/heimdall',
    links: [
      { label: 'View Details', href: '/apps/heimdall' },
      { label: 'Try Demo', href: 'https://heimdall-demo.mitre.org' },
      { label: 'GitHub', href: 'https://github.com/mitre/heimdall2' }
    ]
  },
  {
    icon: 'saf',
    name: 'SAF CLI',
    description: 'Command-line tool for security automation. Convert security tool outputs to HDF, generate InSpec profiles, and more.',
    href: '/apps/saf-cli',
    links: [
      { label: 'View Details', href: '/apps/saf-cli' },
      { label: 'Documentation', href: 'https://saf-cli.mitre.org' },
      { label: 'GitHub', href: 'https://github.com/mitre/saf' }
    ]
  },
  {
    icon: 'saf',
    name: 'Vulcan',
    description: 'Security guidance authoring tool. Create and edit security requirements documents that serve as the foundation for automation.',
    href: '/apps/vulcan',
    links: [
      { label: 'View Details', href: '/apps/vulcan' },
      { label: 'Try Demo', href: 'https://vulcan.mitre.org' },
      { label: 'GitHub', href: 'https://github.com/mitre/vulcan' }
    ]
  },
  {
    icon: 'saf',
    name: 'eMASSer',
    description: 'eMASS integration tool. Automate interactions with Enterprise Mission Assurance Support Service to keep compliance packages up to date.',
    href: '/apps/emasser',
    links: [
      { label: 'View Details', href: '/apps/emasser' },
      { label: 'GitHub', href: 'https://github.com/mitre/emass_client' }
    ]
  },
  {
    icon: 'content',
    name: 'Security Automation Content',
    description: 'Browse security validation profiles and hardening content for various platforms and compliance frameworks.',
    href: '/content/',
    links: [
      { label: 'Browse Content', href: '/content/' }
    ]
  }
]

const gettingStarted = [
  {
    title: 'New to Security Automation?',
    description: 'Start by validating your systems with existing InSpec profiles, then visualize the results in Heimdall.',
    links: [
      { label: 'Browse Security Profiles', href: '/content/' },
      { label: 'Learn About Heimdall', href: '/apps/heimdall' }
    ]
  },
  {
    title: 'Already Running Security Scans?',
    description: 'Use SAF CLI to convert your existing security tool outputs (Nessus, SonarQube, etc.) into a common format.',
    links: [
      { label: 'Learn About SAF CLI', href: '/apps/saf-cli' },
      { label: 'Normalization Guide', href: '/framework/normalize' }
    ]
  },
  {
    title: 'Creating Custom Requirements?',
    description: 'Use Vulcan to author security guidance documents, then generate InSpec profiles from your requirements.',
    links: [
      { label: 'Learn About Vulcan', href: '/apps/vulcan' },
      { label: 'Planning Guide', href: '/framework/plan' }
    ]
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="MITRE SAF™"
  title="Security Automation Tools"
  description="The MITRE Security Automation Framework™ provides a comprehensive suite of open-source tools to support every phase of the security automation lifecycle. From planning and authoring security requirements to validating controls and visualizing results, SAF tools enable teams to build, test, and maintain secure systems efficiently."
/>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Available Tools"
  title="Complete Security Automation Toolkit"
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <a v-for="app in apps" :key="app.name" :href="app.href" class="app-card">
      <div class="card-header">
        <BrandIcon v-if="app.icon !== 'content'" :name="app.icon" :size="32" />
        <BookText v-else :size="32" class="text-[--vp-c-brand-1]" />
        <h3>{{ app.name }}</h3>
      </div>
      <p class="card-description">{{ app.description }}</p>
      <div class="card-links">
        <a v-for="link in app.links" :key="link.label" :href="link.href" @click.stop>
          {{ link.label }} →
        </a>
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
    <div v-for="item in gettingStarted" :key="item.title" class="getting-started-card">
      <h3 class="card-title">{{ item.title }}</h3>
      <p class="card-description">{{ item.description }}</p>
      <div class="card-links">
        <a v-for="link in item.links" :key="link.label" :href="link.href">
          {{ link.label }} →
        </a>
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

.app-card,
.getting-started-card {
  display: block;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  transition: border-color 0.2s ease;
}

.app-card {
  cursor: pointer;
}

.app-card:hover {
  border-color: var(--vp-c-brand-1);
}

.card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-header h3,
.card-title {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  color: var(--vp-c-text-1) !important;
  line-height: 1 !important;
}

.card-title {
  margin-bottom: 0.75rem !important;
}

.card-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2) !important;
  margin: 0 0 1rem 0;
}

.card-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.card-links a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.card-links a:hover {
  text-decoration: underline;
}

/* Lighten cards in dark mode for better contrast */
.dark .app-card,
.dark .getting-started-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
