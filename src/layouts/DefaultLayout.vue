<script setup lang="ts">
import { usePWAServiceWorker } from '@/plugins/PWAServiceWorker'
import Button from '@/volt/Button.vue'
import Message from '@/volt/Message.vue'
import SecondaryButton from '@/volt/SecondaryButton.vue'

defineProps({
  header: String,
})

const { registration, needRefresh, updateServiceWorker } = usePWAServiceWorker()

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
  <header>
    <h1 class="text-3xl">{{ header }}</h1>
  </header>
  <div v-if="needRefresh" class="card">
    <Message>
      <p>New version available</p>
      <br />
      <div class="grid gap-5 grid-flow-col">
        <SecondaryButton
          @click="needRefresh = false"
          label="Cancel"
          variant="raised"
        >
          <template #icon>
            <i class="pi pi-times" style="font-size: 1rem"></i>
          </template>
        </SecondaryButton>
        <Button @click="refreshApp" label="Update">
          <template #icon>
            <i class="pi pi-refresh" style="font-size: 1rem"></i>
          </template>
        </Button>
      </div>
    </Message>
  </div>

  <main>
    <slot />
  </main>
</template>
