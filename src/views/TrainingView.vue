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
  {
    to: '/training/musicsheet',
    label: 'Music sheet',
    icons: ['mdi:card-text-outline', 'mdi:music'],
  },
]
</script>

<template>
  <TrainingMenu :items="items" />
</template>
