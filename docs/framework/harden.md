---
title: Harden - SAF Framework
layout: doc
aside: false
---

<script setup>
import { Wrench, Shield, Spool } from 'lucide-vue-next'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'

const hardenTools = [
  { name: 'Ansible', href: '/content/' },
  { name: 'Chef', href: '/content/' }
]
</script>

<PageSection
  orientation="horizontal"
  headline="SAF Framework"
  title="Harden"
  description="Have you ever wished you could automate your way out of a thankless security configuration task, but didn't have the time to invest to do it right? MITRE SAF's hardening pillar helps you apply security configurations and controls to your systems using automated hardening content, paired with the same configuration management tools and processes your team is likely already familiar with. Transform compliance requirements into actionable remediation with Infrastructure as Code."
  :links="[
    { label: 'Browse Hardening Content', href: '/content/', variant: 'default' },
    { label: 'View Framework', href: '/framework/', variant: 'outline' }
  ]"
>
  <div class="flex items-center justify-center" style="min-height: 300px;">
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
        description: 'Avoid brittle hardening scripts. MITRE SAF Hardening content is easy to tailor to the particular needs of your organization, ensuring that your systems meet your security requirements. Add, remove, or adjust how hardening is done.'
      }
    ]"
    gap="lg"
  />
</PageSection>

<PageSection
  orientation="horizontal"
  headline="Tools"
  title="Harden with SAF Tools"
  description="Use our hardening content library or convert security guidance into Infrastructure as Code with SAF CLI."
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

  <LogoGrid :items="hardenTools" :size="56" :showNames="true" variant="card" :columns="2" />
</PageSection>

<style>
.VPDoc .container {
  max-width: 1400px !important;
}
.VPDoc .content {
  max-width: none !important;
}
</style>
