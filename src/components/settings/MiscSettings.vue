<script setup lang="ts">
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import SelectButton from '@/volt/SelectButton.vue'
import SecondaryButton from '@/volt/SecondaryButton.vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { resetLocalStorage } from '@/utils/stats'
import setTheme from '@/utils/setTheme'

/** FLAG: reset-stats feature is incomplete — hidden for now */
const showResetStats = false

const confirm = useConfirm()
const toast = useToast()

const confirmResetStats = () => {
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
  <div class="flex flex-col gap-5">
    <div>
      <label for="theme" class="font-bold block mb-1">Theme</label>
      <small id="theme-help" class="block text-(--text-muted)">
        System follows your device's light/dark preference.
      </small>
      <SelectButton
        v-model="theme"
        :options="options"
        id="theme"
        aria-describedby="theme-help"
        class="mt-2"
      />
    </div>
    <!-- FLAG: reset-stats is incomplete — hidden until the feature is done.
         Flip showResetStats in the script to bring it back. -->
    <div v-if="showResetStats">
      <!-- Exception: destructive action — error color for label, icon and outline -->
      <SecondaryButton
        variant="outlined"
        @click="confirmResetStats()"
        label="Reset Stats"
        aria-describedby="reset-stats-help"
        class="w-full text-(--error-text)! border-(--error-text)!"
      >
        <template #icon>
          <Icon icon="mdi:restore" width="20" />
        </template>
      </SecondaryButton>
      <small id="reset-stats-help" class="block text-(--text-muted) mt-1">
        Permanently clears your guess history and accuracy stats.
      </small>
    </div>
  </div>
</template>
