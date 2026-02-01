---
title: Harden
layout: doc
aside: false
---

<script setup>
import { Wrench, Shield, Spool } from 'lucide-vue-next'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'

const hardenTools = [
  { name: 'Ansible', href: '/content/?technology=Ansible' },
  { name: 'Chef', href: '/content/?technology=Chef' },
  { name: 'Terraform', href: '/content/?technology=Terraform' },
  { name: 'Puppet', href: '/content/?technology=Puppet' },
  { name: 'PowerShell', href: '/content/?technology=PowerShell' },
  { name: 'Salt', href: '/content/?technology=Salt' }
]
</script>

<PageSection
  orientation="horizontal"
  headline="SAF Framework"
  description="Have you ever wished you could automate your way out of a thankless security configuration task, but didn't have the time to invest to do it right? MITRE SAF's(tm) hardening pillar helps you apply security configurations and controls to your systems using automated hardening content, paired with the same configuration management tools and processes your team is likely already familiar with. Transform compliance requirements into actionable remediation with Infrastructure as Code."
  :links="[
    { label: 'Browse Hardening Content', href: '/content/', variant: 'default' },
    { label: 'View Framework', href: '/framework/', variant: 'outline' }
  ]"
>
  <template #title>
    <span class="framework-page-title">
      <PillarIcon pillar="harden" :size="36" class="framework-mobile-icon" />
      Harden
    </span>
  </template>

  <div class="framework-desktop-icon">
    <PillarIcon pillar="harden" :size="280" />
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Use Cases"
  title="Don't Re-invent the Wheel"
  description="The Harden pillar supports both proactive system hardening and automated remediation workflows. Apply security baselines before deployment to get secure systems straight off the assembly line, or use automated remediation to fix non-compliant systems discovered during validation. Whether you're building your gold images or remediating production systems, Harden provides Infrastructure as Code implementations of security requirements, without your team having to spend cycles addressing problems that have already been solved in the open-source security community."
>
  <FeatureList
    :items="[
      {
        icon: Shield,
        title: 'Baseline Hardening',
        description: 'Apply security configurations before systems go into production. Use Ansible playbooks, Chef recipes, or Puppet manifests to implement STIGs and CIS Benchmarks as code. Build systems that are secure by default, reducing the attack surface before deployment.'
      },
      {
        icon: Wrench,
        title: 'Automated Remediation',
        description: 'Fix security findings discovered during validation scans. Convert compliance requirements into automated remediation workflows that bring systems into compliance. Reduce manual configuration effort and ensure consistent security posture across your infrastructure.'
      },
      {
        icon: Spool,
        title: 'Tailored Content',
        description: 'Avoid brittle hardening scripts. MITRE SAF(tm) Hardening content is easy to tailor to the particular needs of your organization, ensuring that your systems meet your security requirements. Add, remove, or adjust how hardening is done.'
      }
    ]"
    gap="lg"
  />
</PageSection>

<PageSection
  orientation="horizontal"
  headline="Tools"
  title="Harden with SAF Content"
  description="Use our hardening content library and tailor it to reflect your organization's secuity requirements."
>
  <template #body>
    <FeatureList
      :items="[
        {
          title: 'Hardening Content Library',
          description: 'Browse ready-to-use Ansible playbooks, Chef recipes, and other Infrastructure as Code implementations of security baselines. Apply proven hardening configurations to common platforms and applications.',
          href: '/content/'
        },
        {
          title: 'SAF CLI',
          description: 'Convert security guidance documents like XCCDF benchmarks into Ansible playbooks and other automation formats. Generate hardening content from security requirements using SAF CLI conversion tools.',
          href: '/apps/'
        }
      ]"
      gap="lg"
    />
  </template>

  <LogoGrid :items="hardenTools" :size="56" :showNames="true" variant="card" :columns="3" />
</PageSection>

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}

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
