<script setup lang="ts">
import Markdown from '@/components/MarkdownIt.vue'
import { onMounted, ref } from 'vue'

const licenses = ref<string | undefined>(undefined)

onMounted(async () => {
  const res = await fetch('/NOTICE.md')
  licenses.value = await res.text()
  console.log(licenses.value)
})
</script>

<template>
  <header>
    <h1 class="text-3xl">Licenses</h1>
  </header>
  <main class="break-all">
    <Markdown v-if="typeof licenses === 'string'" :source="licenses" />
  </main>
</template>

<style></style>
