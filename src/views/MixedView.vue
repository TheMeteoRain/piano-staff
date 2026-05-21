<script setup lang="ts">
import NoteExercise from '../components/NoteExercise.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <main>
    <NoteExercise
      exercise="mixed"
      :secondsBetweenNotes="settings.values.secondsBetweenNotes"
      :questionTimeLimit="settings.values.questionTimeLimit"
      :showLastNoteQuessed="settings.showLastNoteQuessed"
    />
  </main>
</template>
