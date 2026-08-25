<script setup lang="ts">
// Shared site footer used on every page: doc-layout pages render it via
// Layout.vue's #doc-after slot, and the home page renders it inline in index.md.
// Single source of truth for footer links + the Osano cookie-consent trigger,
// so the two layouts can never drift apart.

function showCookiePreferences() {
  if (typeof window !== 'undefined' && (window as any).Osano?.cm) {
    (window as any).Osano.cm.showDrawer('osano-cm-dom-info-dialog-open')
  }
}
</script>

<template>
  <footer class="custom-footer">
    <div class="footer-links">
      <a href="/privacy-policy" class="footer-link">Privacy Policy</a>
      <span class="footer-separator">•</span>
      <a href="/accessibility" class="footer-link">Accessibility</a>
      <span class="footer-separator">•</span>
      <a
        href="javascript:void(0)"
        class="footer-link manage-cookies"
        @click.prevent="showCookiePreferences"
      >Manage Cookies</a>
    </div>
    <p class="footer-message">
      MITRE Security Automation Framework (MITRE SAF) is a trademark of The MITRE Corporation. Released under the Apache 2.0 License.
    </p>
    <p class="footer-copyright">
      ©2026 The MITRE Corporation. ALL RIGHTS RESERVED. Approved for Public Release; Distribution Unlimited. Case Number 26-0705.
    </p>
  </footer>
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
