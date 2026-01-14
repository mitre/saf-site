<template>
  <a :href="`/validate/${profile.slug}.html`" class="profile-card">
    <div class="profile-card-header">
      <h3 class="profile-card-title">{{ profile.name }}</h3>
      <div class="profile-card-badges">
        <span v-if="profile.status" :class="['status-badge', `status-${profile.status}`]">
          {{ profile.status }}
        </span>
        <span v-if="profile.standard_short_name || profile.standard_name" class="standard-badge">{{ profile.standard_short_name || profile.standard_name }}</span>
      </div>
    </div>
    <p class="profile-card-description">{{ profile.description }}</p>
    <div class="profile-card-footer">
      <span class="profile-card-tech">{{ profile.technology_name }}</span>
      <div class="profile-card-meta">
        <span v-if="profile.version" class="profile-card-version">v{{ profile.version }}</span>
        <span v-if="profile.target_name" class="profile-card-target">{{ profile.target_name }}</span>
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
.profile-card {
  display: block;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
}

.profile-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.profile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.profile-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  flex: 1;
}

.profile-card-badges {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.standard-badge {
  padding: 0.2rem 0.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-active {
  background: #10b981;
  color: white;
}

.status-beta {
  background: #f59e0b;
  color: white;
}

.status-deprecated {
  background: #ef4444;
  color: white;
}

.status-draft {
  background: #6b7280;
  color: white;
}

.profile-card-description {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.5;
}

.profile-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.profile-card-tech {
  font-weight: 500;
}

.profile-card-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.profile-card-version {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.profile-card-target {
  padding: 0.125rem 0.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  font-size: 0.75rem;
}
</style>
