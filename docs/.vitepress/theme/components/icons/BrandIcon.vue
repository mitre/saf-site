<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useData } from 'vitepress'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  size?: number | string
}>()

const { isDark } = useData()

// Local SVG files in /public/icons/
const localSvgMap: Record<string, string> = {
  'inspec': '/icons/inspec.svg',
  'mitre': '/icons/mitre-m.svg',
  'the mitre corporation': '/icons/mitre-m.svg',
  'mitre saf team': '/icons/saf-logo.svg',
  'mitre saf': '/icons/saf-logo.svg',
  'saf': '/icons/saf-logo.svg',
  'heimdall': '/icons/heimdall.svg',
}

// Wide logos that need height-only constraint (wordmarks)
const wideLogos = new Set<string>()

// Brand colors for Simple Icons (to override monochrome default)
const brandColors: Record<string, string> = {
  ansible: '#EE0000',
  aws: '#FF9900',
  amazonwebservices: '#FF9900',
  chef: '#F09820',
  docker: '#2496ED',
  github: '#181717',
  helm: '#0F1689',
  jfrog: '#41BF47',
  kubernetes: '#326CE5',
  mongodb: '#47A248',
  mysql: '#4479A1',
  nginx: '#009639',
  npm: '#CB3837',
  owasp: '#000000',
  postgresql: '#4169E1',
  prisma: '#2D3748',
  puppet: '#FFAE1A',
  snyk: '#4C4A73',
  sonarqube: '#4E9BCD',
  splunk: '#000000',
  terraform: '#7B42BC',
  trivy: '#1904DA',
  vmware: '#607078',
  nessus: '#00C176',
  tenable: '#00C176',
}

// Dark mode color variants for icons with dark colors
const brandColorsDark: Record<string, string> = {
  github: '#FFFFFF',
  owasp: '#FFFFFF',
  prisma: '#FFFFFF',
  snyk: '#A78BFA', // Lighter purple
  splunk: '#FFFFFF',
  vmware: '#E5E7EB',
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
  'helm': 'simple-icons:helm',
  'npm': 'simple-icons:npm',
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

  // Security Tools
  'snyk': 'simple-icons:snyk',
  'sonarqube': 'simple-icons:sonarqube',
  'splunk': 'simple-icons:splunk',
  'trivy': 'simple-icons:trivy',
  'owasp': 'simple-icons:owasp',
  'jfrog': 'simple-icons:jfrog',
  'jfrog xray': 'simple-icons:jfrog',
  'prisma': 'simple-icons:prisma',
  'prisma cloud': 'simple-icons:prisma',
  'nessus': 'file-icons:nessus',
  'tenable': 'file-icons:nessus',
}

// Check for local SVG first
const localSvg = computed(() => {
  const key = props.name.toLowerCase()
  if (localSvgMap[key])
    return localSvgMap[key]
  for (const [name, path] of Object.entries(localSvgMap)) {
    if (key.includes(name) || name.includes(key)) {
      return path
    }
  }
  return null
})

const iconName = computed(() => {
  if (localSvg.value)
    return null // Use local SVG instead
  const key = props.name.toLowerCase()
  // Try exact match first
  if (iconMap[key])
    return iconMap[key]
  // Try partial match
  for (const [name, icon] of Object.entries(iconMap)) {
    if (key.includes(name) || name.includes(key)) {
      return icon
    }
  }
  return null
})

const iconSize = computed(() => props.size || 24)

// Check if this is a wide logo (wordmark) that needs height-only sizing
const isWideLogo = computed(() => {
  const key = props.name.toLowerCase()
  return wideLogos.has(key)
})

// Get brand color for this icon
const brandColor = computed(() => {
  const key = props.name.toLowerCase()

  // Check if we should use dark mode colors
  const colorMap = isDark.value ? brandColorsDark : {}

  // Try dark mode color first if in dark mode
  if (isDark.value && colorMap[key])
    return colorMap[key]

  // Try to find dark mode color from iconMap
  if (isDark.value) {
    const icon = iconName.value
    if (icon && icon.startsWith('simple-icons:')) {
      const iconKey = icon.replace('simple-icons:', '')
      if (colorMap[iconKey])
        return colorMap[iconKey]
    }
  }

  // Fall back to regular brand colors
  if (brandColors[key])
    return brandColors[key]

  // Try to find icon name from iconMap and get its color
  const icon = iconName.value
  if (icon && icon.startsWith('simple-icons:')) {
    const iconKey = icon.replace('simple-icons:', '')
    if (brandColors[iconKey])
      return brandColors[iconKey]
  }

  return undefined
})
</script>

<template>
  <!-- Wide logos (wordmarks) - height only, width auto -->
  <img
    v-if="localSvg && isWideLogo"
    :src="localSvg"
    :height="iconSize"
    class="brand-icon brand-icon-local brand-icon-wide"
    :alt="name"
  >
  <!-- Square logos - fixed width and height -->
  <img
    v-else-if="localSvg"
    :src="localSvg"
    :width="iconSize"
    :height="iconSize"
    class="brand-icon brand-icon-local"
    :alt="name"
  >
  <Icon
    v-else-if="iconName"
    :icon="iconName"
    :width="iconSize"
    :height="iconSize"
    :style="brandColor ? { color: brandColor } : undefined"
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

.brand-icon-wide {
  width: auto;
}

.brand-icon-fallback {
  opacity: 0.5;
}
</style>
