/**
 * Dynamic route generator for app detail pages
 *
 * Generates paths for /apps/[slug] pages from Pocketbase tools collection
 */

import process from 'node:process'
import PocketBase from 'pocketbase'

const pbUrl = process.env.PB_URL || 'http://localhost:8090'
const pbEmail = process.env.PB_ADMIN_EMAIL || 'admin@localhost.com'
const pbPassword = process.env.PB_ADMIN_PASSWORD || 'testpassword123'

export default {
  async paths() {
    const pb = new PocketBase(pbUrl)

    // Authenticate
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    // Get all tools
    const tools = await pb.collection('tools').getFullList({
      sort: 'name',
    })

    // Generate path for each tool
    return tools.map(tool => ({
      params: {
        slug: tool.slug,
        // Pass minimal data - the page will use the data loader
        toolName: tool.name,
      },
    }))
  },
}
