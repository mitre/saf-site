<script setup lang="ts">
import type { PillarType } from './icons/PillarIcon.vue'
import { Github } from 'lucide-vue-next'
import { withBase } from 'vitepress'
import { computed } from 'vue'
import { smartScriptDeep } from '../../lib/smart-script'
import PillarIcon from './icons/PillarIcon.vue'

/**
 * @component SlickSheet
 *
 * One-page, print-first MITRE SAF overview. Rendered only by
 * docs/internal/slick-sheet.md, which never ships (see lib/internal-pages.ts).
 *
 * This component holds NO copy. Every string comes from that page's
 * frontmatter, so wording can be edited in one readable YAML block without
 * touching Vue. Strings pass through smartScriptDeep, letting authors type
 * `(tm)`/`(c)` as they do elsewhere on the site.
 *
 * Laid out for US Letter portrait. Sizes are in `pt` rather than `rem` because
 * the output is paper: points map 1:1 to what the PDF exporter emits, whereas
 * rem depends on a root font size the print stylesheet does not control.
 *
 * @example
 * <SlickSheet :copy="frontmatter.sheet" />
 */

export interface SlickSheetCopy {
  headline: string
  tagline: string
  hero: { image: string, alt: string, caption: string }
  lede: string
  pillarsHeading: string
  pillars: { pillar: PillarType, title: string, text: string }[]
  toolsHeading: string
  tools: { name: string, text: string }[]
  whyHeading: string
  why: { lead: string, text: string }[]
  footer: { contact: { label: string, icon?: string }[], copyright: string }
}

const props = defineProps<{ copy: SlickSheetCopy }>()

/** Brand marks a footer entry may opt into via `icon:` in the frontmatter. */
const FOOTER_ICONS = { github: Github } as const

// (tm)/(c) shorthand -> real glyphs, matching the markdown plugin and the data
// loaders. Frontmatter bypasses both, so the substitution happens here.
const copy = computed(() => smartScriptDeep(props.copy))
</script>

<template>
  <article class="slick">
    <header class="slick-head">
      <img class="slick-shield" :src="withBase('/icons/saf-logo.svg')" alt="">
      <img class="slick-logo" :src="withBase('/icons/mitre-saf-lockup.svg')" alt="MITRE SAF">
      <div class="slick-headline">
        <h1>{{ copy.headline }}</h1>
        <p>{{ copy.tagline }}</p>
      </div>
    </header>

    <figure class="slick-hero">
      <img :src="withBase(copy.hero.image)" :alt="copy.hero.alt">
      <figcaption>{{ copy.hero.caption }}</figcaption>
    </figure>

    <section class="slick-lede">
      <p>{{ copy.lede }}</p>
    </section>

    <section class="slick-pillars">
      <h2>{{ copy.pillarsHeading }}</h2>
      <ul>
        <li v-for="p in copy.pillars" :key="p.pillar">
          <PillarIcon :pillar="p.pillar" class="slick-pillar-icon" />
          <div>
            <strong>{{ p.title }}</strong>
            <span>{{ p.text }}</span>
          </div>
        </li>
      </ul>
    </section>

    <div class="slick-cols">
      <section class="slick-tools">
        <h2>{{ copy.toolsHeading }}</h2>
        <dl>
          <template v-for="t in copy.tools" :key="t.name">
            <dt>{{ t.name }}</dt>
            <dd>{{ t.text }}</dd>
          </template>
        </dl>
      </section>

      <section class="slick-why">
        <h2>{{ copy.whyHeading }}</h2>
        <ul>
          <li v-for="w in copy.why" :key="w.lead">
            <strong>{{ w.lead }}</strong> {{ w.text }}
          </li>
        </ul>
      </section>
    </div>

    <footer class="slick-foot">
      <span class="slick-contact">
        <template v-for="(item, i) in copy.footer.contact" :key="item.label">
          <span v-if="i > 0" class="slick-sep" aria-hidden="true">|</span>
          <span class="slick-url">
            <component
              :is="FOOTER_ICONS[item.icon as keyof typeof FOOTER_ICONS]"
              v-if="item.icon && FOOTER_ICONS[item.icon as keyof typeof FOOTER_ICONS]"
              class="slick-foot-icon"
              aria-hidden="true"
            />{{ item.label }}
          </span>
        </template>
      </span>
      <span class="slick-gen">{{ copy.footer.copyright }}</span>
    </footer>
  </article>
</template>

<style scoped>
/* Paper-first sizing: see the component docblock on why pt, not rem. */
.slick {
  --ink: #1b1b1f;
  --ink-soft: #44464f;
  --rule: #d4d7de;
  --brand: #005288;

  box-sizing: border-box;
  width: 8.5in;
  max-width: 100%;
  margin: 0 auto;
  padding: 0.25in 0.45in;
  color: var(--ink);
  background: #fff;
  font-size: 9.5pt;
  line-height: 1.35;
}

.slick h1,
.slick h2 {
  margin: 0;
  border: 0;
  letter-spacing: -0.01em;
}

.slick h2 {
  margin-bottom: 4pt;
  color: var(--brand);
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.slick section {
  margin-top: 7pt;
}

/* Header */
.slick-head {
  display: flex;
  gap: 14pt;
  align-items: center;
  padding-bottom: 8pt;
  border-bottom: 2pt solid var(--brand);
}

/* The shield is the mark people recognise at a glance, so it leads the header
   and is sized against the lockup's cap height rather than tucked beside it. */
.slick-shield {
  width: 40pt;
  height: 40pt;
  flex: none;
}

.slick-logo {
  width: 150pt;
  height: auto;
  flex: none;
}

/* Logo anchors the left edge, title block the right. margin-left:auto pushes
   it across the flex row; text-align keeps both lines flush to that edge. */
.slick-headline {
  margin-left: auto;
  text-align: right;
}

.slick-headline h1 {
  font-size: 17pt;
  font-weight: 700;
  line-height: 1.1;
}

.slick-headline p {
  margin: 2pt 0 0;
  color: var(--ink-soft);
  font-size: 10pt;
}

.slick-lede p {
  margin: 0;
  font-size: 10pt;
}

/* Hero. The screenshot is the only image on the sheet and carries the "this is
   a real product" job on its own. Shown whole rather than cropped: the
   Passed/Failed/Not-Applicable tiles are the at-a-glance payload, and cropping
   to a fixed height buried them. Natural aspect (3354x1718) at the content
   width works out near 281pt tall, which the page budget absorbs. */
.slick-hero {
  margin: 6pt 0 0;
  padding: 0;
}

.slick-hero img {
  display: block;
  width: 100%;
  height: auto;
  border: 0.75pt solid var(--rule);
  border-radius: 4pt;
}

.slick-hero figcaption {
  margin-top: 3pt;
  color: var(--brand);
  font-size: 9.5pt;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* Pillars */
.slick-pillars ul {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8pt;
  margin: 0;
  padding: 0;
  list-style: none;
}

.slick-pillars li {
  display: flex;
  flex-direction: column;
  gap: 3pt;
  padding: 7pt;
  border: 0.75pt solid var(--rule);
  border-radius: 4pt;
}

.slick-pillar-icon {
  width: 18pt;
  height: 18pt;
}

.slick-pillars strong {
  display: block;
  font-size: 9.5pt;
}

.slick-pillars span {
  color: var(--ink-soft);
  font-size: 8pt;
  line-height: 1.3;
}

/* Two-column middle band */
/* The Why column carries the most text, so it gets the wider half. The first
   column is sized to half the row minus the gutter, which puts the Why
   column's left edge exactly on the page midpoint rather than merely near it. */
.slick-cols {
  display: grid;
  grid-template-columns: calc(50% - 16pt) 1fr;
  gap: 16pt;
}

.slick-tools dl {
  margin: 0;
}

.slick-tools dt {
  margin-top: 5pt;
  font-weight: 700;
}

.slick-tools dt:first-child {
  margin-top: 0;
}

.slick-tools dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 8.5pt;
}

/* No marker and no indent: the bold lead-in ("Free.") already opens each
   item, and the Toolset column opposite sits flush to its heading. An indent
   here left the two columns visibly out of step. */
.slick-why ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.slick-why li {
  margin-bottom: 3pt;
  color: var(--ink-soft);
  font-size: 8.5pt;
}

.slick-why strong {
  color: var(--ink);
}

/* Footer */
.slick-foot {
  display: flex;
  gap: 12pt;
  align-items: baseline;
  margin-top: 10pt;
  padding-top: 6pt;
  border-top: 0.75pt solid var(--rule);
  color: var(--ink-soft);
  font-size: 8pt;
}

.slick-contact {
  display: flex;
  gap: 6pt;
  /* center, not baseline: the github entry is an inline-flex (it carries an
     icon), and a flex box's baseline is its first line box, which sat 1px
     proud of its plain-text siblings. Centring aligns all three regardless. */
  align-items: center;
}

.slick-url {
  color: var(--brand);
  font-weight: 700;
  font-size: 9pt;
}

.slick-sep {
  color: var(--rule);
}

/* inline-flex rather than relying on vertical-align: a lucide <svg> is a
   replaced element and sat above the baseline inside the flex row. */
.slick-contact .slick-url {
  display: inline-flex;
  align-items: center;
  gap: 2.5pt;
}

.slick-foot-icon {
  width: 8.5pt;
  height: 8.5pt;
  flex: none;
}

.slick-gen {
  margin-left: auto;
}

/* Dark mode would invert the paper; the sheet is always a white page. The
   explicit colors above already pin this, but VitePress sets link/text colors
   globally, so anchors inside the sheet are re-pinned here. */
.slick :deep(a) {
  color: var(--brand);
  text-decoration: none;
}
</style>
