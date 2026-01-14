import DefaultTheme from 'vitepress/theme'
import './custom.css'
import ProfileCard from './components/ProfileCard.vue'
import ProfileFilters from './components/ProfileFilters.vue'
import ContentDetail from './components/ContentDetail.vue'
// Legacy alias - ProfileDetail now uses ContentDetail
import ProfileDetail from './components/ProfileDetail.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ProfileCard', ProfileCard)
    app.component('ProfileFilters', ProfileFilters)
    app.component('ContentDetail', ContentDetail)
    // Keep ProfileDetail for backwards compatibility
    app.component('ProfileDetail', ProfileDetail)
  }
}
