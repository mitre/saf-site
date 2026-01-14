<template>
  <div class="profile-detail">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <a href="/validate/">Validate</a>
      <span class="separator">/</span>
      <span class="current">{{ profile.name }}</span>
    </nav>

    <!-- Header Section -->
    <header class="profile-header">
      <h1 class="profile-title">{{ profile.name }}</h1>

      <span v-if="profile.benchmark_version" class="benchmark-version">
        {{ profile.standard_short_name || 'Benchmark' }} {{ formattedBenchmarkVersion }}
      </span>

      <p class="profile-description">{{ profile.description }}</p>

      <!-- Metadata Tags -->
      <div class="profile-tags">
        <span v-if="profile.status" :class="['tag', `tag-${profile.status}`]">
          {{ profile.status }}
        </span>
        <span v-if="profile.version" class="tag tag-version">
          Profile v{{ profile.version }}
        </span>
        <span v-if="profile.control_count" class="tag tag-controls">
          {{ profile.control_count }} controls
        </span>
      </div>
    </header>

    <!-- Action Buttons (VitePress style) -->
    <div class="profile-actions" v-if="profile.github_url">
      <a :href="profile.github_url" target="_blank" class="action-btn brand">
        View on GitHub
      </a>
      <a :href="`${profile.github_url}#readme`" target="_blank" class="action-btn alt">
        View README
      </a>
    </div>

    <!-- Feature Cards for Metadata -->
    <div class="profile-features">
      <article v-if="profile.target_name" class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3 class="feature-title">Target</h3>
        <p class="feature-detail">{{ profile.target_name }}</p>
      </article>

      <article v-if="profile.standard_name" class="feature-card">
        <div class="feature-icon">📋</div>
        <h3 class="feature-title">Standard</h3>
        <p class="feature-detail">{{ profile.standard_name }}</p>
      </article>

      <article v-if="profile.technology_name" class="feature-card">
        <div class="feature-icon">⚙️</div>
        <h3 class="feature-title">Technology</h3>
        <p class="feature-detail">{{ profile.technology_name }}</p>
      </article>

      <article v-if="profile.vendor_name" class="feature-card">
        <div class="feature-icon">🏢</div>
        <h3 class="feature-title">Vendor</h3>
        <p class="feature-detail">{{ profile.vendor_name }}</p>
      </article>

      <article v-if="profile.maintainer_name" class="feature-card">
        <div class="feature-icon">👤</div>
        <h3 class="feature-title">Maintainer</h3>
        <p class="feature-detail">{{ profile.maintainer_name }}</p>
      </article>

      <article v-if="profile.stig_id" class="feature-card">
        <div class="feature-icon">📊</div>
        <h3 class="feature-title">STIG ID</h3>
        <p class="feature-detail mono">{{ profile.stig_id }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Profile {
  id: string
  slug: string
  name: string
  description: string
  long_description: string
  version: string
  status: string
  target_name: string
  target_slug: string
  standard_name: string
  standard_short_name: string
  standard_slug: string
  technology_name: string
  technology_slug: string
  technology_logo: string
  vendor_name: string
  vendor_slug: string
  maintainer_name: string
  maintainer_slug: string
  github_url: string
  documentation_url: string
  control_count: number
  stig_id: string
  benchmark_version: string
  license: string
  release_date: string
}

const props = defineProps<{
  profile: Profile
}>()

/**
 * Format benchmark version based on standard type
 * STIG: 2.5.3 → V2R5 (Version.Release.ProfilePatch)
 * CIS/Others: 2.0.0 → v2.0.0 (keep semver)
 */
function formatBenchmarkVersion(version: string, standardName: string): string {
  if (!version) return ''

  // STIG uses V{major}R{minor} format
  if (standardName?.toLowerCase().includes('stig')) {
    const parts = version.split('.')
    const major = parts[0] || '0'
    const minor = parts[1] || '0'
    return `V${major}R${minor}`
  }

  // CIS and others keep semver format
  return `v${version}`
}

const formattedBenchmarkVersion = computed(() => {
  return formatBenchmarkVersion(
    props.profile.benchmark_version,
    props.profile.standard_name || props.profile.standard_short_name
  )
})
</script>

<style scoped>
.profile-detail {
  /* Uses parent doc layout width for consistency with browse page */
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
.profile-header {
  margin-bottom: 1.5rem;
}

.profile-title {
  margin: 0 0 0.5rem 0;
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

.profile-description {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* Tags */
.profile-tags {
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

.tag-standard {
  background: var(--vp-c-brand-1);
  color: white;
}

.tag-tech {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.tag-controls {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

/* Action Buttons - VitePress style */
.profile-actions {
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

/* Feature Cards - VitePress home style */
.profile-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
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
  font-size: 24px;
  background: var(--vp-c-bg-elv);
  border-radius: 8px;
  margin-bottom: 1rem;
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
  .profile-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .profile-title {
    font-size: 1.75rem;
  }

  .profile-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-features {
    grid-template-columns: 1fr;
  }
}
</style>
