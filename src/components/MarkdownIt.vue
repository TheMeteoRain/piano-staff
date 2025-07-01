<script setup lang="ts">
import MarkdownIt from 'markdown-it'

defineProps({
  source: {
    type: String,
    default: 'asd',
  },
})

const markdown = new MarkdownIt()
</script>

<template>
  <div v-html="markdown.render(source)" />
</template>
