/**
 * Content Data Loader
 *
 * Loads all content items from the Drizzle database at build time.
 * Uses relational queries for automatic FK expansion.
 */

import { defineLoader } from 'vitepress'
import { db } from '../database/db'

// ContentItem interface with camelCase field names (JS/TS convention)
export interface ContentItem {
  id: string
  slug: string
  name: string
  description?: string
  longDescription?: string
  version?: string
  contentType: 'validation' | 'hardening'
  status?: string
  // Target (what this content secures)
  target?: string
  targetName?: string
  targetSlug?: string
  // Standard (compliance framework)
  standard?: string
  standardName?: string
  standardShortName?: string
  standardSlug?: string
  // Technology (InSpec, Ansible, etc.)
  technology?: string
  technologyName?: string
  technologySlug?: string
  technologyLogo?: string
  // Vendor (who made it)
  vendor?: string
  vendorName?: string
  vendorSlug?: string
  vendorLogo?: string
  // Maintainer (team responsible)
  maintainer?: string
  maintainerName?: string
  maintainerSlug?: string
  maintainerLogo?: string
  // Links
  githubUrl?: string
  documentationUrl?: string
  referenceUrl?: string
  // README content
  readmeUrl?: string
  readmeMarkdown?: string
  // Technology templates
  quickStartTemplate?: string
  prerequisitesTemplate?: string
  // Domain-specific
  controlCount?: number
  stigId?: string
  benchmarkVersion?: string
  isFeatured?: boolean
}

export interface ContentData {
  items: ContentItem[]
  // Grouped views for convenience
  validation: ContentItem[]
  hardening: ContentItem[]
}

declare const data: ContentData
export { data }

export default defineLoader({
  async load(): Promise<ContentData> {
    try {
      // Use Drizzle relational query with automatic FK expansion
      const records = await db.query.content.findMany({
        with: {
          target: true,
          standard: true,
          technology: true,
          vendor: true,
          maintainer: {
            with: {
              organization: true, // For logo fallback
            },
          },
        },
        orderBy: (content, { asc }) => [asc(content.name)],
      })

      // Transform to flattened ContentItem format
      const items: ContentItem[] = records.map((record) => {
        // Get maintainer logo with organization fallback
        const maintainerLogo = record.maintainer?.logo || record.maintainer?.organization?.logo

        return {
          id: record.id,
          slug: record.slug,
          name: record.name,
          description: record.description ?? undefined,
          longDescription: record.longDescription ?? undefined,
          version: record.version ?? undefined,
          contentType: record.contentType as 'validation' | 'hardening',
          status: record.status ?? undefined,
          // Target
          target: record.target ?? undefined,
          targetName: record.target ? (record as any).target?.name : undefined,
          targetSlug: record.target ? (record as any).target?.slug : undefined,
          // Standard
          standard: record.standard ?? undefined,
          standardName: record.standard ? (record as any).standard?.name : undefined,
          standardShortName: record.standard ? (record as any).standard?.shortName : undefined,
          standardSlug: record.standard ? (record as any).standard?.slug : undefined,
          // Technology
          technology: record.technology ?? undefined,
          technologyName: record.technology ? (record as any).technology?.name : undefined,
          technologySlug: record.technology ? (record as any).technology?.slug : undefined,
          technologyLogo: record.technology ? (record as any).technology?.logo : undefined,
          // Vendor
          vendor: record.vendor ?? undefined,
          vendorName: record.vendor ? (record as any).vendor?.name : undefined,
          vendorSlug: record.vendor ? (record as any).vendor?.slug : undefined,
          vendorLogo: record.vendor ? (record as any).vendor?.logo : undefined,
          // Maintainer
          maintainer: record.maintainer ? (record as any).maintainer?.id : undefined,
          maintainerName: record.maintainer ? (record as any).maintainer?.name : undefined,
          maintainerSlug: record.maintainer ? (record as any).maintainer?.slug : undefined,
          maintainerLogo: maintainerLogo ?? undefined,
          // Links
          githubUrl: record.github ?? undefined,
          documentationUrl: record.documentationUrl ?? undefined,
          referenceUrl: record.referenceUrl ?? undefined,
          // README content
          readmeUrl: record.readmeUrl ?? undefined,
          readmeMarkdown: record.readmeMarkdown ?? undefined,
          // Technology templates
          quickStartTemplate: record.technology ? (record as any).technology?.quickStartTemplate : undefined,
          prerequisitesTemplate: record.technology ? (record as any).technology?.prerequisitesTemplate : undefined,
          // Domain-specific
          controlCount: record.controlCount ?? undefined,
          stigId: record.stigId ?? undefined,
          benchmarkVersion: record.benchmarkVersion ?? undefined,
          isFeatured: record.isFeatured ?? undefined,
        }
      })

      // Group by content type
      const validation = items.filter(item => item.contentType === 'validation')
      const hardening = items.filter(item => item.contentType === 'hardening')

      console.log(`✓ Loaded ${items.length} content items (${validation.length} validation, ${hardening.length} hardening)`)
      return { items, validation, hardening }
    }
    catch (error) {
      console.error('Failed to load content from database:', error)

      // Return empty arrays instead of crashing build
      return { items: [], validation: [], hardening: [] }
    }
  },
})
