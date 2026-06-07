<script setup lang="ts">
import Button from '@/volt/Button.vue'
import { Icon } from '@iconify/vue'
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <section>
    <nav class="flex flex-col gap-5">
      <router-link
        to="/training/clef-treble"
        v-slot="{ href, navigate }"
        class="flex-grow"
      >
        <Button
          :href="href"
          @click="navigate"
          label="Treble Clef"
          class="w-full h-20"
        >
          <template #icon>
            <Icon icon="mdi:music-clef-treble" width="20" /></template
        ></Button>
      </router-link>
      <router-link
        to="/training/clef-bass"
        v-slot="{ href, navigate }"
        class="flex-grow"
      >
        <Button
          :href="href"
          @click="navigate"
          label="Bass Clef"
          class="w-full w-90 h-20"
        >
          <template #icon>
            <Icon icon="mdi:music-clef-bass" width="20" /></template
        ></Button>
      </router-link>
      <router-link
        to="/training/mixed"
        v-slot="{ href, navigate }"
        class="flex-grow"
      >
        <Button
          :href="href"
          @click="navigate"
          label="Mixed"
          class="w-full h-20"
        >
          <template #icon>
            <Icon icon="mdi:music-clef-treble" width="20" /><Icon
              icon="mdi:music-clef-bass"
              width="20" /></template
        ></Button>
      </router-link>
      <Button disabled label="More coming..." class="w-full h-20">
        <template #icon> <Icon icon="mdi:wrench" width="20" /></template
      ></Button>
    </nav>

    <RouterView />
  </section>
</template>

<style>
@media (min-width: 1024px) {
  .training {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
