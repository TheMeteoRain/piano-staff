import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4173',
    setupNodeEvents(on) {
      // Give the browser a large window so tall cy.viewport() sizes (e.g. the
      // 1080x1920 store-asset frames) aren't clamped to the default ~720px
      // window height when capturing screenshots.
      on('before:browser:launch', (browser, launchOptions) => {
        const width = 1280
        const height = 2000
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push(`--window-size=${width},${height}`)
          launchOptions.args.push('--force-device-scale-factor=1')
        } else if (browser.name === 'electron') {
          launchOptions.preferences.width = width
          launchOptions.preferences.height = height
        }
        return launchOptions
      })
    },
  },
})
