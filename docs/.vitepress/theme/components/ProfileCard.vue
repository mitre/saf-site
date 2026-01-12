<template>
  <a :href="`/validate/${profile.slug}.html`" class="profile-card">
    <div class="profile-card-header">
      <h3 class="profile-card-title">{{ profile.name }}</h3>
      <span class="profile-card-badge">{{ profile.category }}</span>
    </div>
    <p class="profile-card-description">{{ profile.description }}</p>
    <div class="profile-card-footer">
      <span class="profile-card-tech">{{ profile.technology }}</span>
      <span class="profile-card-version">v{{ profile.version }}</span>
    </div>
  </a>
</template>

<script setup lang="ts">
interface Profile {
  id: string
  slug: string
  name: string
  description?: string
  category?: string
  technology?: string
  version?: string
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
  margin-bottom: 0.75rem;
}

.profile-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.profile-card-badge {
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.profile-card-description {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
}

.profile-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}

.profile-card-tech {
  font-weight: 500;
}

.profile-card-version {
  font-family: var(--vp-font-family-mono);
}
</style>
