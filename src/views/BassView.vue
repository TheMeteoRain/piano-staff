<script setup lang="ts">
import NoteExercise from '../components/NoteExercise.vue'
import { useSettingsStore } from '@/stores/settings'
import { useRoute } from 'vue-router'

const settings = useSettingsStore()
const route = useRoute()
/** optional deterministic note sequence, e.g. /training/clef-treble?seed=42 */
const seed = route.query.seed ? Number(route.query.seed) : undefined
</script>

<template>
  <main>
    <NoteExercise
      exercise="bass"
      :secondsBetweenNotes="settings.values.secondsBetweenNotes"
      :questionTimeLimit="settings.values.questionTimeLimit"
      :showLastNoteQuessed="settings.showLastNoteQuessed"
      :pauseDuration="settings.values.pauseDuration"
      :errorsAllowed="settings.values.errorsAllowed"
      :seed="seed"
    />
  </main>
</template>
