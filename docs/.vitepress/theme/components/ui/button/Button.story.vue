<script setup lang="ts">
import { ChevronRight, Loader2, Mail } from 'lucide-vue-next'
import { Button } from '.'
</script>

<template>
  <Story title="shadcn-vue/Button" :layout="{ type: 'grid', width: 200 }">
    <Variant title="Default">
      <Button>Button</Button>
    </Variant>

    <Variant title="Secondary">
      <Button variant="secondary">
        Secondary
      </Button>
    </Variant>

    <Variant title="Outline">
      <Button variant="outline">
        Outline
      </Button>
    </Variant>

    <Variant title="Ghost">
      <Button variant="ghost">
        Ghost
      </Button>
    </Variant>

    <Variant title="Link">
      <Button variant="link">
        Link
      </Button>
    </Variant>

    <Variant title="Destructive">
      <Button variant="destructive">
        Destructive
      </Button>
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
      <Button as="a" href="#">
        Link Button
      </Button>
    </Variant>

    <Variant title="Small">
      <Button size="sm">
        Small
      </Button>
    </Variant>

    <Variant title="Large">
      <Button size="lg">
        Large
      </Button>
    </Variant>
  </Story>
</template>

<docs lang="md">
# Button

Button - Versatile button component from shadcn-vue. Supports multiple variants (default, secondary, outline, ghost, link, destructive) and sizes (default, sm, lg, icon). Can render as any element via `as` prop.

## Usage

```vue
Primary action button
<Button>Get Started</Button>
```

```vue
Secondary with icon
<Button variant="secondary">
<Mail class="mr-2 h-4 w-4" />
Contact Us
</Button>
```

```vue
As link element
<Button as="a" href="/docs" variant="outline">
Documentation
</Button>
```

```vue
Icon-only button
<Button size="icon" variant="ghost">
<ChevronRight class="h-4 w-4" />
</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `TSIndexedAccessType` | `-` | Visual style variant |
| `size` | `TSIndexedAccessType` | `-` | Button size |
| `class` | `TSIndexedAccessType` | `-` | Additional CSS classes |
| `as` | `any` | `'button'` |  |

## Slots

| Slot | Description |
|------|-------------|
| `default` |  |

## Notes

**@see**: https://www.shadcn-vue.com/docs/components/button

</docs>
