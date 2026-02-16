/**
 * Tools Data Loader
 *
 * Loads SAF tools (apps/CLIs/libraries) from Pocketbase for database-driven app pages
 */

import type { ToolFeature, ToolResource } from '../database/schema'
import PocketBase from 'pocketbase'
import { defineLoader } from 'vitepress'

export interface ToolDemo {
  label: string
  url: string
}

export interface DistributionLink {
  label: string
  href: string
}

export interface ToolDistribution {
  id: string
  name: string
  slug: string
  displayName?: string
  description?: string
  deploymentDescription?: string
  iconOverride?: string
  showOnPage: boolean
  sortOrder: number
  registryUrl?: string
  github?: string
  documentationUrl?: string
  installCommand?: string
  links?: DistributionLink[]
  distributionType?: {
    id: string
    name: string
    slug: string
    displayName?: string
    icon?: string
  }
  registry?: {
    id: string
    name: string
    displayName?: string
    website?: string
  }
}

export interface ToolItem {
  // Core
  id: string
  slug: string
  name: string
  description?: string
  longDescription?: string
  logo?: string

  // URLs
  website?: string
  github?: string
  documentationUrl?: string
  demos?: ToolDemo[]

  // Classification
  toolType?: string
  primaryCapability?: {
    id: string
    slug: string
    name: string
  }

  // Related data
  distributions: ToolDistribution[]
  features: ToolFeature[]
  resources: ToolResource[]
}

interface ToolsData {
  tools: ToolItem[]
}

// Use environment variables or defaults for authentication
const pbUrl = process.env.PB_URL || 'http://localhost:8090'
const pbEmail = process.env.PB_ADMIN_EMAIL || 'admin@localhost.com'
const pbPassword = process.env.PB_ADMIN_PASSWORD || 'testpassword123'

export default defineLoader({
  async load(): Promise<ToolsData> {
    const pb = new PocketBase(pbUrl)

    // Authenticate
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    // Get all tools with expanded relations
    const toolRecords = await pb.collection('tools').getFullList({
      expand: 'primary_capability',
      sort: 'name',
    })

    // Load related data for each tool
    const tools: ToolItem[] = []

    for (const tool of toolRecords) {
      // Get distributions for this tool
      const distributions = await pb.collection('distributions').getFullList({
        filter: `tool="${tool.id}"`,
        expand: 'distribution_type,registry',
        sort: 'sort_order,name',
      })

      // Get features for this tool
      const features = await pb.collection('tool_features').getFullList<ToolFeature>({
        filter: `tool="${tool.id}"`,
        sort: 'sort_order',
      })

      // Get resources for this tool
      const resources = await pb.collection('tool_resources').getFullList<ToolResource>({
        filter: `tool="${tool.id}"`,
        sort: 'sort_order',
      })

      // Parse demos JSON
      let demos: ToolDemo[] = []
      if (tool.demos) {
        try {
          demos = typeof tool.demos === 'string' ? JSON.parse(tool.demos) : tool.demos
        }
        catch (e) {
          console.warn(`Failed to parse demos for tool ${tool.name}:`, e)
        }
      }

      // Map distributions
      const mappedDistributions: ToolDistribution[] = distributions.map((d: any) => {
        let links: DistributionLink[] = []
        if (d.links) {
          try {
            links = typeof d.links === 'string' ? JSON.parse(d.links) : d.links
          }
          catch (e) {
            console.warn(`Failed to parse links for distribution ${d.name}:`, e)
          }
        }

        return {
          id: d.id,
          name: d.name,
          slug: d.slug,
          displayName: d.display_name,
          description: d.description,
          deploymentDescription: d.deployment_description,
          iconOverride: d.icon_override,
          showOnPage: d.show_on_page ?? true,
          sortOrder: d.sort_order ?? 0,
          registryUrl: d.registry_url,
          github: d.github,
          documentationUrl: d.documentation_url,
          installCommand: d.install_command,
          links,
          distributionType: d.expand?.distribution_type
            ? {
                id: d.expand.distribution_type.id,
                name: d.expand.distribution_type.name,
                slug: d.expand.distribution_type.slug,
                displayName: d.expand.distribution_type.display_name,
                icon: d.expand.distribution_type.icon,
              }
            : undefined,
          registry: d.expand?.registry
            ? {
                id: d.expand.registry.id,
                name: d.expand.registry.name,
                displayName: d.expand.registry.display_name,
                website: d.expand.registry.website,
              }
            : undefined,
        }
      })

      tools.push({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        longDescription: tool.long_description,
        logo: tool.logo,
        website: tool.website,
        github: tool.github,
        documentationUrl: tool.documentation_url,
        demos,
        toolType: tool.tool_type,
        primaryCapability: tool.expand?.primary_capability
          ? {
              id: tool.expand.primary_capability.id,
              slug: tool.expand.primary_capability.slug,
              name: tool.expand.primary_capability.name,
            }
          : undefined,
        distributions: mappedDistributions,
        features,
        resources,
      })
    }

    return { tools }
  },
})

declare const data: ToolsData
export { data }
