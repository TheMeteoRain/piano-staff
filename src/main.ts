import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

interface VersionFile {
  version: string
  sha: string
}

async function main() {
  let versionFile: VersionFile = {
    version: 'unknown',
    sha: 'unknown',
  }

  try {
    const res = await fetch('/version.json')
    const data = (await res.json()) as VersionFile
    versionFile = data
  } catch (err) {
    console.warn('Failed to fetch version.json:', err)
  }

  if (
    import.meta.env.PROD &&
    import.meta.env.VITE_FARO_ACTIVE === 'true' &&
    versionFile.version !== 'unknown'
  ) {
    initializeFaro({
      url: import.meta.env.VITE_FARO_URL,
      app: {
        name: import.meta.env.VITE_FARO_APP_NAME,
        version: versionFile.version,
        environment: 'production',
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation(),
      ],
    })
  }

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
}

main()
