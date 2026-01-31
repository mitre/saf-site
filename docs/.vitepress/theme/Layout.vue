<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { theme } = useData()

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-after>
      <div class="custom-footer">
        <p class="footer-message">
          {{ theme.footer?.message }}
        </p>
        <p class="footer-copyright">
          {{ theme.footer?.copyright }}
        </p>
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.custom-footer {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
}

.footer-message {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0 0 0.5rem 0;
}

.footer-copyright {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0;
}
</style>
