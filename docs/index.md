---
layout: home

hero:
  name: MITRE
  text: Security Automation Framework(tm)
  tagline: Open source security testing and compliance automation toolkit
  actions:
    - theme: brand
      text: Get Started
      link: /docs/
    - theme: alt
      text: View on GitHub
      link: https://github.com/mitre/saf
---

<script setup>
import { DollarSign, Github, Users, BookText, Layers, Package, Wrench } from 'lucide-vue-next'
import PillarIcon from './.vitepress/theme/components/icons/PillarIcon.vue'
import BrandIcon from './.vitepress/theme/components/icons/BrandIcon.vue'
import { SafLogoIcon } from './.vitepress/theme/components/icons/tools'
import LogoGrid from './.vitepress/theme/components/LogoGrid.vue'

const pillars = [
  {
    pillar: 'plan',
    title: 'PLAN',
    description: 'Select, tailor, and create security guidance content appropriate for your mission.',
    body: 'Use Vulcan to create and manage security baselines to implement security requirements.',
    href: '/framework/plan'
  },
  {
    pillar: 'harden',
    title: 'HARDEN',
    description: 'Implement security baselines using verified Ansible, Chef, and Terraform content.',
    body: 'Use Ansible, Terraform, Chef, and Puppet content from the MITRE SAF(tm) Hardening Library to implement security baselines.',
    href: '/framework/harden'
  },
  {
    pillar: 'validate',
    title: 'VALIDATE',
    description: 'Generate detailed security testing results throughout the lifecycle of a system through automated tests and manual attestation.',
    body: 'Use InSpec content from the MITRE SAF(tm) Validation Library to assess security control compliance.',
    href: '/framework/validate'
  },
  {
    pillar: 'normalize',
    title: 'NORMALIZE',
    description: 'Convert security results from all your security tools into a common data format.',
    body: 'Use the MITRE SAF(tm) command line interface (CLI) to normalize security tool output in the OASIS Heimdall Data Format (OHDF).',
    href: '/framework/normalize'
  },
  {
    pillar: 'visualize',
    title: 'VISUALIZE',
    description: 'Identify overall security status and deep-dive to resolve specific security defects.',
    body: 'Use the MITRE SAF(tm) Heimdall Lite/Server to visualize security status across all security tools and even to share with your organization\'s reporting / GRC tools.',
    href: '/framework/visualize'
  }
]

const values = [
  {
    icon: DollarSign,
    title: 'Free',
    description: 'All MITRE SAF(tm) content is free to use under the Apache 2 license. The Framework is currently in use by government sponsors, vendors, and private sector companies, tailoring content for their own organizational requirements.'
  },
  {
    icon: Github,
    title: 'Open Source',
    description: 'MITRE SAF(tm) hosts all source code for tools and test profiles publicly on GitHub. Organizations are free to use the code or its capabilities however required.'
  },
  {
    icon: Users,
    title: 'A Community',
    description: 'All MITRE SAF(tm) content is generated and maintained by a robust security community of both MITRE and non-MITRE contributors; MITRE serves as the framework steward. Collaboration across the community multiplies the impact for all users.'
  }
]

const toolset = [
  {
    name: 'SAF CLI',
    icon: 'saf',
    description: 'The MITRE SAF(tm) Command Line Interface (CLI) gives users the ability to quickly normalize disparate scan results from multiple tools to HDF, generate InSpec profiles, and validate that security requirements have been met.',
    pillars: ['harden', 'normalize', 'validate'],
    href: '/apps/saf-cli'
  },
  {
    name: 'Heimdall',
    icon: 'heimdall',
    description: 'Heimdall is MITRE SAF\'s(tm) visualization platform. Upload results from the baseline validations that you have run or view existing security standards, and generate reports to give to your organization\'s reporting or SIEM tools.',
    pillars: ['normalize', 'visualize'],
    href: '/apps/heimdall'
  },
  {
    name: 'Vulcan',
    icon: 'saf',
    description: 'The MITRE SAF(tm) Vulcan application allows users to create security guidance utilizing the Security Requirements Guides. Vulcan streamlines the process to help authors concentrate on writing quality security guidance.',
    pillars: ['plan'],
    href: '/apps/vulcan'
  },
  {
    name: 'Content Library',
    icon: 'content',
    description: 'The MITRE SAF(tm) content library includes InSpec validation profiles and Chef, Ansible, and Puppet hardening content. These can be used as a starting point or as reference material for developing your organization\'s security controls and hardening baselines.',
    pillars: ['harden', 'validate'],
    href: '/content/'
  },
  {
    name: 'eMASS',
    icon: 'saf',
    description: 'eMASS integration with MITRE SAF(tm) provides automated workflows to support continuous monitoring and assessment workflows.',
    pillars: ['normalize'],
    href: '/apps/emasser'
  },
  {
    name: 'OHDF',
    icon: 'saf',
    description: 'OASIS Heimdall Data Format (OHDF) is the common data format standard that facilitates security results analysis and consumption as a building metric, consolidate data, compare security results from a variety of tools over time, and much more.',
    pillars: ['normalize', 'validate'],
    href: '/framework/normalize'
  }
]

// Sponsors and partners using SAF (using static image placeholders)
// Replace image paths with actual logo files in /public/img/partners/
const sponsors = [
  { name: 'Platform One', image: '/logos/sponsors/platform-one.png' },
  { name: 'Defense Security Cooperation Agency', image: '/logos/sponsors/dsca.jpg' },
  { name: 'Defense Counterintelligence and Security Agency', image: '/logos/sponsors/dcsa.png' },
  { name: 'United States Air Force', image: '/logos/sponsors/usaf.svg' },
  { name: 'Department of Defense CIO', image: '/logos/sponsors/dod.png' },
  { name: 'Defense Information Systems Agency', image: '/logos/sponsors/disa.svg' },
  { name: 'United States Army Enterprise Cloud Management Agency', image: '/logos/sponsors/army-ecma.png' },
  { name: 'Centers for Medicare & Medicaid Services', image: '/logos/sponsors/cms.svg' },
  { name: 'Center for Disease Control and Prevention', image: '/logos/sponsors/cdc.svg' },
  { name: 'National Reconnaissance Office', image: '/logos/sponsors/nro.png' }
]

const vendors = [
  { name: 'Progress Chef', image: '/logos/vendors/chef.svg' },
  { name: 'VMware', image: '/logos/vendors/vmware.png' },
  { name: 'Sophos', image: '/logos/vendors/sophos.png' },
  { name: 'Lockheed Martin', image: '/logos/vendors/lockheed-martin.png' },
  { name: 'Rancher Government Solutions', image: '/logos/vendors/rgs.png' },
  { name: 'Google Cloud', image: '/logos/vendors/google-cloud.png' },
  { name: 'GitHub', image: '/logos/vendors/github.svg' },
  { name: 'Ansible', image: 'https://via.placeholder.com/150x150.png?text=Ansible' },
  { name: 'CrunchyData', image: '/logos/vendors/crunchy-data.png' },
  { name: 'Elastic', image: '/logos/vendors/elastic.svg' }
]

const userStories = [
  {
    question: '"How can I determine what security baseline I should measure against?"',
    answer: 'Quality security automation content should be tied back to trusted human-readable security guidance, such as baseline documents published by government and industry (e.g., DISA STIGs). Before you can test your software automatically, know not only what you are testing, but why. If there are no existing published baseline guidance documents for your software component, you can research and author your own.'
  },
  {
    question: '"How do I manage a diverse set of security data?"',
    answer: 'Normalization enhances the analysis of security data, facilitating wholistic system security assessments. Converting security tool output to the Heimdall Data Format enables you to aggregate data and visualize the disparate security results across all components of a stack.'
  },
  {
    question: '"How do I provide sufficient evidence to authorize (or ATO) my system?"',
    answer: 'Modern software environments require effective, pervasive automated testing. Each component of the stack – no matter how simple or how complex – should be regularly scanned. Heimdall and the SAF CLI can generate robust reports for your data to illustrate a positive security posture.'
  }
]

const getStartedCards = [
  {
    icon: Layers,
    title: 'View the Framework',
    description: 'Explore the pillars of a solid security automation capability',
    href: '/framework/'
  },
  {
    icon: BookText,
    title: 'Browse Security Content',
    description: 'Find InSpec profiles and hardening guides',
    href: '/content/'
  },
  {
    icon: Wrench,
    title: 'Explore SAF Tools',
    description: 'Discover the applications that power security automation',
    href: '/apps/'
  }
]
</script>

<PageSection
  variant="muted"
  orientation="vertical"
  title="Jump Start Your Security Journey"
  description="MITRE SAF(tm) supports security processes at all stages of the software lifecycle, from planning secure system design to analyzing operational security data. All MITRE SAF(tm) tools can work in concert or standalone; adopt the parts of the Framework that make sense for your environment."
>
  <div class="pillar-grid">
    <a v-for="item in pillars" :key="item.pillar" :href="item.href" class="pillar-card">
      <div class="card-header">
        <PillarIcon :pillar="item.pillar" :size="32" />
        <h3>{{ item.title }}</h3>
      </div>
      <p class="card-subtitle">{{ item.description }}</p>
      <p class="card-body">{{ item.body }}</p>
    </a>
  </div>
</PageSection>

<PageSection
  orientation="vertical"
>
  <template #title>
    <span class="centered-title">MITRE SAF(tm) Is</span>
  </template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div v-for="value in values" :key="value.title" class="value-card">
      <div class="value-icon">
        <component :is="value.icon" :size="48" :stroke-width="1.5" />
      </div>
      <h3 class="value-title">{{ value.title }}</h3>
      <p class="value-description">{{ value.description }}</p>
    </div>
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
>
  <template #title>
    <span class="centered-title">The MITRE SAF(tm) Open Source Toolset</span>
  </template>
  <template #description>
    <p class="centered-description">MITRE SAF(tm) is made up of a toolkit of utilities that support security automation. MITRE SAF(tm) is modularized into different functions so you can use whichever one makes sense for your favorite security tools. You can use MITRE SAF(tm) tools on their own or without a container.</p>
  </template>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div v-for="tool in toolset" :key="tool.name" class="tool-card">
      <a :href="tool.href" class="tool-card-header">
        <BrandIcon v-if="tool.icon !== 'content'" :name="tool.icon" :size="40" />
        <BookText v-else :size="40" class="text-[--vp-c-brand-1]" />
        <h3 class="tool-card-title">{{ tool.name }}</h3>
      </a>
      <p class="tool-card-description">{{ tool.description }}</p>
      <div class="tool-card-pillars">
        <span class="pillar-label">Supports Capabilities:</span>
        <div class="pillar-icons-centered">
          <a v-for="pillar in tool.pillars" :key="pillar" :href="`/framework/${pillar}`" class="pillar-icon-link">
            <PillarIcon :pillar="pillar" :size="48" />
          </a>
        </div>
      </div>
    </div>
  </div>
</PageSection>

<PageSection
  orientation="vertical"
>
  <template #title>
    <span class="centered-title">Adopted by The Community</span>
  </template>

  <LogoGrid :items="sponsors" :columns="5" show-names variant="card" title="Sponsors" />

  <LogoGrid :items="vendors" :columns="5" show-names variant="card" title="Vendors" class="partner-group-spacing" />
</PageSection>

<PageSection
  variant="dark"
  orientation="vertical"
>
  <template #title>
    <span class="centered-title">User Stories</span>
  </template>

  <div class="grid grid-cols-1 gap-6">
    <div v-for="story in userStories" :key="story.question" class="user-story-card">
      <div class="user-story-question">{{ story.question }}</div>
      <div class="user-story-answer">{{ story.answer }}</div>
    </div>
  </div>
</PageSection>

<PageSection
  orientation="vertical"
  title="Ready to Automate Your Security?"
  description="Explore the framework pillars to find the tools and content you need."
>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a v-for="card in getStartedCards" :key="card.title" :href="card.href" class="get-started-card">
      <div class="card-header">
        <component :is="card.icon" :size="32" />
        <h3>{{ card.title }}</h3>
      </div>
      <p class="card-description">{{ card.description }}</p>
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

/* Remove VitePress default h2 border on homepage */
.VPHome .vp-doc h2,
.VPHome .vp-doc h3 {
  border-top: none !important;
  padding-top: 0 !important;
}

/* Remove any other dividers on homepage */
.VPHome hr,
.VPHome .divider {
  display: none !important;
}

.pillar-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .pillar-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  /* First 3 cards: each spans 2 columns (fills first row) */
  .pillar-card:nth-child(1),
  .pillar-card:nth-child(2),
  .pillar-card:nth-child(3) {
    grid-column: span 2;
  }

  /* Last 2 cards: centered on second row */
  .pillar-card:nth-child(4) {
    grid-column: 2 / span 2;
  }

  .pillar-card:nth-child(5) {
    grid-column: 4 / span 2;
  }
}

.pillar-card {
  display: block;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.pillar-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

.card-subtitle {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--vp-c-text-1) !important;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.card-body {
  font-size: 0.875rem;
  color: var(--vp-c-text-2) !important;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
}

/* Lighten cards in dark mode for better contrast */
.dark .pillar-card {
  background-color: var(--vp-c-bg-soft) !important;
}

.centered-title {
  display: block;
  text-align: center;
}

.centered-description {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.value-card {
  text-align: center;
  padding: 1rem;
}

.value-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: var(--vp-c-brand-1);
}

.value-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem 0;
}

.value-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0;
}

.tool-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.tool-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tool-card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  text-decoration: none !important;
  margin-bottom: 1rem;
}

.tool-card-header > * {
  flex-shrink: 0;
}

.tool-card-title {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: var(--vp-c-text-1) !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
  vertical-align: middle;
}

.tool-card-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0 0 1.5rem 0;
}

.tool-card-pillars {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.pillar-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

.pillar-icons-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.pillar-icon-link {
  display: inline-flex;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.pillar-icon-link:hover {
  opacity: 0.7;
}

/* Lighten tool cards in dark mode */
.dark .tool-card {
  background-color: var(--vp-c-bg-soft) !important;
}

/* Spacing between sponsor and vendor grids */
.partner-group-spacing {
  margin-top: 3rem;
}

/* User Stories Section */
.user-story-card {
  padding: 2rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Two-column layout on desktop */
@media (min-width: 768px) {
  .user-story-card {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

.user-story-question {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
  line-height: 1.4;
}

.user-story-answer {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* Lighten user story cards in dark mode */
.dark .user-story-card {
  background-color: var(--vp-c-bg-soft) !important;
}

/* Get Started Cards */
.get-started-card {
  display: block;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  transition: border-color 0.2s ease;
}

.get-started-card:hover {
  border-color: var(--vp-c-brand-1);
}

.get-started-card .card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  color: var(--vp-c-brand-1);
}

.get-started-card .card-header h3 {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  color: var(--vp-c-text-1) !important;
  line-height: 1 !important;
}

.get-started-card .card-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2) !important;
  margin: 0;
}

/* Lighten get started cards in dark mode */
.dark .get-started-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
