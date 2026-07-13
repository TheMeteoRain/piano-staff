import { inject, ref, type App, type InjectionKey, type Ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export const pwaKey: InjectionKey<PWAPluginInjectReturnType> = Symbol('pwa')

export type PWAPluginInjectReturnType = ReturnType<typeof useRegisterSW> & {
  registration: Ref<ServiceWorkerRegistration | undefined>
}

export function PWAServiceWorkerPlugin() {
  const registration = ref<ServiceWorkerRegistration | undefined>(undefined)
  const state = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      registration.value = r
      if (!r) return
      // Browsers only check for a new service worker on navigation, so a
      // long-open session could sit on an old version. Poll hourly (skipping
      // when offline or an update is already in flight) so autoUpdate can pick
      // up and apply new deployments without the user relaunching.
      const ONE_HOUR = 60 * 60 * 1000
      setInterval(() => {
        if (r.installing || !navigator.onLine) return
        r.update()
      }, ONE_HOUR)
    },
    onOfflineReady() {
      // called when sw installed
      console.log('onOfflineReady')
    },
    onNeedRefresh() {
      console.log('onNeedRefresh')
    },
  })

  return {
    install(app: App) {
      app.provide(pwaKey, { ...state, registration })
    },
  }
}

export function usePWAServiceWorker() {
  const state = inject(pwaKey)
  if (!state) throw new Error('PWA plugin not provided')
  return state
}
