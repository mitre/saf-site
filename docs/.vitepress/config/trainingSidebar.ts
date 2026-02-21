/**
 * Generate training sidebar with dynamic class links
 */
import PocketBase from 'pocketbase'

interface TrainingClass {
  id: string
  title: string
  slug: string
  order: number
}

const pbUrl = process.env.PB_URL || 'http://localhost:8090'
const pbEmail = process.env.PB_ADMIN_EMAIL || 'admin@localhost.com'
const pbPassword = process.env.PB_ADMIN_PASSWORD || 'testpassword123'

export async function getTrainingSidebar() {
  try {
    const pb = new PocketBase(pbUrl)
    await pb.collection('_superusers').authWithPassword(pbEmail, pbPassword)

    const classes = await pb.collection('training_classes').getFullList<TrainingClass>({
      sort: 'order',
    })

    return [
      {
        text: 'Training',
        link: '/training/',
        items: [
          { text: 'Upcoming Classes', link: '/training/#upcoming-classes' },
          {
            text: 'All Classes',
            link: '/training/#classes',
            items: classes.map(cls => ({
              text: cls.title.replace(/\s+Class$/i, ''),
              link: `/training/#class-${cls.slug}`,
            })),
          },
        ],
      },
    ]
  }
  catch (error) {
    console.warn('Failed to load training classes for sidebar:', error)
    // Fallback to basic sidebar
    return [
      {
        text: 'Training',
        link: '/training/',
        items: [
          { text: 'Upcoming Classes', link: '/training/#upcoming-classes' },
          { text: 'All Classes', link: '/training/#classes' },
        ],
      },
    ]
  }
}
