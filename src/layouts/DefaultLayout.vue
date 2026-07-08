<script setup lang="ts">
defineProps({
  header: String,
})
</script>

<template>
  <header>
    <h1 class="text-3xl">{{ header }}</h1>
  </header>

  <main>
    <slot />
  </main>
</template>
