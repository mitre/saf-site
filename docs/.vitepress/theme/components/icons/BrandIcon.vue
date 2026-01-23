<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  name: string
  size?: number | string
}>()

// Local SVG files in /public/icons/
const localSvgMap: Record<string, string> = {
  'inspec': '/icons/inspec.svg',
  'mitre': '/icons/mitre.svg',
  'the mitre corporation': '/icons/mitre.svg',
  'mitre saf team': '/icons/saf-logo.svg',
  'mitre saf': '/icons/saf-logo.svg',
  'saf': '/icons/saf-logo.svg',
  'heimdall': '/icons/heimdall.svg',
}

// Map names to Iconify icon names
// Simple Icons: https://icon-sets.iconify.design/simple-icons/
// Lucide: https://icon-sets.iconify.design/lucide/
const iconMap: Record<string, string> = {
  // Technologies
  'ansible': 'simple-icons:ansible',
  'chef': 'simple-icons:chef',
  'terraform': 'simple-icons:terraform',
  'puppet': 'simple-icons:puppet',
  'powershell': 'simple-icons:powershell',
  'test-kitchen': 'simple-icons:chef',

  // Cloud & Platforms
  'amazon web services': 'simple-icons:amazonwebservices',
  'aws': 'simple-icons:amazonwebservices',
  'google cloud platform': 'simple-icons:googlecloud',
  'google': 'simple-icons:googlecloud',
  'gcp': 'simple-icons:googlecloud',
  'microsoft azure': 'simple-icons:microsoftazure',
  'azure': 'simple-icons:microsoftazure',

  // Vendors & Organizations
  'vmware': 'simple-icons:vmware',
  'red hat': 'simple-icons:redhat',
  'redhat': 'simple-icons:redhat',
  'canonical': 'simple-icons:ubuntu',
  'ubuntu': 'simple-icons:ubuntu',
  'docker': 'simple-icons:docker',
  'kubernetes': 'simple-icons:kubernetes',
  'github': 'simple-icons:github',
  'oracle': 'simple-icons:oracle',
  'apache': 'simple-icons:apache',
  'nginx': 'simple-icons:nginx',
  'mongodb': 'simple-icons:mongodb',
  'postgresql': 'simple-icons:postgresql',
  'mysql': 'simple-icons:mysql',
  'microsoft': 'simple-icons:microsoft',
  'windows': 'simple-icons:windows',

  // Organizations (MITRE handled by localSvgMap)
  'disa': 'lucide:shield',
  'cis': 'lucide:shield',

  // Standards
  'stig': 'lucide:file-check',
  'disa stig': 'lucide:file-check',
  'cis benchmarks': 'lucide:clipboard-check',
  'cis benchmark': 'lucide:clipboard-check',
  'pci-dss': 'lucide:credit-card',
  'nist': 'lucide:landmark',
}

// Check for local SVG first
const localSvg = computed(() => {
  const key = props.name.toLowerCase()
  if (localSvgMap[key]) return localSvgMap[key]
  for (const [name, path] of Object.entries(localSvgMap)) {
    if (key.includes(name) || name.includes(key)) {
      return path
    }
  }
  return null
})

const iconName = computed(() => {
  if (localSvg.value) return null // Use local SVG instead
  const key = props.name.toLowerCase()
  // Try exact match first
  if (iconMap[key]) return iconMap[key]
  // Try partial match
  for (const [name, icon] of Object.entries(iconMap)) {
    if (key.includes(name) || name.includes(key)) {
      return icon
    }
  }
  return null
})

const iconSize = computed(() => props.size || 24)
</script>

<template>
  <img
    v-if="localSvg"
    :src="localSvg"
    :width="iconSize"
    :height="iconSize"
    class="brand-icon brand-icon-local"
    :alt="name"
  />
  <Icon
    v-else-if="iconName"
    :icon="iconName"
    :width="iconSize"
    :height="iconSize"
    class="brand-icon"
  />
  <span v-else class="brand-icon-fallback">
    <Icon icon="lucide:box" :width="iconSize" :height="iconSize" />
  </span>
</template>

<style scoped>
.brand-icon {
  flex-shrink: 0;
}

.brand-icon-fallback {
  opacity: 0.5;
}
</style>
