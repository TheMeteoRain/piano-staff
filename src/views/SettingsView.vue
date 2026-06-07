<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import TrainingSettings from '@/components/settings/TrainingSettings.vue'
import MiscSettings from '@/components/settings/MiscSettings.vue'
import Fieldset from '@/volt/Fieldset.vue'
import Button from '@/volt/Button.vue'

const versionInfo =
  getCurrentInstance()?.appContext.config.globalProperties.$versionInfo
</script>

<template>
  <section class="flex flex-col gap-5 w-full">
    <Fieldset legend="Exercise">
      <TrainingSettings />
    </Fieldset>
    <Fieldset legend="Misc">
      <MiscSettings />
    </Fieldset>
    <router-link to="/settings/about" v-slot="{ href, navigate }">
      <Button
        :href="href"
        @click="navigate"
        variant="outlined"
        :label="`App Info · v${versionInfo.version}`"
        class="w-full h-20"
      >
        <template #icon>
          <Icon icon="mdi:information-outline" width="20" />
        </template>
      </Button>
    </router-link>
  </section>
</template>
