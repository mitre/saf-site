---
title: Heimdall - Security Visualization Platform
layout: doc
aside: false
---

<script setup>
import { BarChart3, Database, GitBranch, Download } from 'lucide-vue-next'

const deploymentOptions = [
  {
    name: 'Heimdall Lite',
    description: 'Client-side visualization tool that runs entirely in your browser. No server required - upload HDF files directly for instant visualization. Perfect for individual security analysts or quick compliance checks.',
    links: [
      { label: 'Try Heimdall Lite', href: 'https://heimdall-lite.mitre.org' },
      { label: 'View Source', href: 'https://github.com/mitre/heimdall-lite' }
    ]
  },
  {
    name: 'Heimdall Server',
    description: 'Full-featured server application with database backend. Store results centrally, enable team collaboration, track compliance over time, and integrate with CI/CD pipelines. Ideal for enterprise security teams.',
    links: [
      { label: 'Try Demo', href: 'https://heimdall-demo.mitre.org' },
      { label: 'View Source', href: 'https://github.com/mitre/heimdall2' },
      { label: 'Documentation', href: 'https://github.com/mitre/heimdall2/wiki' }
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
  },
  {
    title: 'Try the Demo',
    description: 'Explore Heimdall\'s features with sample security validation data.',
    href: 'https://heimdall-demo.mitre.org'
  }
]
</script>

<PageSection
  orientation="vertical"
  headline="SAF Apps"
  title="Heimdall"
  description="Heimdall is MITRE SAF's security data visualization and analysis platform. Upload security validation results in Heimdall Data Format (HDF), view interactive compliance dashboards, compare results across systems and time periods, and generate comprehensive reports for stakeholders."
  :links="[
    { label: 'Try Demo', href: 'https://heimdall-demo.mitre.org', variant: 'default', external: true },
    { label: 'View on GitHub', href: 'https://github.com/mitre/heimdall2', variant: 'outline', external: true }
  ]"
/>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Capabilities"
  title="Comprehensive Security Visualization"
  description="Heimdall transforms complex security data into actionable insights through interactive dashboards, detailed reports, and powerful comparison tools."
>
  <FeatureList
    :items="[
      {
        icon: BarChart3,
        title: 'Interactive Dashboards',
        description: 'Visualize security compliance across your entire infrastructure. View pass/fail statistics, severity breakdowns, and control family compliance at a glance. Filter and drill down to focus on specific systems, frameworks, or time periods.'
      },
      {
        icon: Database,
        title: 'Centralized Data Storage',
        description: 'Store all security validation results in a centralized database. Track compliance history over time, compare baseline results against current scans, and maintain a complete audit trail of security testing activities.'
      },
      {
        icon: GitBranch,
        title: 'Comparison & Trending',
        description: 'Compare security results between systems, time periods, or validation runs. Identify improvements and regressions, track remediation progress, and demonstrate continuous improvement to stakeholders and auditors.'
      },
      {
        icon: Download,
        title: 'Report Generation',
        description: 'Export comprehensive reports in multiple formats. Generate PDF reports for executives, CSV exports for analysis, or compliance evidence packages for auditors. Share results with stakeholders in the format they need.'
      }
    ]"
    gap="lg"
  />
</PageSection>

<!-- TODO: Add screenshot section - Dashboard View -->
<PageSection
  orientation="horizontal"
  headline="Dashboard View"
  title="Compliance at a Glance"
  description="The Heimdall dashboard provides an immediate view of security posture across your infrastructure. View overall compliance percentages, see which systems need attention, and drill down into specific failures for detailed remediation guidance."
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: Heimdall dashboard showing overall compliance statistics</p>
  </div>
</PageSection>

<!-- TODO: Add screenshot section - Detailed Results -->
<PageSection
  variant="muted"
  orientation="horizontal"
  :reverse="true"
  headline="Detailed Analysis"
  title="Drill Down Into Failures"
  description="Click into any failed control to see detailed information including the test code, actual vs. expected results, and remediation guidance. Export specific control failures to share with development teams for quick resolution."
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: Detailed control failure view with remediation information</p>
  </div>
</PageSection>

<!-- TODO: Add screenshot section - Comparison View -->
<PageSection
  orientation="horizontal"
  headline="Comparison Tools"
  title="Track Changes Over Time"
  description="Compare validation results between different time periods, systems, or baseline runs. Quickly identify which controls have improved, which have regressed, and what new issues have been introduced since the last scan."
>
  <div class="screenshot-placeholder">
    <p class="text-sm text-[--vp-c-text-2]">Screenshot: Side-by-side comparison of two validation runs</p>
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Get Started"
  title="Deployment Options"
  description="Choose the deployment option that works best for your organization's security and collaboration requirements."
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div v-for="option in deploymentOptions" :key="option.name" class="deployment-card block p-6 bg-card rounded-lg border border-border">
      <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-3">{{ option.name }}</h3>
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
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a v-for="resource in resources" :key="resource.title" :href="resource.href" target="_blank" rel="noopener noreferrer" class="resource-card block p-6 bg-card rounded-lg border border-border hover:border-[--vp-c-brand-1] transition-colors">
      <h3 class="text-base font-semibold text-[--vp-c-text-1] mb-2">{{ resource.title }}</h3>
      <p class="text-sm text-[--vp-c-text-2]">{{ resource.description }}</p>
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
  text-decoration: none !important;
}

/* Lighten cards in dark mode for better contrast */
.dark .deployment-card,
.dark .resource-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
