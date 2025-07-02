<script setup lang="ts">
import { usePWAServiceWorker } from '@/plugins/PWAServiceWorker'
import Button from '@/volt/Button.vue'
import Message from '@/volt/Message.vue'
import SecondaryButton from '@/volt/SecondaryButton.vue'
import { Icon } from '@iconify/vue'

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
  <header :class="[needRefresh && 'mb-0']">
    <h1 class="text-3xl">{{ header }}</h1>
  </header>
  <div v-if="needRefresh" class="card">
    <Message>
      <p>New version available</p>
      <div class="grid gap-5 grid-flow-col">
        <Button @click="refreshApp" label="Update">
          <template #icon>
            <Icon icon="mdi:cellphone-arrow-down" width="20" />
          </template>
        </Button>
        <SecondaryButton
          @click="needRefresh = false"
          label="Cancel"
          variant="raised"
        >
          <template #icon>
            <Icon icon="mdi:cellphone-arrow-down" width="20" />
          </template>
        </SecondaryButton>
      </div>
    </Message>
  </div>

  <main>
    <slot />
  </main>
</template>
