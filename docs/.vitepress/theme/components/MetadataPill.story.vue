<script setup lang="ts">
import MetadataPill from './MetadataPill.vue'
</script>

<template>
  <Story title="Content/MetadataPill">
    <Variant title="Basic Pills">
      <div class="flex flex-wrap gap-2">
        <MetadataPill label="Tech" value="InSpec" />
        <MetadataPill label="Status" value="Released" />
        <MetadataPill label="Version" value="1.12.0" />
      </div>
    </Variant>

    <Variant title="With Icons (Brand)">
      <div class="flex flex-wrap gap-2">
        <MetadataPill label="Tech" value="InSpec" />
        <MetadataPill label="Tech" value="Ansible" />
        <MetadataPill label="Tech" value="Chef" />
        <MetadataPill label="Tech" value="Terraform" />
      </div>
    </Variant>

    <Variant title="With Links">
      <div class="flex flex-wrap gap-2">
        <MetadataPill label="Vendor" value="MITRE" href="/content/?vendor=MITRE" />
        <MetadataPill label="Standard" value="STIG" href="/content/?standard=STIG" />
        <MetadataPill label="Target" value="RHEL 8" href="/content/?target=RHEL%208" />
      </div>
    </Variant>

    <Variant title="Truncation">
      <div class="flex flex-col gap-3 max-w-sm">
        <p class="text-sm text-gray-600">
          No truncation:
        </p>
        <MetadataPill label="Description" value="Red Hat Enterprise Linux 8 Security Technical Implementation Guide" />

        <p class="text-sm text-gray-600 mt-4">
          With truncation (truncate=30):
        </p>
        <MetadataPill label="Description" value="Red Hat Enterprise Linux 8 Security Technical Implementation Guide" :truncate="30" />
      </div>
    </Variant>
  </Story>
</template>

<docs lang="md">
# MetadataPill

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `-` |  **(required)** |
| `value` | `string` | `-` |  **(required)** |
| `href` | `string` | `-` |  |
| `truncate` | `number` | `-` |  |
</docs>
