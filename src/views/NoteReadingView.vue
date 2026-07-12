<script setup lang="ts">
import TrainingMenu from '@/components/TrainingMenu.vue'

const items = [
  {
    to: '/training/clef-treble',
    label: 'Treble Clef',
    icons: ['mdi:music-clef-treble'],
  },
  {
    to: '/training/clef-bass',
    label: 'Bass Clef',
    icons: ['mdi:music-clef-bass'],
  },
  {
    to: '/training/mixed',
    label: 'Mixed',
    icons: ['mdi:music-clef-treble', 'mdi:music-clef-bass'],
  },
]
</script>

<template>
  <TrainingMenu :items="items" />
</template>
