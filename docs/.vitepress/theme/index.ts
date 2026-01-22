import DefaultTheme from 'vitepress/theme'
import './custom.css'

// Unified content library components
import ContentCard from './components/ContentCard.vue'
import ContentFilters from './components/ContentFilters.vue'
import ContentDetail from './components/ContentDetail.vue'
import PillarBadge from './components/PillarBadge.vue'

// Legacy components (backwards compatibility)
import ProfileCard from './components/ProfileCard.vue'
import ProfileFilters from './components/ProfileFilters.vue'
import ProfileDetail from './components/ProfileDetail.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Unified content library
    app.component('ContentCard', ContentCard)
    app.component('ContentFilters', ContentFilters)
    app.component('ContentDetail', ContentDetail)
    app.component('PillarBadge', PillarBadge)

    // Legacy components (for /validate/ route)
    app.component('ProfileCard', ProfileCard)
    app.component('ProfileFilters', ProfileFilters)
    app.component('ProfileDetail', ProfileDetail)
  }
}
