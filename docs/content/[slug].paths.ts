/**
 * Content Detail Page Paths Generator
 *
 * Generates dynamic routes for all content items (validation + hardening).
 * Uses Drizzle relational queries for automatic FK expansion.
 */

import { db } from '../.vitepress/database/db'

// Simplified related content item (camelCase)
interface RelatedContent {
  id: string
  slug: string
  name: string
  description: string
  contentType: 'validation' | 'hardening'
  technologyName: string
}

export default {
  async paths() {
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

      console.log(`✓ Generating ${records.length} content detail pages`)

      return records.map((record) => {
        // Get maintainer logo with organization fallback
        const maintainerLogo = record.maintainer?.logo || record.maintainer?.organization?.logo

        // Find related content (same target, different content_type)
        const relatedContent: RelatedContent[] = records
          .filter(r =>
            r.id !== record.id
            && r.target === record.target
            && r.target, // Must have a target to be related
          )
          .map(r => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            description: r.description || '',
            contentType: r.contentType as 'validation' | 'hardening',
            technologyName: r.technology?.name || '',
          }))

        return {
          params: {
            slug: record.slug,
            // Pass all content data to the template (camelCase)
            content: {
              id: record.id,
              slug: record.slug,
              name: record.name,
              description: record.description || '',
              longDescription: record.longDescription || '',
              version: record.version || '',
              status: record.status || 'active',
              contentType: record.contentType,
              // Target
              targetName: record.target?.name || '',
              targetSlug: record.target?.slug || '',
              // Standard
              standardName: record.standard?.name || '',
              standardShortName: record.standard?.shortName || '',
              standardSlug: record.standard?.slug || '',
              // Technology
              technologyName: record.technology?.name || '',
              technologySlug: record.technology?.slug || '',
              technologyLogo: record.technology?.logo || '',
              // Vendor
              vendorName: record.vendor?.name || '',
              vendorSlug: record.vendor?.slug || '',
              vendorLogo: record.vendor?.logo || '',
              // Maintainer
              maintainerName: record.maintainer?.name || '',
              maintainerSlug: record.maintainer?.slug || '',
              maintainerLogo: maintainerLogo || '',
              // Links
              githubUrl: record.github || '',
              documentationUrl: record.documentationUrl || '',
              referenceUrl: record.referenceUrl || '',
              // README content
              readmeUrl: record.readmeUrl || '',
              readmeMarkdown: record.readmeMarkdown || '',
              // Technology templates
              quickStartTemplate: record.technology?.quickStartTemplate || '',
              prerequisitesTemplate: record.technology?.prerequisitesTemplate || '',
              // Domain-specific
              controlCount: record.controlCount || 0,
              stigId: record.stigId || '',
              benchmarkVersion: record.benchmarkVersion || '',
              license: record.license || '',
              releaseDate: record.releaseDate || '',
            },
            // Related content for cross-linking (camelCase)
            relatedContent,
          },
        }
      })
    }
    catch (error) {
      console.error('Failed to generate content paths:', error)
      return []
    }
  },
}
