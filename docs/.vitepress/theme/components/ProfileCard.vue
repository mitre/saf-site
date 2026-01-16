<template>
  <a :href="`/validate/${profile.slug}.html`" class="profile-card">
    <!-- Header: Title + Badges on same line -->
    <div class="card-header">
      <h3 class="card-title">{{ profile.name }}</h3>
      <div class="card-badges">
        <span v-if="profile.status" :class="['badge', `badge-${profile.status}`]">
          {{ profile.status }}
        </span>
        <span v-if="profile.standard_short_name || profile.standard_name" class="badge badge-standard">
          {{ profile.standard_short_name || profile.standard_name }}
        </span>
      </div>
    </div>

    <!-- Content: Description -->
    <p class="card-description">{{ profile.description }}</p>

    <!-- Footer: Tech + Meta -->
    <div class="card-footer">
      <span class="card-tech">{{ profile.technology_name }}</span>
      <div class="card-meta">
        <span v-if="profile.version" class="card-version">v{{ profile.version }}</span>
        <span v-if="profile.target_name" class="badge badge-outline">{{ profile.target_name }}</span>
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
interface Profile {
  id: string
  slug: string
  name: string
  description?: string
  target_name?: string
  standard_name?: string
  standard_short_name?: string
  technology_name?: string
  version?: string
  status?: string
}

defineProps<{
  profile: Profile
}>()
</script>

<style scoped>
/* Card Container - shadcn pattern */
.profile-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.5rem;
  background: var(--vp-c-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  min-height: 160px;
}

.profile-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Card Header - title + badges inline */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  flex: 1;
  min-width: 0;
}

.card-badges {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* Badge Base - shadcn pattern */
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  transition: background-color 0.2s;
}

/* Badge Variants */
.badge-active {
  background: #10b981;
  color: white;
  text-transform: uppercase;
}

.badge-beta {
  background: #f59e0b;
  color: white;
  text-transform: uppercase;
}

.badge-deprecated {
  background: #ef4444;
  color: white;
  text-transform: uppercase;
}

.badge-draft {
  background: #6b7280;
  color: white;
  text-transform: uppercase;
}

.badge-standard {
  background: var(--vp-c-brand-1);
  color: white;
}

.badge-outline {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Card Description */
.card-description {
  margin: 0;
  padding-bottom: 0.75rem;
  color: var(--vp-c-text-2);
  font-size: 0.8125rem;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--vp-c-divider-light);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-top: auto;
}

.card-tech {
  font-weight: 500;
  flex-shrink: 0;
}

.card-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.card-version {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}
</style>
