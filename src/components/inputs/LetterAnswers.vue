<script setup lang="ts">
type Note = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

/** Note-letter answer buttons arranged in a circle. One of the swappable
 * sight-reading input methods (see also PianoKeyboard). */
defineProps<{ notes: Note[]; disabled: boolean }>()
const emit = defineEmits<{ answer: [note: Note] }>()
</script>

<template>
  <div class="note-buttons">
    <button
      v-for="note in notes"
      :key="note"
      @click="emit('answer', note)"
      :disabled="disabled"
      class="note-button cursor-pointer disabled:cursor-not-allowed"
    >
      {{ note }}
    </button>
  </div>
</template>

<style scoped>
.note-buttons {
  position: relative;
  height: 300px;
}

button {
  min-width: 56px;
  min-height: 56px;
  border-radius: 50%;
  background: var(--primary-fill);
  color: var(--on-primary);
  font-size: 1.125rem;
  font-weight: 600;
  border: 2px solid var(--primary-hover);
  box-shadow:
    0 4px 12px rgba(93, 33, 222, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.25s ease,
    opacity 0.25s ease;
}

button:not(:disabled):hover {
  background: var(--primary-hover);
  border-color: var(--primary-active);
  animation: none;
  box-shadow:
    0 6px 16px rgba(93, 33, 222, 0.4),
    0 3px 6px rgba(0, 0, 0, 0.15);
}

button:not(:disabled):active {
  background: var(--primary-active);
  animation: none;
  box-shadow:
    0 2px 8px rgba(93, 33, 222, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.1);
}

button:not(:disabled):hover::after,
button:not(:disabled):active::after {
  animation: none;
  opacity: 0;
}

button:not(:disabled) {
  animation: pulse-bg 2.4s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * -0.34s);
}

button:not(:disabled)::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 2px solid var(--primary-hover);
  pointer-events: none;
  animation: ripple 2.4s ease-out infinite;
  animation-delay: calc(var(--i, 0) * -0.34s);
}

@keyframes pulse-bg {
  0%,
  100% {
    background-color: var(--primary);
  }
  50% {
    background-color: var(--primary-hover);
  }
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  70%,
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

button:disabled {
  background: var(--primary-fill);
  color: var(--on-primary);
  border: 2px solid var(--primary);
  box-shadow: none;
  filter: saturate(0.45);
  opacity: 0.8;
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  button:not(:disabled),
  button:not(:disabled)::after {
    animation: none;
  }
  button:not(:disabled)::after {
    opacity: 0;
  }
}

.note-button {
  position: absolute;
  line-height: initial;
  padding: 1rem 2rem;
  top: 40%;
  left: 40%;
  transform-origin: center;
  /* Buttons sit on a circle: 50deg apart starting at -90deg, with a 10deg
     extra gap before the 5th. The counter-rotation keeps them upright. */
  --angle: calc((var(--i) - 1) * 50deg - 90deg + var(--gap, 0deg));
  --radius: 120px;
  transform: rotate(var(--angle)) translate(var(--radius))
    rotate(calc(-1 * var(--angle)));
}

.note-button:nth-child(1) {
  --i: 1;
}
.note-button:nth-child(2) {
  --i: 2;
}
.note-button:nth-child(3) {
  --i: 3;
}
.note-button:nth-child(4) {
  --i: 4;
}
.note-button:nth-child(5) {
  --i: 5;
}
.note-button:nth-child(6) {
  --i: 6;
}
.note-button:nth-child(7) {
  --i: 7;
}
.note-button:nth-child(n + 5) {
  --gap: 10deg;
}

@media (width >= 40rem) {
  .note-buttons {
    height: 400px;
  }
  .note-button {
    line-height: 40px;
    top: 45%;
    left: 45%;
    --radius: 180px;
    min-width: 64px;
    min-height: 64px;
    font-size: 1.25rem;
  }
}
</style>
