<script setup lang="ts">
import LogoMarquee from './LogoMarquee.vue'

const tools = [
  { name: 'SonarQube' },
  { name: 'Burp Suite' },
  { name: 'OWASP ZAP' },
  { name: 'Nessus' },
  { name: 'Qualys' },
  { name: 'Snyk' },
  { name: 'Veracode' },
  { name: 'Checkmarx' },
  { name: 'Fortify' },
  { name: 'Prisma Cloud' },
  { name: 'AWS' },
  { name: 'Trivy' },
  { name: 'Grype' },
  { name: 'Anchore' },
  { name: 'Splunk' },
]

const techPartners = [
  { name: 'AWS' },
  { name: 'GitHub' },
  { name: 'Red Hat' },
  { name: 'Docker' },
  { name: 'Kubernetes' },
]
</script>

<template>
  <Story title="Display/LogoMarquee" :layout="{ type: 'single', iframe: true }">
    <Variant title="Default (Single Row)">
      <div style="width: 100%; min-width: 600px;">
        <LogoMarquee :items="techPartners" />
      </div>
    </Variant>

    <Variant title="Multi-Row (2)">
      <LogoMarquee :items="tools" :rows="2" :duration="25" />
    </Variant>

    <Variant title="Multi-Row (3)">
      <LogoMarquee :items="tools" :rows="3" :size="32" :duration="20" />
    </Variant>

    <Variant title="Reversed Direction">
      <LogoMarquee :items="techPartners" :reverse="true" />
    </Variant>

    <Variant title="No Overlay">
      <LogoMarquee :items="techPartners" :overlay="false" />
    </Variant>

    <Variant title="Same Direction (No Alternating)">
      <LogoMarquee :items="tools" :rows="2" :alternateDirection="false" />
    </Variant>

    <Variant title="Fast (10s)">
      <LogoMarquee :items="techPartners" :duration="10" />
    </Variant>

    <Variant title="Slow (60s)">
      <LogoMarquee :items="techPartners" :duration="60" />
    </Variant>
  </Story>
</template>
