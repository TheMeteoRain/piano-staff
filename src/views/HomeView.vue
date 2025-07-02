<script setup lang="ts">
import { usePwaStore } from '@/stores/pwa'
import Card from '@/volt/Card.vue'
import ContrastButton from '@/volt/ContrastButton.vue'
import Dialog from '@/volt/Dialog.vue'
import { Icon } from '@iconify/vue'
import { ref, watch } from 'vue'

const pwaStore = usePwaStore()
pwaStore.checkIfInstalled()

const dialogVisible = ref(false)

function closeDialog() {
  if (dialogVisible.value) {
    dialogVisible.value = false
  }
}

watch(dialogVisible, (value) => {
  if (!value) {
    window.removeEventListener('click', closeDialog)
  }
})

function installPWA() {
  if (!pwaStore.deferredPrompt) {
    setTimeout(() => {
      dialogVisible.value = true
      window.addEventListener('click', closeDialog)
    }, 10)

    return
  }

  pwaStore.promptInstall()
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :closable="false"
    header="Unsupported browser"
    class="lg:w-100 md:w-3/4 w-9/10"
  >
    <p>
      Unsupported Browser: Your current browser doesn't support installing this
      app to your device. You can continue using it in your browser, or switch
      to another browser.
    </p>
    <br />
    <p>
      Press anywhere to close
      <i class="pi pi-times"></i>
    </p>
  </Dialog>
  <Card class="mb-5">
    <template #title>Training</template>
    <template #content>
      <p>
        Train your musical reading skills. Explore by using the main navigation
        at the bottom
      </p>
    </template>
  </Card>
  <Card
    v-if="!pwaStore.isMobile && pwaStore.displayMode !== 'standalone'"
    class="mb-5"
  >
    <template #title>Designed for mobile devices</template>
    <template #content>
      <p>
        This application is optimized for mobile devices. While it is accessible
        on desktop, the interface is designed with mobile in mind, and you may
        have a better overall experience using a mobile device.
      </p>
    </template>
  </Card>
  <Card v-if="!pwaStore.isInstalled" class="mb-5">
    <template #title>Install locally</template>
    <template #content>
      <p>
        Install this app on your device for the best experience! It works just
        like a regular app — faster access, smoother performance, and full
        functionality even offline. Tap the install icon and enjoy the
        convenience anytime, anywhere.
      </p>
    </template>
    <template #footer>
      <div>
        <ContrastButton @click="installPWA" label="Install To Device">
          <template #icon>
            <Icon icon="mdi:cellphone-arrow-down" width="20" />
          </template>
        </ContrastButton>
      </div>
    </template>
  </Card>
  <Card class="mb-5">
    <template #title>Support the work</template>
    <template #content>
      <p>
        This application will always be free and have zero advertisements. If
        this application has helped you on your musical journey and you are
        financially secure, consider giving a small donation for the work put
        into this application.
      </p>
    </template>
    <template #footer>
      <a href="https://www.buymeacoffee.com/meteorain" target="_blank"
        ><img
          src="/support-1.webp"
          alt="Buy Me A Coffee"
          style="height: 60px !important; width: 217px !important"
      /></a>
    </template>
  </Card>
</template>

<style scoped>
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
