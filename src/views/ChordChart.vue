<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PianoKeyboard from '@/components/inputs/PianoKeyboard.vue'
import SelectButton from '@/volt/SelectButton.vue'
import Button from '@/volt/Button.vue'
import Divider from '@/volt/Divider.vue'
import {
  SCALE_INTERVALS,
  SCALE_FINGERINGS,
  type ScaleType,
} from '@/data/scaleFingerings'

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
const CHORD_CATEGORY_OPTIONS = [
  { label: 'Maj', value: 'Major' },
  { label: 'Min', value: 'Minor' },
  { label: '7th', value: 'Seventh' },
  { label: 'Aug', value: 'Augmented' },
  { label: 'Dim', value: 'Diminished' },
]
// only Major and Minor have a correct, standard scale + fingering, so the
// quality narrows to those two in scale mode (7th/aug/dim have no textbook scale)
const SCALE_CATEGORY_OPTIONS = [
  { label: 'Major', value: 'Major' },
  { label: 'Minor', value: 'Minor' },
]
const MODE_OPTIONS = [
  { label: 'Chord', value: 'chord' },
  { label: 'Scale', value: 'scale' },
]

type Hand = 'Right' | 'Left' | 'None'
// standard root-position fingering, keyed by note count (3 = triad, 4 = 7th)
const FINGERING: Record<'Right' | 'Left', Record<number, number[]>> = {
  Right: { 3: [1, 3, 5], 4: [1, 2, 3, 5] },
  Left: { 3: [5, 3, 1], 4: [5, 3, 2, 1] },
}
// ordered so Left is on the left and Right on the right (None in the middle)
const hands: Hand[] = ['Left', 'None', 'Right']

const mode = ref<'chord' | 'scale'>('chord')
const rootPc = ref(0) // 0 = C
const category = ref('Major')
const hand = ref<Hand>('None')

// scale mode only offers Major/Minor — drop back to Major if a chord-only
// quality (7th/aug/dim) was selected when switching over
watch(mode, (m) => {
  if (m === 'scale' && category.value !== 'Major' && category.value !== 'Minor')
    category.value = 'Major'
})
const categoryOptions = computed(() =>
  mode.value === 'scale' ? SCALE_CATEGORY_OPTIONS : CHORD_CATEGORY_OPTIONS,
)
const scaleType = computed<ScaleType>(() =>
  category.value === 'Minor' ? 'minor' : 'major',
)

// highlighted notes (root position, root in octave 4) as name+octave ids —
// a chord's stacked intervals, or a one-octave scale run
const chord = computed(() => {
  const rootMidi = 48 + rootPc.value // C4 = midi 48
  const intervals =
    mode.value === 'scale'
      ? SCALE_INTERVALS[scaleType.value]
      : (CATEGORIES[category.value] ?? [])
  return intervals.map((interval) => {
    const midi = rootMidi + interval
    return CHROMA[midi % 12] + Math.floor(midi / 12)
  })
})
const scaleSeq = computed(() =>
  mode.value === 'scale' && hand.value !== 'None'
    ? (SCALE_FINGERINGS[scaleType.value][rootPc.value]?.[
        hand.value === 'Left' ? 'lh' : 'rh'
      ] ?? [])
    : [],
)
const fingers = computed(() => {
  if (hand.value === 'None') return {}
  const seq =
    mode.value === 'scale'
      ? scaleSeq.value
      : (FINGERING[hand.value][chord.value.length] ?? [])
  const map: Record<string, number> = {}
  chord.value.forEach((id, i) => {
    if (seq[i] != null) map[id] = seq[i]
  })
  return map
})
// Notes where the hand shifts position (thumb-under / cross-over). Going up the
// scale, a shift is where the finger numbers reverse their natural run: the
// right hand normally rises (a drop = thumb tucks under), the left hand
// normally falls (a rise = a finger crosses over the thumb). Mark the note the
// hand lands on. Only meaningful for scales with a chosen hand.
const crossovers = computed(() => {
  const seq = scaleSeq.value
  if (seq.length === 0) return []
  const rh = hand.value === 'Right'
  const ids = chord.value
  const marks: string[] = []
  for (let i = 1; i < seq.length; i++) {
    const shifted = rh ? seq[i] < seq[i - 1] : seq[i] > seq[i - 1]
    if (shifted) marks.push(ids[i])
  }
  return marks
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
  () =>
    `${rootLabel.value} ${category.value.toLowerCase()}` +
    (mode.value === 'scale' ? ' scale' : ''),
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
      :crossovers="crossovers"
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
      v-model="mode"
      :options="MODE_OPTIONS"
      optionLabel="label"
      optionValue="value"
      :allowEmpty="false"
      aria-label="Chord or scale"
    />
    <SelectButton
      v-model="category"
      :options="categoryOptions"
      optionLabel="label"
      optionValue="value"
      :allowEmpty="false"
      :aria-label="mode === 'scale' ? 'Scale type' : 'Chord type'"
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
