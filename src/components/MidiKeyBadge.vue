<script setup lang="ts">
// Small pill showing which MIDI key triggers a navigation target, shown next to
// that target while MIDI navigation is active.
defineProps<{ label: string }>()
</script>

<template>
  <span class="midi-key-badge" aria-hidden="true">{{ label }}</span>
</template>

<style scoped>
.midi-key-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  padding: 0 0.28rem;
  height: 1.15rem;
  font-family: ui-monospace, monospace;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1;
  /* high contrast against the primary-colored tiles/buttons: inverted text
     color, so it's light-on-dark and dark-on-light in either theme */
  color: var(--background);
  background: var(--text);
  border-radius: 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}
</style>
