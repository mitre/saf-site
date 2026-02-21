<script setup lang="ts">
import type { ContentItem } from '../composables/useContentDetail'
import type { ActionItem } from './ActionButtons.vue'
import type { PillarType } from './PillarBadge.vue'
import { Marked } from 'marked'
import { createHighlighter } from 'shiki'
import { computed, onMounted, ref } from 'vue'
import { buildMetadataItems, createMetadataItem } from '@/lib/metadata'
import { useContentDetail } from '../composables/useContentDetail'
import ContentHero from './ContentHero.vue'
import BrandIcon from './icons/BrandIcon.vue'
import PillarBadge from './PillarBadge.vue'

const props = defineProps<{
  content: ContentItem
  relatedContent?: RelatedContentItem[]
}>()
// Store for highlighted HTML (populated async)
const quickStartHighlighted = ref('')
const prerequisitesHighlighted = ref('')
const readmeHighlighted = ref('')

// Create markdown renderer with shiki syntax highlighting
async function createMarkedWithShiki() {
  const highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['bash', 'shell', 'yaml', 'ruby', 'json', 'javascript', 'typescript', 'python', 'text'],
  })

  const markedInstance = new Marked()

  markedInstance.use({
    renderer: {
      code(token) {
        const lang = token.lang || 'text'
        const code = token.text
        try {
          // Use lang if supported, fallback to text
          const supportedLang = highlighter.getLoadedLanguages().includes(lang) ? lang : 'text'
          return highlighter.codeToHtml(code, {
            lang: supportedLang,
            theme: 'github-dark',
          })
        }
        catch {
          return `<pre><code class="language-${lang}">${code}</code></pre>`
        }
      },
    },
  })

  return markedInstance
}

// Render markdown with syntax highlighting
async function renderMarkdownWithShiki(markdown: string): Promise<string> {
  if (!markdown)
    return ''
  const markedInstance = await createMarkedWithShiki()
  return markedInstance.parse(markdown, { gfm: true, breaks: true }) as string
}

interface RelatedContentItem {
  id: string
  slug: string
  name: string
  description: string
  content_type: 'validation' | 'hardening' | 'library'
  pillar?: string
  technology_name: string
}

// Use composable for all logic
const {
  formattedProfileVersion,
  benchmarkLabel,
  actionUrls,
  isValidation,
  isLibrary,
  quickStart,
  prerequisites,
  hasQuickStart,
  hasPrerequisites,
  hasReadme,
} = useContentDetail(props.content)

// Render markdown with syntax highlighting on mount
onMounted(async () => {
  if (hasQuickStart.value) {
    quickStartHighlighted.value = await renderMarkdownWithShiki(quickStart.value)
  }
  if (hasPrerequisites.value) {
    prerequisitesHighlighted.value = await renderMarkdownWithShiki(prerequisites.value)
  }
  if (hasReadme.value) {
    readmeHighlighted.value = await renderMarkdownWithShiki(props.content.readme_markdown || '')
  }
})

// Use pillar field from data, fallback to content_type derivation
const validPillars: PillarType[] = ['validate', 'harden', 'plan', 'normalize', 'visualize']
const pillar = computed<PillarType>(() => {
  const p = props.content.pillar
  if (p && validPillars.includes(p as PillarType)) {
    return p as PillarType
  }
  return isValidation.value ? 'validate' : 'harden'
})

// Transform actionUrls for ActionButtons component
const heroActions = computed<ActionItem[]>(() => {
  return actionUrls.value.map(action => ({
    label: action.label,
    url: action.url,
    primary: action.primary,
  }))
})

// Format package info for metadata display
const packagesLabel = computed(() => {
  if (!props.content.packages?.length)
    return undefined
  return props.content.packages.map(p => `${p.name} (${p.registry})`).join(', ')
})

// Build metadata items for sidebar using shared utilities
const metadataItems = computed(() => {
  // Determine standard display value (benchmark label or short name)
  const standardValue = benchmarkLabel.value
    || props.content.standard_short_name
    || props.content.standard_name

  return buildMetadataItems(
    createMetadataItem('Target', props.content.target_name, { filterParam: 'target' }),
    // Hide standard/controls/profile for libraries (they don't have compliance standards)
    isLibrary.value
      ? undefined
      : createMetadataItem('Standard', standardValue, {
          href: props.content.standard_name
            ? `/content/?standard=${encodeURIComponent(props.content.standard_name)}`
            : undefined,
        }),
    createMetadataItem('Tech', props.content.technology_name, { filterParam: 'technology' }),
    createMetadataItem('Status', props.content.status),
    isLibrary.value ? undefined : createMetadataItem('Profile', formattedProfileVersion.value),
    isLibrary.value ? undefined : createMetadataItem('Controls', props.content.control_count),
    createMetadataItem('Packages', packagesLabel.value),
    createMetadataItem('Vendor', props.content.vendor_name, { filterParam: 'vendor' }),
    createMetadataItem('Maintainer', props.content.maintainer_name),
  )
})

// Related content with default empty array
const relatedContent = computed(() => props.relatedContent || [])
</script>

<template>
  <div class="content-detail">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <a href="/content/">Content Library</a>
      <span class="separator">/</span>
      <span class="current">{{ content.name }}</span>
    </nav>

    <!-- Draft Disclaimer (only shown for draft status content) -->
    <div v-if="content.status === 'draft'" class="draft-disclaimer">
      <p>This content is in draft form. It is made available here as reference but is not expected to be feature-complete without continued development work.</p>
    </div>

    <!-- Hero Section (reusable component) -->
    <ContentHero
      :title="content.name"
      :description="content.description"
      :pillar="pillar"
      :actions="heroActions"
      :metadata="metadataItems"
    />

    <!-- Quick Start Section -->
    <section v-if="hasQuickStart" class="content-section">
      <h2 class="section-title">
        Quick Start
      </h2>
      <div class="markdown-content" v-html="quickStartHighlighted" />
    </section>

    <!-- Prerequisites Section -->
    <section v-if="hasPrerequisites" class="content-section">
      <h2 class="section-title">
        Prerequisites
      </h2>
      <div class="markdown-content" v-html="prerequisitesHighlighted" />
    </section>

    <!-- Documentation Section (README) -->
    <section v-if="hasReadme" class="content-section readme-section">
      <h2 class="section-title">
        Documentation
      </h2>
      <div class="markdown-content readme-content" v-html="readmeHighlighted" />
    </section>

    <!-- Related Content Section -->
    <section v-if="relatedContent.length > 0" class="related-content">
      <h2 class="related-title">
        Related Content
      </h2>
      <p class="related-description">
        Other security content for {{ content.target_name }}
      </p>
      <div class="related-grid">
        <a
          v-for="related in relatedContent"
          :key="related.id"
          :href="`/content/${related.slug}.html`"
          class="related-card"
        >
          <div class="related-card-header">
            <span class="related-card-name">{{ related.name }}</span>
            <PillarBadge
              :pillar="(related.pillar as PillarType) || (related.content_type === 'validation' ? 'validate' : 'harden')"
              size="sm"
            />
          </div>
          <p class="related-card-description">{{ related.description }}</p>
          <div class="related-card-footer">
            <BrandIcon :name="related.technology_name" :size="16" />
            <span class="related-card-tech">{{ related.technology_name }}</span>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.content-detail {
  /* Uses parent doc layout width for consistency */
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.breadcrumb a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb .separator {
  margin: 0 0.5rem;
  color: var(--vp-c-text-3);
}

.breadcrumb .current {
  color: var(--vp-c-text-1);
}

/* Draft Disclaimer */
.draft-disclaimer {
  margin: 1rem 0 1.5rem;
  padding: 1rem 1.25rem;
  background: var(--vp-c-warning-soft);
  border-left: 4px solid var(--vp-c-warning-1);
  border-radius: 4px;
}

.draft-disclaimer p {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

/* Content Sections (Quick Start, Prerequisites, Documentation) */
.content-section {
  margin-top: 2.5rem;
  padding-top: 2rem;
}

.section-title {
  margin: 0 0 1.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

/* Markdown content styling */
.markdown-content {
  color: var(--vp-c-text-1);
  line-height: 1.7;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.markdown-content :deep(h1) { font-size: 1.75rem; }
.markdown-content :deep(h2) { font-size: 1.4rem; }
.markdown-content :deep(h3) { font-size: 1.2rem; }
.markdown-content :deep(h4) { font-size: 1.1rem; }

.markdown-content :deep(p) {
  margin: 0.75rem 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin: 0.25rem 0;
}

.markdown-content :deep(pre) {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
}

.markdown-content :deep(p code),
.markdown-content :deep(li code) {
  padding: 0.15rem 0.4rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  font-size: 0.85em;
}

.markdown-content :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  border-left: 3px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.markdown-content :deep(table) {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  text-align: left;
}

.markdown-content :deep(th) {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}

.markdown-content :deep(hr) {
  margin: 2rem 0;
  border: none;
  border-top: 1px solid var(--vp-c-divider);
}

/* README section specific styling */
.readme-section {
  margin-top: 3rem;
}

.readme-content :deep(h1:first-child) {
  display: none; /* Hide duplicate title from README */
}

/* Related Content Section */
.related-content {
  margin-top: 3rem;
  padding-top: 2rem;
}

.related-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.related-description {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  color: var(--vp-c-text-2);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.related-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.1s ease, box-shadow 0.1s ease;
}

.related-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.related-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.related-card-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.related-card-description {
  flex: 1;
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-card-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-text-3);
}

.related-card-tech {
  font-size: 0.75rem;
  font-weight: 500;
}

@media (max-width: 480px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
