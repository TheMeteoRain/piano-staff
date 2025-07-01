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

const toast = useToast()
usePWA()
onMounted(() => {
  const theme = localStorage.getItem('theme')
  if (theme === 'Dark' || theme === 'Light') {
    document.documentElement.setAttribute('data-theme', theme.toLowerCase())
  }
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

  <div class="h-screen flex flex-col">
    <div class="flex-grow" id="content">
      <RouterView />
      <div class="box h-[5rem]" :data-hidden="false" />
    </div>
  </div>
  <footer>
    <nav class="box flex fixed bottom-0 left-0 right-0" :data-hidden="false">
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
          :class="['w-full h-[5rem] border-l-0 border-b-0']"
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
          :class="['w-full h-[5rem] border-l-0 border-b-0']"
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
          :class="['w-full h-[5rem] border-l-0 border-b-0 border-r-0']"
        >
          <template #icon> <Icon icon="mdi:settings" width="20" /> </template
        ></Button>
      </router-link>
    </nav>
  </footer>
</template>

<style scoped>
@media (min-width: 1024px) {
  .logo {
    margin: 0 2rem 0 0;
  }
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
