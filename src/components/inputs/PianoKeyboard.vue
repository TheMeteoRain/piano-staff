<script setup lang="ts">
/** A one-octave piano keyboard as an answer surface. Emits the tapped note
 * name ("C", "C#", …). A swappable sight-reading input method (see also
 * LetterAnswers). Reusable for chords / circle-of-fifths later. */
defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ answer: [note: string] }>()

const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
// black keys positioned over the white-key boundaries (percent from left)
const blackKeys = [
  { note: 'C#', left: 9.8 },
  { note: 'D#', left: 24.1 },
  { note: 'F#', left: 52.6 },
  { note: 'G#', left: 66.9 },
  { note: 'A#', left: 81.2 },
]
</script>

<template>
  <div class="piano" :class="{ disabled }">
    <div class="whites">
      <button
        v-for="note in whiteKeys"
        :key="note"
        type="button"
        class="white-key"
        :disabled="disabled"
        @click="emit('answer', note)"
      >
        <span class="label">{{ note }}</span>
      </button>
    </div>
    <button
      v-for="bk in blackKeys"
      :key="bk.note"
      type="button"
      class="black-key"
      :style="{ left: bk.left + '%' }"
      :disabled="disabled"
      @click="emit('answer', bk.note)"
    />
  </div>
</template>

<style scoped>
.piano {
  position: relative;
  width: 100%;
  height: 230px;
  user-select: none;
  touch-action: manipulation;
}
.piano.disabled {
  opacity: 0.85;
}

.whites {
  display: flex;
  height: 100%;
  gap: 2px;
}

.white-key {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.6rem;
  background: var(--background-0);
  border: 1px solid var(--primary-200);
  border-radius: 0 0 8px 8px;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
}
.white-key:not(:disabled):active {
  background: var(--primary-100);
}
.white-key:disabled {
  cursor: not-allowed;
}

.black-key {
  position: absolute;
  top: 0;
  width: 9%;
  height: 62%;
  background: var(--primary-800);
  border: 1px solid var(--primary-900);
  border-radius: 0 0 6px 6px;
  cursor: pointer;
}
.black-key:not(:disabled):active {
  background: var(--primary-700);
}
.black-key:disabled {
  cursor: not-allowed;
}
</style>
