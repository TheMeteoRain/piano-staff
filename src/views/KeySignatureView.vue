<script setup lang="ts">
import KeySignatureExercise from '@/components/KeySignatureExercise.vue'
import { useSettingsStore } from '@/stores/settings'
import type { KeyMode } from '@/utils/keySignatures'

defineProps<{ mode?: KeyMode }>()

const settings = useSettingsStore()
</script>

<template>
  <main>
    <KeySignatureExercise
      :mode="mode ?? 'mixed'"
      :questionTimeLimit="settings.values.questionTimeLimit"
      :errorsAllowed="settings.values.errorsAllowed"
      :soundEnabled="settings.values.soundEnabled"
    />
  </main>
</template>
