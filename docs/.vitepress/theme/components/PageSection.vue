<script setup lang="ts">
/**
 * @component PageSection - Flexible two-column layout for feature/CTA sections.
 * Supports vertical (stacked) and horizontal (side-by-side) orientations,
 * with slots for content (text, links) and visuals (images, components).
 *
 * @example Vertical hero section
 * <PageSection
 *   headline="Security Automation"
 *   title="Validate your systems with InSpec"
 *   description="Run compliance checks against industry standards."
 *   :links="[{ label: 'Get Started', href: '/start' }]"
 * />
 *
 * @example Horizontal with visual slot
 * <PageSection
 *   orientation="horizontal"
 *   title="Supported Platforms"
 *   description="InSpec runs on any platform."
 * >
 *   <LogoGrid :items="platforms" />
 * </PageSection>
 *
 * @example Reversed layout with muted background
 * <PageSection
 *   orientation="horizontal"
 *   :reverse="true"
 *   variant="muted"
 *   title="Enterprise Ready"
 * >
 *   <img src="/enterprise.png" alt="Enterprise" />
 * </PageSection>
 */
import { computed, useSlots } from 'vue'
import { Button } from '@/components/ui/button'

export interface PageSectionLink {
  label: string
  href: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  external?: boolean
}

export interface PageSectionProps {
  /** Render as different element */
  as?: string
  /** Section ID for anchor links */
  id?: string
  /** Small text above title */
  headline?: string
  /** Main section title */
  title?: string
  /** Section description */
  description?: string
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal'
  /** Reverse content and visual order */
  reverse?: boolean
  /** Background variant */
  variant?: 'default' | 'muted' | 'dark'
  /** Array of link buttons */
  links?: PageSectionLink[]
  /** Vertical alignment of content and visual */
  align?: 'start' | 'center' | 'end'
  /** Constrain width */
  contained?: boolean
}

const props = withDefaults(defineProps<PageSectionProps>(), {
  as: 'section',
  orientation: 'vertical',
  reverse: false,
  variant: 'default',
  align: 'center',
  contained: true,
})

const slots = useSlots()

const hasContent = computed(() => {
  return props.headline
    || props.title
    || props.description
    || props.links?.length
    || slots.headline
    || slots.title
    || slots.description
    || slots.body
    || slots.footer
    || slots.links
})

const hasVisual = computed(() => !!slots.default)
</script>

<template>
  <component
    :is="as"
    :id="id"
    class="page-section"
    :class="[
      `page-section--${orientation}`,
      `page-section--${variant}`,
      `page-section--align-${align}`,
      {
        'page-section--reverse': reverse,
        'page-section--contained': contained,
      },
    ]"
  >
    <slot name="top" />

    <div class="page-section-container">
      <!-- Content side -->
      <div v-if="hasContent" class="page-section-content">
        <slot name="header">
          <div v-if="headline || $slots.headline" class="page-section-headline">
            <slot name="headline">
              {{ headline }}
            </slot>
          </div>

          <h2 v-if="title || $slots.title" class="page-section-title">
            <slot name="title">
              {{ title }}
            </slot>
          </h2>

          <div v-if="description || $slots.description" class="page-section-description">
            <slot name="description">
              {{ description }}
            </slot>
          </div>
        </slot>

        <div v-if="$slots.body" class="page-section-body">
          <slot name="body" />
        </div>

        <div v-if="$slots.footer || links?.length || $slots.links" class="page-section-footer">
          <slot name="footer">
            <div v-if="links?.length || $slots.links" class="page-section-links">
              <slot name="links">
                <Button
                  v-for="(link, index) in links"
                  :key="index"
                  as="a"
                  :href="link.href"
                  :target="link.external ? '_blank' : undefined"
                  :rel="link.external ? 'noopener noreferrer' : undefined"
                  :variant="link.variant || (index === 0 ? 'default' : 'outline')"
                  size="lg"
                >
                  {{ link.label }}
                </Button>
              </slot>
            </div>
          </slot>
        </div>
      </div>

      <!-- Visual side -->
      <div v-if="hasVisual" class="page-section-visual">
        <slot />
      </div>
    </div>

    <slot name="bottom" />
  </component>
</template>

<style scoped>
/* ===========================================
   MOBILE-FIRST RESPONSIVE STYLES
   Base styles are mobile, min-width for larger
   =========================================== */

.page-section {
  padding: 2rem 0;
}

.page-section--contained .page-section-container {
  max-width: var(--vp-layout-max-width, 1280px);
  margin: 0 auto;
  padding: 0 2rem;
}

/* Variant backgrounds */
.page-section--muted {
  background: var(--vp-c-bg-soft);
}

.page-section--dark {
  background: var(--vp-c-bg-alt);
}

/* ===========================================
   CONTAINER LAYOUT
   Mobile: flex column (stacked)
   Desktop: CSS Grid for horizontal
   =========================================== */

.page-section-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Reverse order on mobile when specified */
.page-section--reverse .page-section-container {
  flex-direction: column-reverse;
}

/* ===========================================
   CONTENT SIDE
   =========================================== */

.page-section-content {
  min-width: 0;
}

.page-section-headline {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.5rem;
}

.page-section-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
}

.page-section-description {
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.page-section-body {
  margin-bottom: 1.5rem;
}

.page-section-footer {
  margin-top: 0;
}

.page-section-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* ===========================================
   VISUAL SIDE
   Always visible, sizes to content on mobile
   =========================================== */

.page-section-visual {
  min-width: 0;
  width: 100%;
}

/* ===========================================
   TABLET (640px+)
   =========================================== */

@media (min-width: 640px) {
  .page-section {
    padding: 3rem 0;
  }

  .page-section--contained .page-section-container {
    padding: 0 2.5rem;
  }

  .page-section-container {
    gap: 2.5rem;
  }

  .page-section-title {
    font-size: 2rem;
  }

  .page-section-links {
    gap: 1rem;
  }
}

/* ===========================================
   DESKTOP (1024px+)
   Horizontal layout uses CSS Grid
   =========================================== */

@media (min-width: 1024px) {
  .page-section {
    padding: 4rem 0;
  }

  .page-section--contained .page-section-container {
    padding: 0 2rem;
  }

  /* Horizontal: switch to CSS Grid */
  .page-section--horizontal .page-section-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }

  /* Alignment for grid */
  .page-section--horizontal.page-section--align-start .page-section-container {
    align-items: start;
  }

  .page-section--horizontal.page-section--align-center .page-section-container {
    align-items: center;
  }

  .page-section--horizontal.page-section--align-end .page-section-container {
    align-items: end;
  }

  /* Reverse: swap column order */
  .page-section--horizontal.page-section--reverse .page-section-content {
    order: 2;
  }

  .page-section--horizontal.page-section--reverse .page-section-visual {
    order: 1;
  }

  .page-section-title {
    font-size: 2.5rem;
  }

  .page-section-description {
    font-size: 1.125rem;
  }
}
</style>
