<script setup lang="ts">
import TrainingMenu from '@/components/TrainingMenu.vue'

const items = [
  {
    to: '/training/chords/circle',
    label: 'Circle of fifths',
    icons: ['mdi:music-circle-outline'],
  },
  {
    to: '/training/chords/chart',
    label: 'Chords & scales',
    icons: ['mdi:piano', 'mdi:hand-back-right'],
  },
]
</script>

<template>
  <TrainingMenu :items="items" />
</template>
