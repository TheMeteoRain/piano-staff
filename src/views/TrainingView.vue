<script setup lang="ts">
import TrainingMenu from '@/components/TrainingMenu.vue'

const items = [
  {
    to: '/training/notes',
    label: 'Sight reading',
    icons: ['mdi:music-clef-treble', 'mdi:music-clef-bass'],
  },
  {
    to: '/training/keys',
    label: 'Key signatures',
    icons: ['mdi:music-accidental-sharp', 'mdi:music-accidental-flat'],
  },
  {
    to: '/training/chords',
    label: 'Chords',
    icons: ['mdi:music-circle-outline', 'mdi:piano'],
  },
]
</script>

<template>
  <TrainingMenu :items="items" />
</template>
