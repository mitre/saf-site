---
title: SAF CLI - Security Automation Command-Line Tool
layout: doc
aside: false
---

<script setup>
import { Github, BookOpen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import BrandIcon from '../.vitepress/theme/components/icons/BrandIcon.vue'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'

const deploymentOptions = [
  {
    name: 'Container Deployment',
    icon: 'docker',
    description: 'Run SAF CLI as a containerized application using Docker. Pull the Docker image directly from DockerHub for container orchestration or use in containerized CI/CD pipelines.',
    links: [
      { label: 'DockerHub', href: 'https://hub.docker.com/r/mitre/saf' },
      { label: 'View Source', href: 'https://github.com/mitre/saf' }
    ]
  },
  {
    name: 'NPM Package',
    icon: 'npm',
    description: 'Install SAF CLI as a global NPM package for easy command-line access. Use npm or yarn to install and run SAF commands directly from your terminal. Perfect for local development and CI/CD integration.',
    links: [
      { label: 'NPM Package', href: 'https://www.npmjs.com/package/@mitre/saf' },
      { label: 'View Source', href: 'https://github.com/mitre/saf' }
    ]
  },
  {
    name: 'From Source',
    icon: 'github',
    description: 'Build and run SAF CLI from source code for development or custom builds. Clone the repository, install dependencies, and run locally or contribute to the project.',
    links: [
      { label: 'View Source', href: 'https://github.com/mitre/saf' },
      { label: 'Documentation', href: 'https://saf-cli.mitre.org' }
    ]
  }
]

const resources = [
  {
    title: 'Source Code',
    description: 'View the complete source code, contribute features, or report issues on GitHub.',
    href: 'https://github.com/mitre/saf'
  },
  {
    title: 'Documentation',
    description: 'Command reference, usage guides, and integration examples.',
    href: 'https://saf-cli.mitre.org'
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="SAF Apps"
  description="SAF CLI is MITRE SAF™'s command-line tool for security automation. Convert security tool outputs to HDF, summarize test results, validate against thresholds, update InSpec profiles, create attestations, and interface with eMASS - all from your terminal or CI/CD pipeline."
>
  <template #title>
    <span class="flex items-center gap-3">
      <BrandIcon name="saf" :size="40" />
      SAF CLI
    </span>
  </template>

  <template #links>
    <div class="button-grid">
      <Button as="a" href="https://github.com/mitre/saf" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <Github :size="20" />
        View on GitHub
      </Button>
      <Button as="a" href="https://saf-cli.mitre.org" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BookOpen :size="20" />
        Documentation
      </Button>
      <Button as="a" href="https://hub.docker.com/r/mitre/saf" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="docker" :size="20" />
        DockerHub
      </Button>
      <Button as="a" href="https://www.npmjs.com/package/@mitre/saf" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="npm" :size="20" />
        NPM Package
      </Button>
      <Button as="a" href="/framework/normalize" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <PillarIcon pillar="normalize" :size="20" />
        Normalize
      </Button>
    </div>
  </template>
</PageSection>

<!-- TODO: Add screenshot section - Convert Formats -->
<PageSection
  orientation="horizontal"
  headline="Data Normalization"
  title="Convert between security data formats"
  description="Easily normalize reports from multiple scanning tools into OHDF, or convert OHDF to your desired data format."
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: SAF CLI converting security data formats</p>
  </div>
</PageSection>

<!-- TODO: Add screenshot section - Summarize Results -->
<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="Result Summary"
  title="Summarize your test results"
  description="Point SAF CLI to an OHDF file and have it print summary data on control statuses."
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: SAF CLI summarizing test results</p>
  </div>
</PageSection>

<!-- TODO: Add screenshot section - Threshold Validation -->
<PageSection
  orientation="horizontal"
  headline="Threshold Validation"
  title="Check against thresholds"
  description="Validate your security data against a fine-grain threshold of compliance that you define for your environment. Useful for defining a go/no-go decision point in a CI/CD pipeline -- ensure that your pipeline will continue to execute if and only if your automated compliance testing passes!"
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: SAF CLI validating against thresholds</p>
  </div>
</PageSection>

<!-- TODO: Add screenshot section - Profile Updates -->
<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="Profile Management"
  title="Update InSpec profiles"
  description="SAF CLI's Delta feature updates the metadata of an InSpec profile against new versions of the baseline guidance the profile implements, and helps identify which controls need their test logic updated by a human being."
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: SAF CLI updating InSpec profiles</p>
  </div>
</PageSection>

<!-- TODO: Add screenshot section - Attestations -->
<PageSection
  orientation="horizontal"
  headline="Attestation Management"
  title="Create attestations"
  description="SAF CLI allows you to write an attestation about the state of a manual control, and add it into your automated scanning results data. Add manual data to your automated workflows!"
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: SAF CLI creating attestations</p>
  </div>
</PageSection>

<!-- TODO: Add screenshot section - eMASS Integration -->
<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="eMASS Integration"
  title="Interface with eMASS"
  description="SAF CLI has functions for working with the eMASS API to update control statuses, provide reports to the eMASS server, query eMASS for data, and more. This allows you to interact with eMASS automatically within your pipelines."
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: SAF CLI interfacing with eMASS</p>
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Get Started"
  title="Deployment Options"
  description="Choose the deployment option that works best for your workflow. SAF CLI can be installed as an NPM package, run as a container, or built from source."
>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div v-for="option in deploymentOptions" :key="option.name" class="deployment-card">
      <div class="card-header">
        <BrandIcon :name="option.icon" :size="32" />
        <h3>{{ option.name }}</h3>
      </div>
      <p class="text-sm text-[--vp-c-text-2] mb-4">{{ option.description }}</p>
      <div class="flex flex-wrap gap-3">
        <a v-for="link in option.links" :key="link.label" :href="link.href" target="_blank" rel="noopener noreferrer" class="text-sm text-[--vp-c-brand-1] hover:underline">
          {{ link.label }} →
        </a>
      </div>
    </div>
  </div>
</PageSection>

<PageSection
  orientation="vertical"
  headline="Resources"
  title="Learn More About SAF CLI"
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <a :href="resources[0].href" target="_blank" rel="noopener noreferrer" class="resource-card">
      <div class="card-header">
        <Github :size="32" />
        <h3>{{ resources[0].title }}</h3>
      </div>
      <p class="card-description">{{ resources[0].description }}</p>
    </a>
    <a :href="resources[1].href" target="_blank" rel="noopener noreferrer" class="resource-card">
      <div class="card-header">
        <BookOpen :size="32" />
        <h3>{{ resources[1].title }}</h3>
      </div>
      <p class="card-description">{{ resources[1].description }}</p>
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

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
}

.button-grid > * {
  width: 100%;
  min-width: 0;
}

@media (min-width: 768px) {
  .button-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.screenshot-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--vp-c-bg-soft);
  border: 2px dashed var(--vp-c-border);
  border-radius: 8px;
  padding: 2rem;
}

.deployment-card,
.resource-card {
  display: block;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  transition: border-color 0.2s ease;
}

.resource-card:hover {
  border-color: var(--vp-c-brand-1);
}

.card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-header h3 {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  color: var(--vp-c-text-1) !important;
  line-height: 1 !important;
}

.card-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2) !important;
  margin: 0 0 1rem 0;
}

/* Remove underlines from button links */
.no-underline,
.no-underline:hover {
  text-decoration: none !important;
}

/* Lighten cards in dark mode for better contrast */
.dark .deployment-card,
.dark .resource-card {
  background-color: var(--vp-c-bg-soft) !important;
}

/* Clickable resource cards */
.resource-card {
  cursor: pointer;
}
</style>
