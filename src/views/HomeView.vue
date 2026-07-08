<script setup lang="ts">
import { usePwaStore } from '@/stores/pwa'
import Card from '@/volt/Card.vue'
import ContrastButton from '@/volt/ContrastButton.vue'
import { Icon } from '@iconify/vue'

const pwaStore = usePwaStore()
pwaStore.checkIfInstalled()
</script>

<template>
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
        functionality even offline.
      </p>

      <!-- iOS: no install prompt exists, guide the manual Share flow -->
      <ol
        v-if="pwaStore.isIOS && !pwaStore.deferredPrompt"
        class="mt-2 flex flex-col gap-2"
      >
        <li class="flex items-center gap-2">
          <span class="font-bold">1.</span>
          <span>Tap the Share button</span>
          <Icon
            icon="mdi:export-variant"
            width="20"
            class="text-(--primary-600)"
          />
          <span>in the browser toolbar</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="font-bold">2.</span>
          <span>Choose “Add to Home Screen”</span>
          <Icon
            icon="mdi:plus-box-outline"
            width="20"
            class="text-(--primary-600)"
          />
        </li>
        <li class="flex items-center gap-2">
          <span class="font-bold">3.</span>
          <span>Tap “Add” — done!</span>
        </li>
      </ol>

      <!-- browsers without install support (e.g. desktop Firefox/Safari) -->
      <p
        v-else-if="!pwaStore.deferredPrompt"
        class="mt-2 text-(--text-muted)"
      >
        Your current browser can’t install this app. Open it in Chrome, Edge, or
        Safari on your phone to add it to your home screen.
      </p>
    </template>
    <template v-if="pwaStore.deferredPrompt" #footer>
      <div>
        <ContrastButton
          @click="pwaStore.promptInstall()"
          label="Install To Device"
        >
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
