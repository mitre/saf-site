<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { computed, onMounted } from 'vue'
import SmartScriptProcessor from './components/SmartScriptProcessor.vue'

const { Layout } = DefaultTheme

// Detect wide layout pages via frontmatter
const { frontmatter } = useData()
const isWideLayout = computed(() => {
  return frontmatter.value.wideLayout === true
})

// Osano cookie consent handler
function showCookiePreferences() {
  if (typeof window !== 'undefined' && (window as any).Osano?.cm) {
    (window as any).Osano.cm.showDrawer('osano-cm-dom-info-dialog-open')
  }
}

// Add event listener for Manage Cookies link
onMounted(() => {
  const manageCookiesLink = document.querySelector('a.manage-cookies')
  if (manageCookiesLink) {
    manageCookiesLink.addEventListener('click', (e) => {
      e.preventDefault()
      showCookiePreferences()
    })
  }
})
</script>

<template>
  <Layout :class="{ 'wide-layout': isWideLayout }">
    <template #layout-bottom>
      <!-- Client-side processor for Vue component content -->
      <SmartScriptProcessor />
    </template>
    <template #doc-after>
      <!-- Footer for doc layout pages -->
      <div class="custom-footer">
        <div class="footer-links">
          <a href="/privacy-policy" class="footer-link">Privacy Policy</a>
          <span class="footer-separator">•</span>
          <a href="javascript:void(0)" class="footer-link manage-cookies">Manage Cookies</a>
        </div>
        <p class="footer-message">
          MITRE Security Automation Framework (MITRE SAF) is a trademark of The MITRE Corporation. Released under the Apache 2.0 License.
        </p>
        <p class="footer-copyright">
          Copyright © 2026 The MITRE Corporation
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

.footer-links {
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.footer-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.footer-separator {
  margin: 0 0.75rem;
  color: var(--vp-c-text-3);
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
