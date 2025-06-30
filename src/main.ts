import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { pwaPlugin } from '@/plugins/pwa'

interface VersionInfo {
  version: string
  sha: string
}

async function main() {
  let versionInfo: VersionInfo = {
    version: 'unknown',
    sha: 'unknown',
  }

  try {
    const res = await fetch('/version.json')
    const data = (await res.json()) as VersionInfo
    versionInfo = data
  } catch (err) {
    console.warn('Failed to fetch version.json:', err)
  }

  if (
    import.meta.env.PROD &&
    import.meta.env.VITE_FARO_ACTIVE === 'true' &&
    versionInfo.version !== 'unknown'
  ) {
    initializeFaro({
      url: import.meta.env.VITE_FARO_URL,
      app: {
        name: import.meta.env.VITE_FARO_APP_NAME,
        version: versionInfo.version,
        environment: 'production',
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation(),
      ],
    })
  }

  const app = createApp(App)
  app.config.globalProperties.$versionInfo = versionInfo
  app.config.globalProperties.$github =
    'https://github.com/TheMeteoRain/piano-staff'

  app.use(createPinia())
  app.use(pwaPlugin())
  app.use(router)

  app.mount('#app')
}

main()
