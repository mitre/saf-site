---
title: Normalize
layout: doc
aside: false
wideLayout: true
---

<script setup>
import { RefreshCw, ArrowLeftRight, Database, GitCompare, TrendingUp, CheckCircle, Handshake, ListCheck } from 'lucide-vue-next'
import PillarIcon from '../.vitepress/theme/components/icons/PillarIcon.vue'

const normalizeTools = [
  { name: 'SAF CLI', href: '/apps/' }
]

const toolCategories = [
  {
    title: 'Vulnerability Scanners',
    tools: ['Nessus (.nessus XML)', 'Tenable.io (API)', 'Qualys (XML)', 'OpenSCAP (XCCDF)', 'Anchore (JSON)']
  },
  {
    title: 'Code Analysis',
    tools: ['SonarQube (API)', 'Fortify (FPR)', 'Checkmarx (XML)', 'Snyk (JSON)', 'OWASP ZAP (JSON/XML)']
  },
  {
    title: 'Cloud Security',
    tools: ['AWS Config (JSON)', 'Prowler (JSON/CSV)', 'ScoutSuite (JSON)', 'CloudSploit (JSON)', 'Prisma Cloud (CSV)']
  },
  {
    title: 'Compliance Tools',
    tools: ['Chef InSpec (JSON)', 'SCAP (XCCDF)', 'Burp Suite (XML)', 'Nikto (XML)', 'Metasploit (XML)']
  },
  {
    title: 'Container Security',
    tools: ['Trivy (JSON)', 'Anchore Engine (JSON)', 'Clair (JSON)', 'Twistlock (JSON)', 'Aqua Security (JSON)']
  },
  {
    title: 'Other Tools',
    tools: ['JFrog Xray (JSON)', 'SARIF (JSON)', 'DBProtect (Check Files)', 'ASFFResults (JSON)', 'Splunk (HEC)']
  }
]
</script>

<PageSection
  orientation="horizontal"
  headline="SAF Framework"
  description="Security tools speak different languages. Nessus outputs XML, SonarQube produces JSON, SCAP tools generate XCCDF results - each with different schemas and structures. The Normalize phase of the MITRE SAF(tm) converts security scan results from dozens of different tools into a common format, enabling unified analysis, comparison, and visualization across your entire security toolchain."
  :links="[
    { label: 'View SAF CLI', href: '/apps/', variant: 'default' },
    { label: 'View Framework', href: '/framework/', variant: 'outline' }
  ]"
>
  <template #title>
    <span class="framework-page-title">
      <PillarIcon pillar="normalize" :size="36" class="framework-mobile-icon" />
      Normalize
    </span>
  </template>

  <div class="framework-desktop-icon">
    <PillarIcon pillar="normalize" :size="280" />
  </div>
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="The Problem"
  title="Security Tool Data Fragmentation"
  description="Proper secure software development has many facets. Organizations need to cover all the bases - vulnerability scanning, static and dynamic code analysis (SAST/DAST), configuration management and validation, Software Bill of Materials (SBOM) generation, penetration testing, and more. While today's vibrant cybersecurity tooling landscape gives solutions to each of these problems, each tool tends to produce results in its own proprietary format. Without normalization, security teams waste countless hours manually correlating data, building custom integrations, and maintaining fragile parsing scripts that break with every tool update."
/>

<PageSection
  orientation="vertical"
  headline="The Solution"
  title="Heimdall Data Format (HDF)"
  description="MITRE SAF(tm) uses the Heimdall Data Format (HDF) as the common language for security data. HDF is a standardized JSON schema that represents security findings in a consistent structure, regardless of the source tool. The SAF CLI provides converters that transform outputs from popular security tools into HDF, enabling unified analysis and visualization."
>
  <FeatureList
    :items="[
      {
        icon: RefreshCw,
        title: 'Unified Schema',
        description: 'HDF provides a consistent structure for representing security controls, test results, severity levels, and remediation guidance. Whether the source is InSpec, Nessus, or SonarQube, the normalized output follows the same schema.'
      },
      {
        icon: ArrowLeftRight,
        title: 'Bi-directional Conversion',
        description: 'The SAF toolset converts security tool outputs into HDF for analysis, and can also export HDF data back into formats like CSV, XLSX, or tool-specific formats for integration with existing workflows and reporting systems.'
      },
      {
        icon: Database,
        title: 'Comprehensive Coverage',
        description: 'HDF supports conversion from 20+ security tools including vulnerability scanners (Nessus, Tenable.io), code analyzers (SonarQube, Fortify), cloud security (AWS Config, Prowler), compliance tools (SCAP, Chef InSpec), and more.'
      },
      {
        icon: GitCompare,
        title: 'Compare results',
        description: 'Analyze security findings across different tools and timeframes. Track how your security posture changes over time and identify trends in vulnerabilities discovered by different scanning tools.'
      },
      {
        icon: ListCheck,
        title: 'Aggregate findings',
        description: 'Consolidate security data from multiple sources into a unified security dashboard. View all vulnerabilities, compliance issues, and security findings in one place regardless of which tool discovered them.'
      },
      {
        icon: TrendingUp,
        title: 'Track remediation',
        description: 'Monitor security issue resolution consistently across all tools. Measure progress on fixing vulnerabilities and demonstrate that security issues are being addressed in a timely manner.'
      },
      {
        icon: CheckCircle,
        title: 'Demonstrate compliance',
        description: 'Prove compliance using evidence from multiple security testing sources. Show auditors and stakeholders comprehensive security validation results from your entire toolchain in a unified format.'
      },
      {
        icon: Handshake,
        title: 'Community Driven',
        description: 'Have a data format you want HDF to support that you don\'t see on the list? Contact us about it, or take a look at our training class for converter development and contribute your own converter to the open-source project on GitHub!'
      }
    ]"
    gap="lg"
  />
</PageSection>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Supported Tools"
  title="Convert From Any Security Tool"
  description="SAF CLI provides converters for a wide range of security tools across different categories. Each converter transforms the tool's native output format into HDF, enabling unified analysis in Heimdall."
>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div v-for="category in toolCategories" :key="category.title" class="tool-card block p-6 bg-card rounded-lg border border-border">
      <h3 class="text-lg font-semibold text-[--vp-c-text-1] mb-3">{{ category.title }}</h3>
      <ul class="space-y-2 text-sm text-[--vp-c-text-2] list-disc pl-4">
        <li v-for="tool in category.tools" :key="tool">{{ tool }}</li>
      </ul>
    </div>
  </div>

  <div class="mt-8">
    <LogoMarquee
      :items="[
        { name: 'AWS', href: 'https://aws.amazon.com/', description: 'Amazon Web Services - Cloud computing platform' },
        { name: 'Docker', href: 'https://www.docker.com/', description: 'Docker - Container platform' },
        { name: 'InSpec', href: 'https://www.inspec.io/', description: 'Chef InSpec - Compliance and security testing framework' },
        { name: 'JFrog', href: 'https://jfrog.com/', description: 'JFrog Xray - Universal artifact analysis' },
        { name: 'Kubernetes', href: 'https://kubernetes.io/', description: 'Kubernetes - Container orchestration' },
        { name: 'Nessus', href: 'https://www.tenable.com/products/nessus', description: 'Nessus - Vulnerability scanner' },
        { name: 'OWASP', href: 'https://owasp.org/', description: 'OWASP - Open Web Application Security Project' },
        { name: 'Prisma', href: 'https://www.paloaltonetworks.com/prisma/cloud', description: 'Prisma Cloud - Cloud security platform' },
        { name: 'Snyk', href: 'https://snyk.io/', description: 'Snyk - Developer security platform' },
        { name: 'SonarQube', href: 'https://www.sonarsource.com/products/sonarqube/', description: 'SonarQube - Code quality and security' },
        { name: 'Splunk', href: 'https://www.splunk.com/', description: 'Splunk - Data analytics platform' },
        { name: 'Trivy', href: 'https://trivy.dev/', description: 'Trivy - Container vulnerability scanner' }
      ]"
      :size="80"
      :rows="1"
      :duration="30"
    />
  </div>
</PageSection>

<PageSection
  orientation="horizontal"
  headline="Tools"
  title="Normalize with SAF CLI"
  description="Use the SAF CLI to convert security tool outputs into HDF and export results for reporting."
>
  <template #body>
    <FeatureList
      :items="[
        {
          title: 'SAF CLI Converters',
          description: 'Convert security scan results from 20+ tools into Heimdall Data Format (HDF) using a simple command-line interface. Batch convert multiple files, automate in CI/CD pipelines, or integrate into existing security workflows.',
          href: '/apps/'
        },
        {
          title: 'Export Options',
          description: 'Export HDF results into multiple formats for reporting and integration. Generate CSV spreadsheets for executives, XLSX workbooks for auditors, or CKL files for STIG compliance reporting. Share data with stakeholders in the format they need.',
          href: '/apps/'
        }
      ]"
      gap="lg"
    />
  </template>

  <LogoGrid :items="normalizeTools" :size="56" :showNames="true" variant="card" :columns="1" />
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

/* Lighten tool cards in dark mode for better contrast */
.dark .tool-card {
  background-color: var(--vp-c-bg-soft) !important;
}
</style>
