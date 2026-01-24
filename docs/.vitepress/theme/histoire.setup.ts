import { defineSetupVue3 } from '@histoire/plugin-vue'
/**
 * Histoire setup file
 * Imports our theme CSS for component styling in stories.
 */
import './custom.css'

export const setupVue3 = defineSetupVue3(({ app: _app }) => {
  // CSS is imported above - no additional setup needed
})
