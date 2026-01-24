<script setup lang="ts">
import PageSection from './PageSection.vue'
import Placeholder from './Placeholder.vue'
import FeatureList from './FeatureList.vue'
import { Shield, FileCode, CheckCircle } from 'lucide-vue-next'

const features = [
  { icon: Shield, title: 'Feature One', description: 'Description of the first feature' },
  { icon: FileCode, title: 'Feature Two', description: 'Description of the second feature' },
  { icon: CheckCircle, title: 'Feature Three', description: 'Description of the third feature' },
]

const links = [
  { label: 'Get Started', href: '#' },
  { label: 'Learn More', href: '#', variant: 'outline' as const },
]
</script>

<template>
  <Story title="Layout/PageSection" :layout="{ type: 'single', iframe: true }">
    <Variant title="Vertical (Default)">
      <PageSection
        headline="Headline"
        title="Vertical Layout"
        description="This is a basic vertical layout. Content stacks in a single column."
        :links="[{ label: 'Action', href: '#' }]"
      />
    </Variant>

    <Variant title="Horizontal">
      <PageSection
        orientation="horizontal"
        headline="Horizontal"
        title="Two-Column Layout"
        description="Content appears side-by-side on desktop, stacks on mobile."
        :links="links"
      >
        <Placeholder height="200px" label="Visual Content" />
      </PageSection>
    </Variant>

    <Variant title="Horizontal Reversed">
      <PageSection
        orientation="horizontal"
        :reverse="true"
        title="Reversed Layout"
        description="The reverse prop swaps the order of content and visual columns."
        :links="[{ label: 'Learn More', href: '#' }]"
      >
        <Placeholder height="200px" label="Image or Video" />
      </PageSection>
    </Variant>

    <Variant title="Muted Background">
      <PageSection
        variant="muted"
        orientation="horizontal"
        title="Muted Variant"
        description="The muted variant adds a subtle background color."
        :links="links"
      >
        <Placeholder height="200px" label="Content" />
      </PageSection>
    </Variant>

    <Variant title="With Feature List">
      <PageSection
        orientation="horizontal"
        :reverse="true"
        title="With Body Slot"
        description="Use the body slot to add content like feature lists."
      >
        <template #body>
          <FeatureList :items="features" gap="sm" />
        </template>
        <Placeholder height="250px" label="Visual" />
      </PageSection>
    </Variant>

    <Variant title="Align Start">
      <PageSection
        orientation="horizontal"
        align="start"
        title="Top Aligned"
        description="Content aligns to the top."
        :links="[{ label: 'Action', href: '#' }]"
      >
        <Placeholder height="300px" label="Tall Visual" />
      </PageSection>
    </Variant>
  </Story>
</template>
