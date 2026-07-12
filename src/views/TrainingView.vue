<script setup lang="ts">
import TrainingMenu from '@/components/TrainingMenu.vue'

const items = [
  {
    to: '/training/notes',
    label: 'Note reading',
    icons: ['mdi:music-clef-treble', 'mdi:music-clef-bass'],
  },
  {
    to: '/training/keys',
    label: 'Key signatures',
    icons: ['mdi:music-accidental-sharp', 'mdi:music-accidental-flat'],
  },
]
</script>

<template>
  <TrainingMenu :items="items" />
</template>
