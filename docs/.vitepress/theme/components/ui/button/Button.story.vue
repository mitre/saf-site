<script setup lang="ts">
import { Button } from '.'
import { Mail, Loader2, ChevronRight } from 'lucide-vue-next'
</script>

<template>
  <Story title="shadcn-vue/Button" :layout="{ type: 'grid', width: 200 }">
    <Variant title="Default">
      <Button>Button</Button>
    </Variant>

    <Variant title="Secondary">
      <Button variant="secondary">Secondary</Button>
    </Variant>

    <Variant title="Outline">
      <Button variant="outline">Outline</Button>
    </Variant>

    <Variant title="Ghost">
      <Button variant="ghost">Ghost</Button>
    </Variant>

    <Variant title="Link">
      <Button variant="link">Link</Button>
    </Variant>

    <Variant title="Destructive">
      <Button variant="destructive">Destructive</Button>
    </Variant>

    <Variant title="With Icon">
      <Button>
        <Mail class="mr-2 h-4 w-4" /> Login with Email
      </Button>
    </Variant>

    <Variant title="Icon Only">
      <Button size="icon">
        <ChevronRight class="h-4 w-4" />
      </Button>
    </Variant>

    <Variant title="Loading">
      <Button disabled>
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Please wait
      </Button>
    </Variant>

    <Variant title="As Link">
      <Button as="a" href="#">Link Button</Button>
    </Variant>

    <Variant title="Small">
      <Button size="sm">Small</Button>
    </Variant>

    <Variant title="Large">
      <Button size="lg">Large</Button>
    </Variant>
  </Story>
</template>
