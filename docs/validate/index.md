---
title: Validation Profiles
layout: doc
---

<script setup>
import { data } from '../.vitepress/loaders/profiles.data'

const profiles = data.profiles
</script>

# Validation Profiles

InSpec validation profiles for security compliance testing across various platforms and standards.

## Browse Profiles

<div class="profile-grid">
  <ProfileCard
    v-for="profile in profiles"
    :key="profile.id"
    :profile="profile"
  />
</div>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
