<script setup lang="ts">
import { watch } from 'vue'
import { useStorage } from '@vueuse/core'
import InputNumber from '@/volt/InputNumber.vue'
import setTheme from '@/utils/setTheme'
import { useSettingsStore } from '@/stores/settings'
import { Form } from '@primevue/forms'
import ToggleSwitch from '@/volt/ToggleSwitch.vue'
const settings = useSettingsStore()

const theme = useStorage('theme', 'System', localStorage)

watch(theme, async (newValue) => {
  setTheme(newValue)
})
</script>

<template>
  <section>
    <Form class="grid lg:grid-cols-2 gap-4 w-full">
      <label for="secondsBetweenNotes" class="font-bold block mb-2">
        Time between notes (seconds)
      </label>
      <InputNumber
        size="large"
        inputId="secondsBetweenNotes"
        name="secondsBetweenNotes"
        :min="1"
        :max="10"
        v-model="settings.secondsBetweenNotes"
      />
      <label for="questionTimeLimit" class="font-bold block mb-2">
        Question time limit (seconds)
      </label>
      <InputNumber
        size="large"
        inputId="questionTimeLimit"
        name="questionTimeLimit"
        :min="1"
        :max="10"
        v-model="settings.questionTimeLimit"
      />
      <label for="showLastNoteQuessed" class="font-bold block mb-2">
        Show last note quessed
      </label>
      <ToggleSwitch
        inputId="showLastNoteQuessed"
        v-model="settings.showLastNoteQuessed"
      />
    </Form>
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
