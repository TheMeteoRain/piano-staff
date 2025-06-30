import { inject, ref, type App, type InjectionKey, type Ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export const pwaKey: InjectionKey<PWAPluginInjectReturnType> = Symbol('pwa')

export type PWAPluginInjectReturnType = ReturnType<typeof useRegisterSW> & {
  registration: Ref<ServiceWorkerRegistration | undefined>
}

export function pwaPlugin() {
  const registration = ref<ServiceWorkerRegistration | undefined>(undefined)
  const state = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      registration.value = r
      //   if (r) {
      //     setInterval(() => {
      //       if (r.installing || !navigator) return
      //       if ('connection' in navigator && !navigator.onLine) return
      //       const channel = new MessageChannel()
      //       channel.port1.onmessage = (event) => {
      //         console.log('SW response:', event.data)
      //       }
      //       navigator.serviceWorker.controller?.postMessage(
      //         { type: 'GET_VERSION' },
      //         [channel.port2],
      //       )
      //     }, 5000)
      //   }
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

export function usePWA() {
  const state = inject(pwaKey)
  if (!state) throw new Error('PWA plugin not provided')
  return state
}
