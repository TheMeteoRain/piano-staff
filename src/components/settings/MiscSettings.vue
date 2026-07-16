<script setup lang="ts">
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import SelectButton from '@/volt/SelectButton.vue'
import setTheme from '@/utils/setTheme'

const theme = useStorage('theme', 'System', localStorage)
const options = ref(['System', 'Light', 'Dark'])

watch(theme, (newValue) => {
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
  </div>
</template>
