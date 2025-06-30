<script setup lang="ts">
import { resetLocalStorage } from '@/utils/stats'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { usePWA } from '@/plugins/pwa'
import { Icon } from '@iconify/vue'
import { usePwaStore } from '@/stores/pwa'

const { registration, needRefresh, updateServiceWorker } = usePWA()

usePwaInstall()
const pwaStore = usePwaStore()

async function refreshApp() {
  const channel = new MessageChannel()
  registration.value?.waiting?.postMessage(
    {
      type: 'UPDATE',
    },
    [channel.port2],
  )
  channel.port1.onmessage = () => {
    needRefresh.value = false
    updateServiceWorker(true)
  }
}
</script>

<template>
  <main>
    <h1 class="text-3xl mt-20">Piano Note Accuracy Exercises</h1>
    <p>Click one of the navigation links to start.</p>
    <h2 class="text-2xl mt-10">Miscellaneous</h2>
    <button
      @click="resetLocalStorage"
      class="border-color-[#0353a4] border-1 cursor-pointer px-4 py-2 text-black hover:bg-[#0353a4] hover:text-white transition-colors"
    >
      Reset Stats
    </button>
    <div v-if="needRefresh" class="pwa-update">
      <p>New version available.</p>
      <button
        @click="refreshApp"
        class="border-color-[#0353a4] border-1 cursor-pointer px-4 py-2 text-black hover:bg-[#0353a4] hover:text-white transition-colors"
      >
        Refresh
      </button>
      <button
        @click="needRefresh = false"
        class="border-color-[#0353a4] border-1 cursor-pointer px-4 py-2 text-black hover:bg-[#0353a4] hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>

    <div v-if="pwaStore.deferredPrompt && !pwaStore.isInstalled">
      <button
        @click="pwaStore.promptInstall"
        class="border-color-[#0353a4] border-1 cursor-pointer px-4 py-2 text-black hover:bg-[#0353a4] hover:text-white transition-colors"
      >
        <Icon icon="mdi:cellphone-arrow-down" width="30" class="icon-inline" />
        Install To Device
      </button>
    </div>
  </main>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.icon-inline {
  display: inline;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
