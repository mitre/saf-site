<script setup lang="ts">
/**
 * @component Button - Versatile button component from shadcn-vue.
 * Supports multiple variants (default, secondary, outline, ghost, link, destructive)
 * and sizes (default, sm, lg, icon). Can render as any element via `as` prop.
 *
 * @example Primary action button
 * <Button>Get Started</Button>
 *
 * @example Secondary with icon
 * <Button variant="secondary">
 *   <Mail class="mr-2 h-4 w-4" />
 *   Contact Us
 * </Button>
 *
 * @example As link element
 * <Button as="a" href="/docs" variant="outline">
 *   Documentation
 * </Button>
 *
 * @example Icon-only button
 * <Button size="icon" variant="ghost">
 *   <ChevronRight class="h-4 w-4" />
 * </Button>
 *
 * @see https://www.shadcn-vue.com/docs/components/button
 */
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '.'

interface Props extends PrimitiveProps {
  /** Visual style variant */
  variant?: ButtonVariants['variant']
  /** Button size */
  size?: ButtonVariants['size']
  /** Additional CSS classes */
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
