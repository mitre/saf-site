/**
 * Training Data Loader
 *
 * Loads training classes and upcoming sessions from Pocketbase
 */

import PocketBase from 'pocketbase'
import { defineLoader } from 'vitepress'

interface TrainingClass {
  id: string
  title: string
  slug: string
  description: string
  objectives: string[]
  course_url?: string
  youtube_url?: string
  order: number
}

interface UpcomingSession {
  id: string
  class: string
  date: string
  signup_url?: string
  status: 'scheduled' | 'cancelled'
  expand?: {
    class?: TrainingClass
  }
}

interface TrainingData {
  classes: TrainingClass[]
  upcomingSessions: UpcomingSession[]
}

// Use environment variables or defaults for authentication
const pbUrl = process.env.PB_URL || 'http://localhost:8090'
const pbEmail = process.env.PB_ADMIN_EMAIL || 'admin@localhost.com'
const pbPassword = process.env.PB_ADMIN_PASSWORD || 'testpassword123'

export default defineLoader({
  async load(): Promise<TrainingData> {
    const pb = new PocketBase(pbUrl)

    // Authenticate
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    // Get all training classes
    const classes = await pb.collection('training_classes').getFullList<TrainingClass>({
      sort: 'order',
    })

    // Get upcoming sessions (future dates, not cancelled) with class expansion
    const now = new Date().toISOString()
    const upcomingSessions = await pb.collection('upcoming_sessions').getFullList<UpcomingSession>({
      filter: `date >= "${now}" && status != "cancelled"`,
      sort: 'date',
      expand: 'class',
    })

    return {
      classes,
      upcomingSessions,
    }
  },
})

declare const data: TrainingData
export { data }
