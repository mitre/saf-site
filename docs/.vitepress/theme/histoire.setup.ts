/**
 * Histoire setup file
 * Imports our theme CSS for component styling in stories.
 */
import './custom.css'
import { defineSetupVue3 } from '@histoire/plugin-vue'

export const setupVue3 = defineSetupVue3(({ app }) => {
  // CSS is imported above - no additional setup needed
})
