<script setup lang="ts">
import Markdown from '@/components/MarkdownIt.vue'
import { onMounted, ref } from 'vue'

const licenses = ref<string | undefined>(undefined)

onMounted(async () => {
  const res = await fetch('/NOTICE.md')
  licenses.value = await res.text()
})
</script>

<template>
  <header>
    <h1 class="text-3xl">Licenses</h1>
  </header>
  <main class="licenses">
    <Markdown v-if="typeof licenses === 'string'" :source="licenses" />
    <p v-else class="loading">Loading…</p>
  </main>
</template>

<style scoped>
.licenses {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  line-height: 1.6;
}
.loading {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem 0;
}

/* readable, wrapping styles for the rendered NOTICE.md */
.licenses :deep(h1),
.licenses :deep(h2),
.licenses :deep(h3) {
  font-weight: 700;
  line-height: 1.25;
  margin: 1.75rem 0 0.5rem;
}
.licenses :deep(h1) {
  font-size: 1.4rem;
}
.licenses :deep(h2) {
  font-size: 1.15rem;
}
.licenses :deep(h3) {
  font-size: 1rem;
}
.licenses :deep(p),
.licenses :deep(ul),
.licenses :deep(ol) {
  margin: 0.5rem 0;
}
.licenses :deep(li) {
  margin: 0.15rem 0;
}
.licenses :deep(a) {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.licenses :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 2rem 0;
}
.licenses :deep(pre) {
  background: rgba(127, 127, 127, 0.12);
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
  white-space: pre-wrap;
}
.licenses :deep(code) {
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
}
/* long license text and URLs wrap instead of forcing horizontal scroll, but
   without breaking normal words mid-character like break-all did */
.licenses :deep(p),
.licenses :deep(li),
.licenses :deep(a),
.licenses :deep(code),
.licenses :deep(pre) {
  overflow-wrap: anywhere;
}
</style>
