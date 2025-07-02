<script setup lang="ts">
import MarkdownIt from 'markdown-it'

defineProps({
  source: {
    type: String,
    default: '',
  },
})

const markdown = new MarkdownIt()
</script>

<template>
  <div v-html="markdown.render(source)" />
</template>
