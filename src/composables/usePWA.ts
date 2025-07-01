import { usePwaStore } from '@/stores/pwa'
import { useToast } from 'primevue/usetoast'
import { onMounted, onUnmounted } from 'vue'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const toast = useToast()
  const pwaStore = usePwaStore()
  const handleBeforeInstallPrompt = (e: Event) => {
    if ('prompt' in e) {
      e.preventDefault()
      pwaStore.setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
  }

  const handleAppInstalled = (_e: Event) => {
    pwaStore.checkIfInstalled()
    toast.add({
      severity: 'success',
      summary: 'Success',
      group: 'tc',
      detail: 'App installed locally',
      life: 5000,
    })
  }

  onMounted(() => {
    if ('onbeforeinstallprompt' in window) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
    window.addEventListener('resize', pwaStore.checkIsMobile)
    window.addEventListener('appinstalled', handleAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', pwaStore.checkIsMobile)
    window.removeEventListener('appinstalled', handleAppInstalled)
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })
}
