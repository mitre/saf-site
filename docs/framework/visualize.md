---
title: Visualize
layout: doc
aside: false
wideLayout: true
---

<script setup>
import { BarChart3, Users, TrendingUp, FileText } from 'lucide-vue-next'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'

const visualizeTools = [
  { name: 'MITRE Heimdall(tm)', href: '/apps/heimdall' }
]
</script>

<PageSection
  orientation="horizontal"
  headline="SAF Framework"
  description="Security data is only valuable when stakeholders can understand it and act on it. The Visualize phase of the MITRE SAF(tm) transforms security test results into clear, actionable insights through interactive dashboards and comprehensive reporting. Whether you're presenting to executives, collaborating with development teams, or preparing for audits, MITRE Heimdall(tm) provides the visualization tools to communicate security posture effectively."
  :links="[
    { label: 'View MITRE Heimdall(tm)', href: '/apps/heimdall', variant: 'default' },
    { label: 'View Framework', href: '/framework/', variant: 'outline' }
  ]"
>
  <template #title>
    <span class="framework-page-title">
      <PillarIcon pillar="visualize" :size="36" class="framework-mobile-icon" />
      Visualize
    </span>
  </template>

  <div class="framework-desktop-icon">
    <PillarIcon pillar="visualize" :size="280" />
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="The Problem"
  title="Security Data Overload"
  description="Security teams generate massive amounts of test data from validation runs across hundreds or thousands of systems. Raw, machine-friendly output from tools make it difficult for stakeholders to understand and prioritize security posture at a glance. Executives need summaries, developers need detailed failure information, and auditors need compliance evidence - but they're all looking at the same incomprehensible data dumps. Implementing a dashboard to properly track and aggregate all this data is a challenge."
/>

<PageSection
  orientation="vertical"
  headline="The Solution"
  title="MITRE Heimdall(tm) - Security Visualization Platform"
  description="MITRE Heimdall(tm) transforms MITRE Heimdall(tm) Data Format (HDF) security results (or, to put it another way, the output of the Normalize pillar) into interactive dashboards and comprehensive reports. Upload validation results from InSpec or any other security data source with an HDF converter; MITRE Heimdall(tm) will automatically translate it into HDF and store it in a centralized database. View aggregated compliance statistics across your entire infrastructure, drill down into specific failures, compare results over time, and export reports for stakeholders."
>
  <FeatureList
    :items="[
      {
        icon: BarChart3,
        title: 'Interactive Dashboards',
        description: 'Visualize security compliance across your entire infrastructure at a glance. See pass/fail statistics, severity breakdowns, and trending over time. Filter by system, compliance framework, or control family to focus on what matters most.'
      },
      {
        icon: Users,
        title: 'Multi-Stakeholder Views',
        description: 'Different audiences need different information. Executives see high-level compliance scores and risk trends. Developers see detailed failure descriptions with remediation guidance. Auditors see comprehensive evidence packages with all required documentation.'
      },
      {
        icon: TrendingUp,
        title: 'Compliance Trending',
        description: 'Track security posture improvements over time. Compare current results against baselines, identify emerging issues before they become critical, and demonstrate continuous improvement to stakeholders and auditors.'
      },
      {
        icon: FileText,
        title: 'Automated Reporting',
        description: 'Generate comprehensive reports in multiple formats. Export PDF reports for executives, detailed CSV exports for analysis, or compliance evidence packages for auditors. Schedule automated report generation and distribution.'
      }
    ]"
    gap="lg"
  />
</PageSection>

<PageSection
  orientation="horizontal"
  headline="Tools"
  title="Visualize with MITRE Heimdall(tm)"
  description="Use MITRE Heimdall(tm) to view, analyze, and report on security validation results across your infrastructure."
>
  <template #body>
    <FeatureList
      :items="[
        {
          title: 'MITRE Heimdall(tm) Dashboard',
          description: 'Web-based security visualization platform. Upload HDF results from InSpec validation runs, security scans converted by MITRE SAF CLI(tm), or any HDF-compliant source. View interactive dashboards, drill down into failures, compare results across systems and time periods, and export reports for stakeholders.',
          href: '/apps/heimdall'
        },
        {
          title: 'Report Generation',
          description: 'Generate comprehensive security reports in multiple formats. Export executive summaries, detailed technical reports, or compliance evidence packages. Schedule automated report generation and distribution to stakeholders via email or shared drives.',
          href: '/apps/heimdall'
        }
      ]"
      gap="lg"
    />
  </template>

  <LogoGrid :items="visualizeTools" :size="56" :showNames="true" variant="card" :columns="1" />
</PageSection>

<style>
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
