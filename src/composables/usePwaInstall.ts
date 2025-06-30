import { usePwaStore } from '@/stores/pwa'
import { onMounted, onUnmounted } from 'vue'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePwaInstall() {
  const pwa = usePwaStore()
  const handleBeforeInstallPrompt = (e: Event) => {
    if ('prompt' in e) {
      e.preventDefault()
      pwa.setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
  }

  onMounted(() => {
    if ('onbeforeinstallprompt' in window) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })
}
