---
title: Media & Downloads
layout: doc
aside: false
wideLayout: true
---

<PageSection
  orientation="vertical"
  headline="MITRE SAF Resources"
  title="Media & Downloads"
  description="Download whitepapers, presentations, and training materials to learn about the MITRE Security Automation Framework and share it with your organization."
/>

<PageSection
  variant="muted"
  orientation="vertical"
  headline="Documentation"
  title="Whitepapers & Guides"
  description="Comprehensive guides covering SAF capabilities, best practices, and implementation strategies."
>

<CardGrid>

<MediaCard
  href="/How to Use the MITRE SAF.pdf"
  icon="document"
  title="How to Use MITRE SAF"
  meta="One-page overview • PDF"
  description="Slick sheet on MITRE SAF's(tm) capabilities in relation to planning, development, assessment, and operations."
  action="Download PDF"
  download
/>

<MediaCard
  href="/DevSecOps_Best_Practices_Guide.pdf"
  icon="document"
  title="DevSecOps Best Practices"
  meta="Implementation guide • PDF"
  description="Guidance on implementing DevSecOps pipelines with MITRE SAF(tm) tools for continuous security testing and compliance automation."
  action="Download PDF"
  download
/>

<MediaCard
  href="/SAF-Executive-Level-Summary.pdf"
  icon="document"
  title="Executive Summary"
  meta="Leadership overview • PDF"
  description="High-level overview of MITRE SAF(tm) capabilities and benefits for organizational leadership and decision-makers."
  action="Download PDF"
  download
/>

<MediaCard
  href="/The-New-Normalized-OHDF.pdf"
  icon="document"
  title="The New Normalized OHDF"
  meta="Technical deep dive • PDF"
  description="Technical overview of the OASIS Heimdall Data Format (OHDF) and how it enables unified security data analysis."
  action="Download PDF"
  download
/>

</CardGrid>

</PageSection>

<PageSection
  orientation="vertical"
  headline="Presentations"
  title="Conference Talks & Webinars"
  description="Slides from MITRE SAF(tm) team presentations at industry conferences and community events."
>

<CardGrid>

<MediaCard
  href="/SCAP-InSpec-Comparison.pdf"
  icon="presentation"
  title="SCAP vs InSpec Comparison"
  meta="Technical comparison • PDF"
  description="Side-by-side comparison of SCAP and InSpec for compliance automation, covering strengths, limitations, and use cases."
  action="Download Slides"
  download
/>

<MediaCard
  href="/MITRE-SAF-Vulcan.pdf"
  icon="presentation"
  title="Vulcan Webinar"
  meta="Product demo • PDF"
  description="Introduction to Vulcan, the SAF security guidance authoring platform for creating and managing security baselines."
  action="Download Slides"
  download
/>

<MediaCard
  href="/ChefConf-2023-A-Whole-New-Containerized-World.pdf"
  icon="presentation"
  title="Container Security Best Practices"
  meta="ChefConf 2023 • PDF"
  description="Presentation on container security testing and hardening best practices using MITRE SAF tools and InSpec."
  action="Download Slides"
  download
/>

</CardGrid>

</PageSection>


<PageSection
  orientation="vertical"
  headline="Additional Resources"
  title="External Documentation"
  description="Links to documentation for InSpec and related security automation tools frequently used by MITRE SAF(tm)."
>

<CardGrid :columns="3">

<MediaCard
  href="https://docs.chef.io/inspec/"
  variant="compact"
  title="InSpec Documentation"
  description="Official InSpec documentation covering installation, usage, and resource reference."
  external
/>

<MediaCard
  href="https://docs.chef.io/inspec/resources/"
  variant="compact"
  title="InSpec Resources"
  description="Complete reference for all InSpec resources used to write security validation tests."
  external
/>

</CardGrid>

</PageSection>
