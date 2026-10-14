---
layout: page
title: SAF Slick Sheet (internal)
aside: false
sidebar: false
search: false

# ---------------------------------------------------------------------------
# ALL SHEET COPY LIVES HERE. Edit this block; the component only lays it out.
#
# Type (tm) and (c) rather than hunting for ™ and © — they are substituted at
# render time, the same convention the rest of the site uses.
#
# Keep it to one page: the sheet currently fills ~96% of US Letter, so adding
# more than a line or two will spill onto a second page. Check the print
# preview says "1 page" before you mint a PDF.
# ---------------------------------------------------------------------------
sheet:
  headline: Security Automation Framework(tm)
  tagline: Open source security testing and compliance automation

  hero:
    image: /screenshots/heimdall-dashboard.png
    alt: Heimdall dashboard showing overall compliance statistics
    caption: Use MITRE Heimdall(tm) to visualize your security posture from any type of scan

  lede: >-
    MITRE SAF(tm) is a free, open source framework for automating security
    testing and compliance across the whole system life cycle — from authoring
    security requirements, through hardening and continuous validation, to normalized
    reporting that supports an authorization decision. Use MITRE SAF content to jump-start an automation capability or fill in gaps in an existing one.

  pillarsHeading: Five pillars
  pillars:
    - pillar: plan
      title: Plan
      text: Select, tailor, and author security guidance for your mission.
    - pillar: harden
      title: Harden
      text: Apply baselines with verified Ansible, Chef, and Terraform content.
    - pillar: validate
      title: Validate
      text: Test continuously with InSpec profiles and manual attestation.
    - pillar: normalize
      title: Normalize
      text: Convert every tool's output into one common data format.
    - pillar: visualize
      title: Visualize
      text: See overall posture, then drill into specific defects.

  toolsHeading: The toolset
  tools:
    - name: MITRE SAF CLI(tm)
      text: Normalize scan results, generate InSpec profiles, check results against thresholds.
    - name: MITRE Heimdall(tm)
      text: Visualize results, compare scan runs over time, export reports.
    - name: MITRE Vulcan(tm)
      text: Author security guidance against Security Requirements Guides.
    - name: MITRE eMASSer(tm)
      text: Automate eMASS workflows for continuous monitoring.

  whyHeading: Why MITRE SAF(tm)
  why:
    - lead: Free
      text: No licensing costs. Tailor MITRE SAF automation to your own requirements.
    - lead: Open source
      text: Every tool and profile is public on GitHub.
    - lead: Community-built
      text: Leverage the best ideas in the open-source security community, with MITRE stewardship.
    - lead: Standards-aligned
      text: Built on DISA STIGs, CIS Benchmarks, and NIST RMF - all normalized to the OASIS Open Heimdall Data Format (OHDF).
    - lead: Easy-to-Integrate
      text: Run MITRE SAF tooling anywhere - locally on a laptop, or in a mature DevSecOps pipeline.

  footer:
    # `icon:` is optional. Only "github" is wired up today; add more in
    # SlickSheet.vue's FOOTER_ICONS map if another is ever needed.
    contact:
      - label: https://saf.mitre.org
      - label: saf@mitre.org
      - label: github.com/mitre
        icon: github
    copyright: (c) 2026 The MITRE Corporation
---

<script setup>
import { useData } from 'vitepress'
import SlickSheet from '../.vitepress/theme/components/SlickSheet.vue'

const { frontmatter } = useData()
</script>

<div class="slick-screen-note no-print">
  <strong>Maintainer tool — not a published page.</strong>
  This sheet is excluded from <code>pnpm build</code> and never reaches saf.mitre.org.
  To mint a PDF: print this page (⌘P), choose <em>US&nbsp;Letter</em>, portrait,
  margins <em>None</em>, and enable <em>Background graphics</em>.
  All wording lives in this file's frontmatter — edit it there.
</div>

<SlickSheet :copy="frontmatter.sheet" />

<style>
/* Screen: centre the sheet on a neutral ground so it reads as a page. */
.slick-screen-note {
  max-width: 8.5in;
  margin: 1.5rem auto 1rem;
  padding: 0.75rem 1rem;
  border-left: 3px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  font-size: 0.85rem;
  line-height: 1.5;
}

@media print {
  /* Strip the site. VitePress renders nav/footer outside this page's control,
     so they are hidden here rather than in the component — the component is
     the sheet, this is the frame around it. */
  .VPNav,
  .VPLocalNav,
  .VPSidebar,
  .VPFooter,
  .VPBackdrop,
  .no-print {
    display: none !important;
  }

  /* The theme constrains .VPPage/.VPContent widths and adds top padding for the
     fixed navbar; on paper that padding becomes a blank band and the width cap
     shrinks the sheet. Both are theme rules we do not own, hence !important. */
  .VPContent,
  .VPPage,
  .VPContent.is-home {
    padding: 0 !important;
    margin: 0 !important;
    max-width: none !important;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  /* One sheet, no orphaned fragments on a second page. */
  .slick {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

@page {
  size: letter portrait;
  margin: 0;
}
</style>
