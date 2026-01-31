---
title: Vulcan - Security Guidance Authoring Platform
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
    description: 'Deploy Vulcan as a containerized application using Docker or Kubernetes. Use our Helm chart for simplified Kubernetes deployment, or pull the Docker image directly from DockerHub for container orchestration.',
    links: [
      { label: 'DockerHub', href: 'https://hub.docker.com/r/mitre/vulcan' },
      { label: 'Helm Chart', href: 'https://github.com/mitre/vulcan-helm' }
    ]
  },
  {
    name: 'From Source',
    icon: 'github',
    description: 'Build and deploy Vulcan from source code for development or custom deployments. Clone the repository, install dependencies, and run locally or deploy to your own infrastructure.',
    links: [
      { label: 'View Source', href: 'https://github.com/mitre/vulcan' },
      { label: 'Documentation', href: 'https://github.com/mitre/vulcan/wiki' }
    ]
  }
]

const resources = [
  {
    title: 'Source Code',
    description: 'View the complete source code, contribute features, or report issues on GitHub.',
    href: 'https://github.com/mitre/vulcan'
  },
  {
    title: 'Documentation',
    description: 'Installation guides, API documentation, and usage examples.',
    href: 'https://github.com/mitre/vulcan/wiki'
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="SAF Apps"
  description="Vulcan is MITRE SAF™'s security guidance authoring platform. Create, edit, and collaborate on security requirements documents, align content to source guidance, and generate InSpec test profiles directly from your baselines."
>
  <template #title>
    <span class="flex items-center gap-3">
      <BrandIcon name="saf" :size="40" />
      Vulcan
    </span>
  </template>

  <template #links>
    <div class="button-grid">
      <Button as="a" href="https://vulcan.mitre.org" target="_blank" rel="noopener noreferrer" variant="default" size="lg">
        Try Vulcan Demo
      </Button>
      <Button as="a" href="https://github.com/mitre/vulcan" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <Github :size="20" />
        View on GitHub
      </Button>
      <Button as="a" href="https://github.com/mitre/vulcan/wiki" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BookOpen :size="20" />
        Documentation
      </Button>
      <Button as="a" href="https://hub.docker.com/r/mitre/vulcan" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="docker" :size="20" />
        DockerHub
      </Button>
      <Button as="a" href="https://github.com/mitre/vulcan-helm" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="helm" :size="20" />
        Helm Chart
      </Button>
      <Button as="a" href="/framework/plan" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <PillarIcon pillar="plan" :size="20" />
        Plan
      </Button>
    </div>
  </template>
</PageSection>

<!-- Baseline Editing -->
<PageSection
  orientation="horizontal"
  headline="Baseline Editing"
  title="Develop Baselines in a User-Friendly Editing Window"
  description="Construct your baselines in a simple but feature-rich editing view. Use Vulcan's sorting and filtering features to quickly search through your controls."
>
  <img src="/screenshots/vulcan-editor.png" alt="Vulcan editing interface with controls" class="screenshot" />
</PageSection>

<!-- Source Alignment -->
<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="Source Alignment"
  title="Align Your Content Back To Source Guidance"
  description="Import your high-level requirements into Vulcan and use them as the direct template for your baseline content. Start with general guidance and tailor it to your component."
>
  <img src="/screenshots/vulcan-alignment.png" alt="Vulcan aligning content to source guidance" class="screenshot" />
</PageSection>

<!-- Collaboration -->
<PageSection
  orientation="horizontal"
  headline="Collaboration"
  title="Streamline Baseline Creation In A Collaborative Environment"
  description="Vulcan supports a distributed model of baseline development in which multiple authors collaborate to produce high-quality content. Use Vulcan's change control, peer review and role-based permissions to keep all of your authors working from the same sheet of music. Avoid the mental overhead of managing your document versions manually."
>
  <img src="/screenshots/vulcan-collaboration.png" alt="Vulcan collaborative features" class="screenshot" />
</PageSection>

<!-- InSpec Integration -->
<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="InSpec Integration"
  title="Develop Automated Tests For Your Content"
  description="Vulcan includes an InSpec testing framework integration to allow authors to write automated tests alongside their human-readable baselines. Vulcan pre-populates the tests with metadata from the original baselines to keep your test profiles tightly bound to the guidance from which they were written."
>
  <img src="/screenshots/vulcan-inspec.png" alt="Vulcan InSpec test development" class="screenshot" />
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Get Started"
  title="Deployment Options"
  description="Choose the deployment option that works best for your organization's security guidance authoring requirements. Vulcan can be deployed as a containerized service or built from source."
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
  title="Learn More About Vulcan"
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
    grid-template-columns: repeat(3, 1fr);
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
