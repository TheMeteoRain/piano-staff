<script setup lang="ts">
import KeySignatureExercise from '@/components/KeySignatureExercise.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <main>
    <KeySignatureExercise
      :questionTimeLimit="settings.values.questionTimeLimit"
      :errorsAllowed="settings.values.errorsAllowed"
      :soundEnabled="settings.values.soundEnabled"
    />
  </main>
</template>
