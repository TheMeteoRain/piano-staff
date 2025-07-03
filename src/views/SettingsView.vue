<script setup lang="ts">
import AppVersion from '@/components/AppInfo.vue'
import SelectButton from '@/volt/SelectButton.vue'
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import Fieldset from '@/volt/Fieldset.vue'
import { resetLocalStorage } from '@/utils/stats'
import SecondaryButton from '@/volt/SecondaryButton.vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import setTheme from '@/utils/setTheme'

const confirm = useConfirm()
const toast = useToast()

const confirmSave = () => {
  confirm.require({
    message: 'Are you sure you want to proceed?',
    header: 'Confirmation',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Confirm',
    },
    accept: () => {
      toast.add({
        severity: 'info',
        closable: false,
        summary: 'Confirmed',
        group: 'tc',
        detail: 'Stats have been reseted',
        life: 3000,
      })
      resetLocalStorage()
    },
    reject: () => {
      toast.add({
        severity: 'error',
        closable: false,
        summary: 'Rejected',
        group: 'tc',
        detail: 'Stats have not been reseted',
        life: 3000,
      })
    },
  })
}

const theme = useStorage('theme', 'System', localStorage)
const options = ref(['System', 'Light', 'Dark'])

watch(theme, async (newValue) => {
  setTheme(newValue)
})
</script>

<template>
  <section>
    <div class="card flex flex-col justify-center align-items-center w-full">
      <div class="flex justify-around items-center">
        <label for="theme" class="mr-5">Theme</label>
        <SelectButton v-model="theme" :options="options" id="theme" />
      </div>
      <br />
      <SecondaryButton
        variant="outlined"
        @click="confirmSave()"
        label="Reset Stats"
      >
        <template #icon>
          <Icon icon="mdi:cellphone-arrow-down" width="20" />
        </template>
      </SecondaryButton>
      <br />
      <Fieldset legend="App Information">
        <AppVersion />
      </Fieldset>
    </div>
  </section>
</template>

<style>
label {
  font-weight: 600;
}
main {
  /* min-height: calc(100vh - 5rem); */
}
@media (min-width: 1024px) {
  .settings {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
