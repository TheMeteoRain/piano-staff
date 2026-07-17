<script setup lang="ts">
import { ref, computed } from 'vue'
import PianoKeyboard from '@/components/inputs/PianoKeyboard.vue'
import SelectButton from '@/volt/SelectButton.vue'
import Button from '@/volt/Button.vue'
import Divider from '@/volt/Divider.vue'

const CHROMA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// key buttons: naturals A–G first, then accidentals with both enharmonic names
const KEYS: { label: string; pc: number }[] = [
  { label: 'A', pc: 9 },
  { label: 'B', pc: 11 },
  { label: 'C', pc: 0 },
  { label: 'D', pc: 2 },
  { label: 'E', pc: 4 },
  { label: 'F', pc: 5 },
  { label: 'G', pc: 7 },
  { label: 'Ab/G#', pc: 8 },
  { label: 'Bb/A#', pc: 10 },
  { label: 'Db/C#', pc: 1 },
  { label: 'Eb/D#', pc: 3 },
  { label: 'Gb/F#', pc: 6 },
]

// interval sets (semitones from the root) per chord category
const CATEGORIES: Record<string, number[]> = {
  Major: [0, 4, 7],
  Minor: [0, 3, 7],
  Seventh: [0, 4, 7, 10],
  Augmented: [0, 4, 8],
  Diminished: [0, 3, 6],
}
// short labels so all five fit the segmented control on small screens
const CATEGORY_OPTIONS = [
  { label: 'Maj', value: 'Major' },
  { label: 'Min', value: 'Minor' },
  { label: '7th', value: 'Seventh' },
  { label: 'Aug', value: 'Augmented' },
  { label: 'Dim', value: 'Diminished' },
]

type Hand = 'Right' | 'Left' | 'None'
// standard root-position fingering, keyed by note count (3 = triad, 4 = 7th)
const FINGERING: Record<'Right' | 'Left', Record<number, number[]>> = {
  Right: { 3: [1, 3, 5], 4: [1, 2, 3, 5] },
  Left: { 3: [5, 3, 1], 4: [5, 3, 2, 1] },
}
// ordered so Left is on the left and Right on the right (None in the middle)
const hands: Hand[] = ['Left', 'None', 'Right']

const rootPc = ref(0) // 0 = C
const category = ref('Major')
const hand = ref<Hand>('None')

// chord notes (root position, root in octave 4) as name+octave ids
const chord = computed(() => {
  const rootMidi = 48 + rootPc.value // C4 = midi 48
  return (CATEGORIES[category.value] ?? []).map((interval) => {
    const midi = rootMidi + interval
    return CHROMA[midi % 12] + Math.floor(midi / 12)
  })
})
const fingers = computed(() => {
  if (hand.value === 'None') return {}
  const seq = FINGERING[hand.value][chord.value.length] ?? []
  const map: Record<string, number> = {}
  chord.value.forEach((id, i) => {
    if (seq[i] != null) map[id] = seq[i]
  })
  return map
})
// Two fixed layouts keyed to the root: roots C–E use a C-based window (C4–E5),
// roots F–B an F-based one (F4–B5). Each ends right after a complete black-key
// group (C→E gives 2-3-2 blacks, F→B gives 3-2-3) so the keyboard never shows a
// cut-off black group, and each still holds its group's widest chord. The
// layout only changes when you cross between the two groups.
const range = computed<[string, string]>(() =>
  [0, 1, 2, 3, 4].includes(rootPc.value) ? ['C4', 'E5'] : ['F4', 'B5'],
)

const rootLabel = computed(
  () => KEYS.find((k) => k.pc === rootPc.value)?.label ?? '',
)
const chordName = computed(
  () => `${rootLabel.value} ${category.value.toLowerCase()}`,
)
</script>

<template>
  <section class="chart">
    <p class="name">
      {{ chordName }}<span v-if="hand !== 'None'"> · {{ hand }} hand</span>
    </p>

    <PianoKeyboard
      readonly
      :highlight="chord"
      :fingers="fingers"
      :range="range"
    />

    <Divider />

    <div class="keys">
      <Button
        v-for="key in KEYS"
        :key="key.label"
        :label="key.label"
        :variant="rootPc === key.pc ? undefined : 'outlined'"
        class="key-btn"
        @click="rootPc = key.pc"
      />
    </div>

    <SelectButton
      v-model="category"
      :options="CATEGORY_OPTIONS"
      optionLabel="label"
      optionValue="value"
      :allowEmpty="false"
      aria-label="Chord type"
    />
    <SelectButton
      v-model="hand"
      :options="hands"
      :allowEmpty="false"
      aria-label="Hand"
    />
  </section>
</template>

<style scoped>
.chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  max-width: 640px;
  margin: 0 auto;
}
.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  width: 100%;
}
.key-btn {
  width: 100%;
}
.name {
  font-size: 1.3rem;
  font-weight: 700;
  text-transform: capitalize;
}
</style>
