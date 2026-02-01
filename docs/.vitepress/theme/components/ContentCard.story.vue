<script setup lang="ts">
import ContentCard from './ContentCard.vue'

const sampleValidation = {
  id: '1',
  slug: 'rhel-8-stig',
  name: 'Red Hat Enterprise Linux 8 STIG',
  description: 'InSpec validation profile for RHEL 8 based on DISA STIG requirements for security compliance.',
  content_type: 'validation' as const,
  target_name: 'Red Hat Enterprise Linux 8',
  standard_name: 'DISA STIG',
  standard_short_name: 'STIG',
  technology_name: 'InSpec',
  version: '1.12.0',
  status: 'released',
}

const sampleHardening = {
  id: '2',
  slug: 'nginx-hardening',
  name: 'NGINX Hardening Cookbook',
  description: 'Chef cookbook to harden NGINX web server configuration following security best practices.',
  content_type: 'hardening' as const,
  target_name: 'NGINX',
  standard_name: 'DevSec Hardening Framework',
  standard_short_name: 'DevSec',
  technology_name: 'Chef',
  version: '3.1.0',
  status: 'released',
}

const sampleDevelopment = {
  id: '3',
  slug: 'k8s-stig-dev',
  name: 'Kubernetes STIG (Development)',
  description: 'InSpec profile for Kubernetes security validation based on upcoming STIG requirements.',
  content_type: 'validation' as const,
  target_name: 'Kubernetes 1.27',
  standard_name: 'DISA STIG',
  standard_short_name: 'STIG',
  technology_name: 'InSpec',
  version: '0.5.0',
  status: 'development',
}
</script>

<template>
  <Story title="Content/ContentCard">
    <Variant title="Validation Profile">
      <div class="max-w-md">
        <ContentCard :content="sampleValidation" />
      </div>
    </Variant>

    <Variant title="Hardening Content">
      <div class="max-w-md">
        <ContentCard :content="sampleHardening" />
      </div>
    </Variant>

    <Variant title="Development Status">
      <div class="max-w-md">
        <ContentCard :content="sampleDevelopment" />
      </div>
    </Variant>

    <Variant title="Grid Layout">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ContentCard :content="sampleValidation" />
        <ContentCard :content="sampleHardening" />
        <ContentCard :content="sampleDevelopment" />
      </div>
    </Variant>
  </Story>
</template>

<docs lang="md">
# ContentCard

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `ContentItem` | `-` |  **(required)** |

## Types

```typescript
export interface ContentItem {
  id: string
  slug: string
  name: string
  description?: string
  content_type: 'validation' | 'hardening'
  target_name?: string
  standard_name?: string
  standard_short_name?: string
  technology_name?: string
  version?: string
  status?: string
}
```
</docs>
