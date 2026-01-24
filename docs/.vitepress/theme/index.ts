import DefaultTheme from 'vitepress/theme'
import './custom.css'

// Content library components
import ContentCard from './components/ContentCard.vue'
import ContentFilters from './components/ContentFilters.vue'
import ContentDetail from './components/ContentDetail.vue'
import PillarBadge from './components/PillarBadge.vue'

// Logo display components
import LogoGrid from './components/LogoGrid.vue'
import LogoMarquee from './components/LogoMarquee.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ContentCard', ContentCard)
    app.component('ContentFilters', ContentFilters)
    app.component('ContentDetail', ContentDetail)
    app.component('PillarBadge', PillarBadge)
    app.component('LogoGrid', LogoGrid)
    app.component('LogoMarquee', LogoMarquee)
  }
}
