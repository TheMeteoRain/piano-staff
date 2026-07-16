<script setup lang="ts">
import Button from '@/volt/Button.vue'
import { Icon } from '@iconify/vue'
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import ConfirmDialog from '@/volt/ConfirmDialog.vue'
import Toast from '@/volt/Toast.vue'
import { useToast } from 'primevue/usetoast'
import type { ToastMessageOptions } from 'primevue/toast'
import { usePWA } from './composables/usePWA'
import setTheme from '@/utils/setTheme'

const toast = useToast()
usePWA()
onMounted(() => {
  setTheme()
})

const visible = ref(false)

const onClose = () => {
  visible.value = false
}
function closeToast(t: ToastMessageOptions) {
  toast.remove(t)
  onClose()
}
</script>

<template>
  <ConfirmDialog />
  <Toast />
  <Toast position="top-center" group="tc" @close="onClose">
    <template #message="slotProps">
      <div
        class="flex flex-col items-start flex-auto"
        @click="() => closeToast(slotProps.message)"
      >
        {{ slotProps.message.summary }}
        <div class="font-medium text-lg my-4">
          {{ slotProps.message.detail }}
        </div>
      </div>
    </template>
  </Toast>

  <div class="h-[calc(100vh-3.5rem)]" id="content">
    <RouterView />
    <div class="box h-[3.5rem]" :data-hidden="false" />
  </div>
  <footer>
    <nav class="box footer-bar fixed bottom-0 left-0 right-0" :data-hidden="false">
      <div class="footer-inner flex">
      <router-link
        to="/"
        v-slot="{ href, navigate, isActive }"
        class="flex-grow"
      >
        <Button
          :href="href"
          @click="navigate"
          :variant="isActive ? undefined : 'outlined'"
          label="Home"
          :class="['w-full h-[3.5rem] border-l-0 border-b-0 border-t-0 rounded-none']"
        >
          <template #icon> <Icon icon="mdi:home" width="20" /> </template
        ></Button>
      </router-link>
      <router-link
        to="/training"
        v-slot="{ href, navigate, isExactActive }"
        class="flex-grow"
      >
        <Button
          :href="href"
          @click="navigate"
          :variant="isExactActive ? undefined : 'outlined'"
          label="Training"
          :class="['w-full h-[3.5rem] border-l-0 border-b-0 border-t-0 rounded-none']"
        >
          <template #icon>
            <Icon icon="mdi:music-clef-treble" width="20" /> </template
        ></Button>
      </router-link>
      <router-link
        to="/settings"
        v-slot="{ href, navigate, isActive }"
        class="flex-grow"
      >
        <Button
          :href="href"
          @click="navigate"
          :variant="isActive ? undefined : 'outlined'"
          label="Settings"
          :class="[
            'w-full h-[3.5rem] border-l-0 border-b-0 border-r-0 border-t-0 rounded-none',
          ]"
        >
          <template #icon> <Icon icon="mdi:settings" width="20" /> </template
        ></Button>
      </router-link>
      </div>
    </nav>
  </footer>
</template>

<style scoped>
@media (min-width: 1024px) {
  .logo {
    margin: 0 2rem 0 0;
  }
}
/* the footer nav is the full-width bar: an opaque background so page content
   doesn't show through the sides, plus a single edge-to-edge top divider. The
   buttons are centered inside via .footer-inner. It's the bottom-nav transition
   group, so it stays stable during navigation (no flash). */
.footer-bar {
  max-width: none;
  display: flex;
  justify-content: center;
  background: var(--background);
  border-top: 1px solid var(--primary);
}
.footer-inner {
  width: 100%;
  max-width: 512px; /* narrower row so the buttons aren't full-width on tablets */
}

.box {
  opacity: 1;
  transform: translateY(0);
  transition:
    transform 0.7s ease-out,
    opacity 0.7s ease-out;
}

.box[data-hidden='true'] {
  opacity: 0;
  transform: translateY(100%); /* or scale(0.95) for a shrink effect */
  pointer-events: none;
}
</style>
