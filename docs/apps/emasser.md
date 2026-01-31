---
title: eMASSer - Enterprise Mission Assurance Support Service Integration
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
    description: 'Run eMASS as a containerized application using Docker. Pull the Docker image directly from DockerHub for container orchestration or use in containerized CI/CD pipelines.',
    links: [
      { label: 'DockerHub', href: 'https://hub.docker.com/r/mitre/emasser' },
      { label: 'View Source', href: 'https://github.com/mitre/emass_client' }
    ]
  },
  {
    name: 'Ruby Gem',
    icon: 'ruby',
    description: 'Install eMASSer as a Ruby gem for integration into your Ruby applications or command-line usage. Use gem install to add eMASS client capabilities to your Ruby environment.',
    links: [
      { label: 'RubyGems', href: 'https://rubygems.org/gems/emass_client/' },
      { label: 'View Source', href: 'https://github.com/mitre/emass_client' }
    ]
  },
  {
    name: 'From Source',
    icon: 'github',
    description: 'Build and run eMASS from source code for development or custom builds. Clone the repository, install dependencies, and run locally or contribute to the project.',
    links: [
      { label: 'View Source', href: 'https://github.com/mitre/emass_client' },
      { label: 'Documentation', href: 'https://github.com/mitre/emass_client/wiki' }
    ]
  }
]

const resources = [
  {
    title: 'Source Code',
    description: 'View the complete source code, contribute features, or report issues on GitHub.',
    href: 'https://github.com/mitre/emass_client'
  },
  {
    title: 'Documentation',
    description: 'Installation guides, API documentation, and usage examples.',
    href: 'https://github.com/mitre/emass_client/wiki'
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="SAF Apps"
  description="eMASS is MITRE SAF's tool for automating interactions with the Enterprise Mission Assurance Support Service (eMASS). Push security test data to eMASS instances, update compliance status, and keep eMASS synchronized with your DevSecOps pipeline."
>
  <template #title>
    <span class="flex items-center gap-3">
      <BrandIcon name="saf" :size="40" />
      eMASSer
    </span>
  </template>

  <template #links>
    <div class="button-grid">
      <Button as="a" href="https://github.com/mitre/emass_client" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <Github :size="20" />
        View on GitHub
      </Button>
      <Button as="a" href="https://github.com/mitre/emass_client/wiki" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BookOpen :size="20" />
        Documentation
      </Button>
      <Button as="a" href="https://hub.docker.com/r/mitre/emasser" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="docker" :size="20" />
        DockerHub
      </Button>
      <Button as="a" href="https://rubygems.org/gems/emass_client/" target="_blank" rel="noopener noreferrer" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <BrandIcon name="ruby" :size="20" />
        RubyGems
      </Button>
      <Button as="a" href="/framework/normalize" variant="outline" size="lg" class="flex items-center gap-2 no-underline">
        <PillarIcon pillar="normalize" :size="20" />
        Normalize
      </Button>
    </div>
  </template>
</PageSection>

<PageSection
  orientation="vertical"
  headline="Automate Reporting"
  title="Keep eMASS packages up to date"
  description="The Defense Information Systems Agency (DISA) provides the Enterprise Mission Assurance Support Service (eMASS) application for managing cybersecurity data for US Department of Defense information systems. eMASS provides an Application Programming Interface (API) to allow users to request and post data to their eMASS instance quickly, easily, and repeatably."
/>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="eMASS Integration"
  title="Automate eMASS workflows"
  description="MITRE SAF's eMASSer tool uses the Framework's eMASS client library to provide a simple interface at the command-line interface (CLI) to automate routine use cases for eMASS. It can be used by an operator to push locally saved data to a remote eMASS instance, or it can be added to the end of a DevSecOps pipeline to keep eMASS up-to-date with a system's most recent security test data. eMASSer is distributed as a Docker container and as a Ruby Gem, or directly from its GitHub page."
/>

<PageSection
  orientation="vertical"
  headline="Associated Content"
  title="eMASS Client Library"
  description="The eMASS client library used by eMASSer can be used as a dependency by other third party apps for programmatic integration with eMASS systems."
/>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Get Started"
  title="Deployment Options"
  description="Choose the deployment option that works best for your eMASS integration requirements. eMASS can be deployed as a containerized service or installed as a Ruby gem."
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
  title="Learn More About eMASS"
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

.prose-content {
  max-width: 800px;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}

.prose-content p {
  margin-bottom: 1rem;
}

.prose-content a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.prose-content a:hover {
  text-decoration: underline;
}

.prose-content strong {
  font-weight: 600;
  color: var(--vp-c-text-1);
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
