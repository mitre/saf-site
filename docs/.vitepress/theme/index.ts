import DefaultTheme from 'vitepress/theme'
import './custom.css'
import ProfileCard from './components/ProfileCard.vue'
import ProfileFilters from './components/ProfileFilters.vue'
import ProfileDetail from './components/ProfileDetail.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ProfileCard', ProfileCard)
    app.component('ProfileFilters', ProfileFilters)
    app.component('ProfileDetail', ProfileDetail)
  }
}
