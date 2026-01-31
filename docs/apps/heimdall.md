---
title: Heimdall - Security Visualization Platform
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
    name: 'Heimdall Server',
    icon: 'heimdall',
    description: 'Full-featured server application with database backend. Store results centrally, enable team collaboration, track compliance over time, and integrate with CI/CD pipelines. Ideal for enterprise security teams.',
    links: [
      { label: 'Try Demo', href: 'https://heimdall-demo.mitre.org' },
      { label: 'View Source', href: 'https://github.com/mitre/heimdall2' },
      { label: 'Documentation', href: 'https://github.com/mitre/heimdall2/wiki' }
    ]
  },
  {
    name: 'Heimdall Lite',
    icon: 'heimdall',
    description: 'Client-side visualization tool that runs entirely in your browser. No server required - upload HDF files directly for instant visualization. Perfect for individual security analysts or quick compliance checks.',
    links: [
      { label: 'Try Heimdall Lite', href: 'https://heimdall-lite.mitre.org' },
      { label: 'View Source', href: 'https://github.com/mitre/heimdall-lite' }
    ]
  },
  {
    name: 'Container Deployment',
    icon: 'docker',
    description: 'Deploy Heimdall as a containerized application using Docker or Kubernetes. Use our Helm chart for simplified Kubernetes deployment, or pull the Docker image directly from DockerHub for container orchestration.',
    links: [
      { label: 'DockerHub', href: 'https://hub.docker.com/r/mitre/heimdall2' },
      { label: 'Helm Chart', href: 'https://github.com/mitre/heimdall-helm' }
    ]
  },
  {
    name: 'NPM Package',
    icon: 'npm',
    description: 'Install Heimdall Lite as an NPM package for integration into your Node.js workflows or local development environment. Ideal for developers who want to embed Heimdall visualization capabilities into their own applications.',
    links: [
      { label: 'NPM Package', href: 'https://www.npmjs.com/package/@mitre/heimdall-lite' },
      { label: 'View Source', href: 'https://github.com/mitre/heimdall-lite' }
    ]
  }
]

const resources = [
  {
    title: 'Source Code',
    description: 'View the complete source code, contribute features, or report issues on GitHub.',
    href: 'https://github.com/mitre/heimdall2'
  },
  {
    title: 'Documentation',
    description: 'Installation guides, API documentation, and usage examples.',
    href: 'https://github.com/mitre/heimdall2/wiki'
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="SAF Apps"
  description="Heimdall is MITRE SAF™'s security data visualization and analysis platform. Upload security validation results in Heimdall Data Format (HDF), view interactive compliance dashboards, compare results across systems and time periods, and generate comprehensive reports for stakeholders."
>
  <template #title>
    <span class="flex items-center gap-3">
      <BrandIcon name="heimdall" :size="40" />
      Heimdall
    </span>
  </template>

  <template #links>
    <div class="button-grid">
      <Button as="a" href="https://heimdall-demo.mitre.org" target="_blank" rel="noopener noreferrer" variant="default" size="lg">
        Try Heimdall Demo
      </Button>
      <Button as="a" href="https://heimdall-lite.mitre.org" target="_blank" rel="noopener noreferrer" variant="default" size="lg">
        Try Heimdall Lite
      </Button>
      <Button as="a" href="https://github.com/mitre/heimdall2" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <Github :size="20" />
        View on GitHub
      </Button>
      <Button as="a" href="https://github.com/mitre/heimdall2/wiki" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BookOpen :size="20" />
        Documentation
      </Button>
      <Button as="a" href="https://hub.docker.com/r/mitre/heimdall2" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="docker" :size="20" />
        DockerHub
      </Button>
      <Button as="a" href="https://www.npmjs.com/package/@mitre/heimdall-lite" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="npm" :size="20" />
        NPM Package
      </Button>
      <Button as="a" href="https://github.com/mitre/heimdall-helm" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="helm" :size="20" />
        Helm Chart
      </Button>
      <Button as="a" href="/framework/visualize" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <PillarIcon pillar="visualize" :size="20" />
        Visualize
      </Button>
    </div>
  </template>
</PageSection>

<!-- Dashboard View -->
<PageSection
  orientation="horizontal"
  headline="Dashboard View"
  title="Visualize Your Security Posture"
  description="Load data into Heimdall for easy sorting, filtering, and summarizing of your security results. Focus on information relevant to security assessments."
>
  <img src="/screenshots/heimdall-dashboard.png" alt="Heimdall dashboard showing overall compliance statistics" class="screenshot" />
</PageSection>

<!-- Data Aggregation -->
<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="Data Aggregation"
  title="Aggregate Your Security Data"
  description="Heimdall automatically converts input security data into a common format (Heimdall Data Format). Unite all of your security scan output under a single pane of glass. Export your aggregated data into a multitude of common formats supporting assessments."
>
  <img src="/screenshots/heimdall-aggregate.png" alt="Heimdall aggregating data from multiple sources" class="screenshot" />
</PageSection>

<!-- Detailed Analysis -->
<PageSection
  orientation="horizontal"
  headline="Detailed Analysis"
  title="Deep Dive Into Your Data"
  description="Use Heimdall to examine each control in your test suite in detail. Determine root causes of failures and see the exact test code that led to each result."
>
  <img src="/screenshots/heimdall-detail.png" alt="Detailed control failure view with test code" class="screenshot" />
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Get Started"
  title="Deployment Options"
  description="Choose the deployment option that works best for your organization's security and collaboration requirements. Heimdall can be deployed as a full server application, a lightweight browser tool, a containerized service, or an NPM package."
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  title="Learn More About Heimdall"
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
    grid-template-columns: repeat(4, 1fr);
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

/* Screenshot images */
.screenshot {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .screenshot {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
