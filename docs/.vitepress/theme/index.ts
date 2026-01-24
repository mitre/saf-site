import DefaultTheme from 'vitepress/theme'
// Content library components
import ContentCard from './components/ContentCard.vue'

import ContentDetail from './components/ContentDetail.vue'
import ContentFilters from './components/ContentFilters.vue'
import FeatureItem from './components/FeatureItem.vue'
import FeatureList from './components/FeatureList.vue'

// Logo display components
import LogoGrid from './components/LogoGrid.vue'
import LogoMarquee from './components/LogoMarquee.vue'

// Page layout components
import PageSection from './components/PageSection.vue'
import PillarBadge from './components/PillarBadge.vue'
import Placeholder from './components/Placeholder.vue'
import Skeleton from './components/Skeleton.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Content library
    app.component('ContentCard', ContentCard)
    app.component('ContentFilters', ContentFilters)
    app.component('ContentDetail', ContentDetail)
    app.component('PillarBadge', PillarBadge)

    // Logo display
    app.component('LogoGrid', LogoGrid)
    app.component('LogoMarquee', LogoMarquee)

    // Page layout
    app.component('PageSection', PageSection)
    app.component('FeatureItem', FeatureItem)
    app.component('FeatureList', FeatureList)
    app.component('Skeleton', Skeleton)
    app.component('Placeholder', Placeholder)
  },
}
