import DefaultTheme from 'vitepress/theme'
import './custom.css'
import ProfileCard from './components/ProfileCard.vue'
import ProfileFilters from './components/ProfileFilters.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ProfileCard', ProfileCard)
    app.component('ProfileFilters', ProfileFilters)
  }
}
