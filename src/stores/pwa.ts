import { defineStore } from 'pinia'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export const usePwaStore = defineStore('pwa', {
  state: () => ({
    isInstalled: false,
    deferredPrompt: null as BeforeInstallPromptEvent | null,
  }),
  actions: {
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
    checkIfInstalled() {
      this.isInstalled =
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-expect-error iOS support
        window.navigator.standalone === true
    },
  },
})
