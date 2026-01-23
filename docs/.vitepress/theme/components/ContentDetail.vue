<template>
  <div class="content-detail">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <a href="/content/">Content Library</a>
      <span class="separator">/</span>
      <span class="current">{{ content.name }}</span>
    </nav>

    <!-- Header Section -->
    <header class="content-header">
      <div class="title-row">
        <h1 class="content-title">{{ content.name }}</h1>
        <PillarBadge :pillar="pillar" size="md" />
      </div>

      <span v-if="benchmarkLabel" class="benchmark-version">
        {{ benchmarkLabel }}
      </span>

      <p class="content-description">{{ content.description }}</p>

      <!-- Metadata Tags -->
      <div class="content-tags">
        <span v-if="content.status" :class="['tag', `tag-${content.status}`]">
          {{ content.status }}
        </span>
        <span v-if="formattedProfileVersion" class="tag tag-version">
          Profile {{ formattedProfileVersion }}
        </span>
        <span v-if="content.control_count" class="tag tag-controls">
          {{ content.control_count }} controls
        </span>
      </div>
    </header>

    <!-- Action Buttons -->
    <div class="content-actions" v-if="actionUrls.length">
      <a
        v-for="action in actionUrls"
        :key="action.url"
        :href="action.url"
        target="_blank"
        :class="['action-btn', action.primary ? 'brand' : 'alt']"
      >
        {{ action.label }}
      </a>
    </div>

    <!-- Feature Cards -->
    <div class="content-features">
      <!-- Target -->
      <article v-if="content.target_name" class="feature-card">
        <div class="feature-icon">
          <BrandIcon :name="content.target_name" :size="28" />
        </div>
        <h3 class="feature-title">Target</h3>
        <p class="feature-detail">{{ content.target_name }}</p>
      </article>

      <!-- Standard -->
      <article v-if="content.standard_name" class="feature-card">
        <div class="feature-icon">
          <BrandIcon :name="content.standard_name" :size="28" />
        </div>
        <h3 class="feature-title">Standard</h3>
        <p class="feature-detail">{{ content.standard_name }}</p>
      </article>

      <!-- Technology -->
      <article v-if="content.technology_name" class="feature-card">
        <div class="feature-icon">
          <BrandIcon :name="content.technology_name" :size="28" />
        </div>
        <h3 class="feature-title">Technology</h3>
        <p class="feature-detail">{{ content.technology_name }}</p>
      </article>

      <!-- Vendor -->
      <article v-if="content.vendor_name" class="feature-card">
        <div class="feature-icon">
          <BrandIcon :name="content.vendor_name" :size="28" />
        </div>
        <h3 class="feature-title">Vendor</h3>
        <p class="feature-detail">{{ content.vendor_name }}</p>
      </article>

      <!-- Maintainer -->
      <article v-if="content.maintainer_name" class="feature-card">
        <div class="feature-icon">
          <BrandIcon :name="content.maintainer_name" :size="28" />
        </div>
        <h3 class="feature-title">Maintainer</h3>
        <p class="feature-detail">{{ content.maintainer_name }}</p>
      </article>

      <!-- STIG ID (validation-specific) -->
      <article v-if="isValidation && content.stig_id" class="feature-card">
        <div class="feature-icon">
          <BrandIcon name="stig" :size="28" />
        </div>
        <h3 class="feature-title">STIG ID</h3>
        <p class="feature-detail mono">{{ content.stig_id }}</p>
      </article>
    </div>

    <!-- Quick Start Section -->
    <section v-if="hasQuickStart" class="content-section">
      <h2 class="section-title">Quick Start</h2>
      <div class="markdown-content" v-html="quickStartHighlighted"></div>
    </section>

    <!-- Prerequisites Section -->
    <section v-if="hasPrerequisites" class="content-section">
      <h2 class="section-title">Prerequisites</h2>
      <div class="markdown-content" v-html="prerequisitesHighlighted"></div>
    </section>

    <!-- Documentation Section (README) -->
    <section v-if="hasReadme" class="content-section readme-section">
      <h2 class="section-title">Documentation</h2>
      <div class="markdown-content readme-content" v-html="readmeHighlighted"></div>
    </section>

    <!-- Related Content Section -->
    <section v-if="relatedContent.length > 0" class="related-content">
      <h2 class="related-title">Related Content</h2>
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
              :pillar="related.content_type === 'validation' ? 'validate' : 'harden'"
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Marked } from 'marked'
import { createHighlighter } from 'shiki'
import { useContentDetail, type ContentItem } from '../composables/useContentDetail'
import PillarBadge, { type PillarType } from './PillarBadge.vue'
import BrandIcon from './icons/BrandIcon.vue'

// Store for highlighted HTML (populated async)
const quickStartHighlighted = ref('')
const prerequisitesHighlighted = ref('')
const readmeHighlighted = ref('')

// Create markdown renderer with shiki syntax highlighting
async function createMarkedWithShiki() {
  const highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['bash', 'shell', 'yaml', 'ruby', 'json', 'javascript', 'typescript', 'python', 'text']
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
            theme: 'github-dark'
          })
        } catch {
          return `<pre><code class="language-${lang}">${code}</code></pre>`
        }
      }
    }
  })

  return markedInstance
}

// Render markdown with syntax highlighting
async function renderMarkdownWithShiki(markdown: string): Promise<string> {
  if (!markdown) return ''
  const markedInstance = await createMarkedWithShiki()
  return markedInstance.parse(markdown, { gfm: true, breaks: true }) as string
}

interface RelatedContentItem {
  id: string
  slug: string
  name: string
  description: string
  content_type: 'validation' | 'hardening'
  technology_name: string
}

const props = defineProps<{
  content: ContentItem
  relatedContent?: RelatedContentItem[]
}>()

// Use composable for all logic
const {
  formattedProfileVersion,
  benchmarkLabel,
  actionUrls,
  featureCards,
  isValidation,
  quickStart,
  prerequisites,
  hasQuickStart,
  hasPrerequisites,
  hasReadme
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

// Map content_type to pillar
const pillar = computed<PillarType>(() => {
  return isValidation.value ? 'validate' : 'harden'
})

// Related content with default empty array
const relatedContent = computed(() => props.relatedContent || [])
</script>

<style scoped>
.content-detail {
  /* Uses parent doc layout width for consistency */
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 2rem;
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

/* Header */
.content-header {
  margin-bottom: 1.5rem;
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.content-title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-text-1);
}

.benchmark-version {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.tag-version {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
}

.content-description {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* Tags */
.content-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tag-active { background: #10b981; color: white; }
.tag-beta { background: #f59e0b; color: white; }
.tag-deprecated { background: #ef4444; color: white; }
.tag-draft { background: #6b7280; color: white; }

.tag-controls {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

/* Action Buttons */
.content-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border-radius: 20px;
  transition: all 0.25s;
}

.action-btn.brand {
  background: var(--vp-c-brand-1);
  color: white;
  border: 1px solid var(--vp-c-brand-1);
}

.action-btn.brand:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.action-btn.alt {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-btn.alt:hover {
  border-color: var(--vp-c-text-2);
}

/* Feature Cards */
.content-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 2rem;
}

.feature-card {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-bg-soft);
  transition: border-color 0.25s;
}

.feature-card:hover {
  border-color: var(--vp-c-divider);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--vp-c-bg-elv);
  border-radius: 8px;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
}

.feature-icon.emoji {
  font-size: 24px;
}

.feature-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.feature-detail {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.feature-detail.mono {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .content-title {
    font-size: 1.75rem;
  }

  .content-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-features {
    grid-template-columns: 1fr;
  }
}

/* Content Sections (Quick Start, Prerequisites, Documentation) */
.content-section {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
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
  border-top: 1px solid var(--vp-c-divider);
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
