import { defineStore } from 'pinia'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function getPWADisplayMode() {
  if (document.referrer.startsWith('android-app://')) return 'twa'
  if (window.matchMedia('(display-mode: browser)').matches) return 'browser'
  if (
    // @ts-expect-error iOS support
    window.navigator.standalone === true
  )
    return 'standalone'
  if (window.matchMedia('(display-mode: standalone)').matches)
    return 'standalone'
  if (window.matchMedia('(display-mode: minimal-ui)').matches)
    return 'minimal-ui'
  if (window.matchMedia('(display-mode: fullscreen)').matches)
    return 'fullscreen'
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches)
    return 'window-controls-overlay'

  return 'unknown'
}

export function isMobileCheck() {
  return !window.matchMedia('(hover: hover)').matches
}

export const usePwaStore = defineStore('pwa', {
  state: () => ({
    isMobile: isMobileCheck(),
    isInstalled: false,
    deferredPrompt: null as BeforeInstallPromptEvent | null,
    displayMode: getPWADisplayMode() as ReturnType<typeof getPWADisplayMode>,
  }),
  actions: {
    checkIsMobile() {
      this.isMobile = isMobileCheck()
    },
    setDeferredPrompt(event: BeforeInstallPromptEvent) {
      this.deferredPrompt = event
      this.checkIfInstalled()
    },
    async promptInstall() {
      if (!this.deferredPrompt || this.isInstalled) {
        return
      }

      await this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      // thought I would need to nullify this, but it doesn't seem to matter
      // leaving nullified for now
      this.deferredPrompt = null

      if (outcome === 'accepted') {
        this.isInstalled = true
      } else if (outcome === 'dismissed') {
        //
      }
    },
    async checkIfInstalled() {
      // possible app install detection
      // https://web.dev/learn/pwa/detection
      // https://micahjon.com/2021/pwa-twa-detection/
      // const relatedApps = await navigator.getInstalledRelatedApps()
      // const PWAisInstalled = relatedApps.length > 0
      const displayMode = getPWADisplayMode()
      let value = false

      if (['browser', 'unknown'].find((v) => v === displayMode)) {
        value = false
      } else {
        value = true
      }

      this.displayMode = displayMode
      this.isInstalled = value
      return value
    },
  },
})
