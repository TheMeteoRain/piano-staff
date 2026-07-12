<script setup lang="ts">
import TrainingMenu from '@/components/TrainingMenu.vue'

const items = [
  {
    to: '/training/keys/flat',
    label: 'Flat keys',
    icons: ['mdi:music-accidental-flat'],
  },
  {
    to: '/training/keys/sharp',
    label: 'Sharp keys',
    icons: ['mdi:music-accidental-sharp'],
  },
  {
    to: '/training/keys/mixed',
    label: 'Mixed',
    icons: ['mdi:music-accidental-flat', 'mdi:music-accidental-sharp'],
  },
]
</script>

<template>
  <TrainingMenu :items="items" />
</template>
