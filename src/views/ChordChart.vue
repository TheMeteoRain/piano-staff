<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import PianoKeyboard from '@/components/inputs/PianoKeyboard.vue'
import ChordStaff from '@/components/ChordStaff.vue'
import MidiKeyBadge from '@/components/MidiKeyBadge.vue'
import SelectButton from '@/volt/SelectButton.vue'
import Button from '@/volt/Button.vue'
import Divider from '@/volt/Divider.vue'
import {
  SCALE_INTERVALS,
  SCALE_FINGERINGS,
  type ScaleType,
} from '@/data/scaleFingerings'
import { useSettingsStore } from '@/stores/settings'
import { useConfigNav, DISPLAY_KEY } from '@/composables/useConfigNav'
import { useMidiNavStore, midiKeyName } from '@/stores/midiNav'

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
  { label: 'Degrees', value: 'degrees' },
]
const DISPLAY_OPTIONS = [
  { label: 'Piano', value: 'piano' },
  { label: 'Staff', value: 'staff' },
]

// --- diatonic harmony (Degrees mode) ---------------------------------------
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11] // semitones of the 7 major-scale degrees
// the fixed quality pattern of diatonic triads in a major key
const DIATONIC_QUALITY = [
  'Major', 'Minor', 'Minor', 'Major', 'Major', 'Minor', 'Diminished',
]
const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
const DEGREE_NAMES = [
  'tonic', 'supertonic', 'mediant', 'subdominant',
  'dominant', 'submediant', 'leading tone',
]
const DEGREE_OPTIONS = ROMAN.map((label, i) => ({ label, value: i + 1 }))
// correct note spelling: one letter per scale degree, accidental to match pitch
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]
const ACC = ['𝄫', '♭', '', '♯', '𝄪'] // index = accidental + 2
// major-key tonic spelling per pitch class: [letter index (C=0..B=6), unused]
const KEY_TONIC: Record<number, number> = {
  0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6, // C D E F G A B
  1: 1, 3: 2, 6: 4, 8: 5, 10: 6, // Db Eb Gb Ab Bb (flat spellings)
}
function spell(pc: number, letterIdx: number): string {
  let acc = (((pc - LETTER_PC[letterIdx]) % 12) + 12) % 12
  if (acc > 6) acc -= 12
  return LETTERS[letterIdx] + (ACC[acc + 2] ?? '')
}
function qualitySuffix(q: string): string {
  return q === 'Minor' ? 'm' : q === 'Diminished' ? '°' : ''
}

type Hand = 'Right' | 'Left' | 'None'
// standard root-position fingering, keyed by note count (3 = triad, 4 = 7th)
const FINGERING: Record<'Right' | 'Left', Record<number, number[]>> = {
  Right: { 3: [1, 3, 5], 4: [1, 2, 3, 5] },
  Left: { 3: [5, 3, 1], 4: [5, 3, 2, 1] },
}
// ordered so Left is on the left and Right on the right (None in the middle)
const hands: Hand[] = ['Left', 'None', 'Right']

const mode = ref<'chord' | 'scale' | 'degrees'>('chord')
const rootPc = ref(0) // 0 = C — the key tonic / chord root
const category = ref('Major')
const degree = ref(1) // 1..7, the scale degree in Degrees mode
const hand = ref<Hand>('None')
const display = ref<'piano' | 'staff'>('piano')

// in Degrees mode the shown triad is the diatonic chord on the selected degree:
// its root is the nth scale note and its quality follows the diatonic pattern.
// Everything downstream (keyboard, staff, fingering) then reuses these.
const effectiveRootPc = computed(() =>
  mode.value === 'degrees'
    ? (rootPc.value + MAJOR_STEPS[degree.value - 1]) % 12
    : rootPc.value,
)
const effectiveCategory = computed(() =>
  mode.value === 'degrees'
    ? DIATONIC_QUALITY[degree.value - 1]
    : category.value,
)
// the 7 correctly-spelled scale notes of the current key, e.g. E♭ major →
// E♭ F G A♭ B♭ C D (one letter per degree)
const scaleSpelling = computed(() => {
  const tonicLetter = KEY_TONIC[rootPc.value] ?? 0
  return MAJOR_STEPS.map((semi, i) =>
    spell((rootPc.value + semi) % 12, (tonicLetter + i) % 7),
  )
})
// the harmonised scale — all 7 diatonic triads of the key at a glance
const harmonized = computed(() =>
  ROMAN.map((roman, i) => ({
    degree: i + 1,
    roman,
    name: scaleSpelling.value[i] + qualitySuffix(DIATONIC_QUALITY[i]),
    quality: DIATONIC_QUALITY[i],
  })),
)

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
  const rootMidi = 48 + effectiveRootPc.value // C4 = midi 48
  const intervals =
    mode.value === 'scale'
      ? SCALE_INTERVALS[scaleType.value]
      : (CATEGORIES[effectiveCategory.value] ?? [])
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
  // Degrees mode is a harmony tool, not a fingering one — a block triad always
  // thumbs its root (black or white), so showing 1-3-5 across every diatonic
  // chord reads as "no rule"; drop fingering here.
  if (mode.value === 'degrees' || hand.value === 'None') return {}
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

// --- staff (notation) view -------------------------------------------------
const CHROMA_LOWER = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
// app note id "C#4" -> VexFlow key "c#/4"; optional octave shift
function toVexKey(id: string, octaveShift = 0): string {
  const m = id.match(/^([A-G]#?)(\d+)$/)
  if (!m) return 'c/4'
  return `${m[1].toLowerCase()}/${parseInt(m[2], 10) + octaveShift}`
}
function vexPitch(key: string): number {
  const [n, o] = key.split('/')
  return parseInt(o, 10) * 12 + CHROMA_LOWER.indexOf(n)
}
const byPitch = (a: string, b: string) => vexPitch(a) - vexPitch(b)

// chord: shown two ways — the stacked block chord, then the same notes broken
// (arpeggiated) horizontally, left to right, as real music often writes them.
// scale: a horizontal run of single notes.
const staffGroups = computed<string[][]>(() => {
  const ids = chord.value
  if (mode.value === 'scale') return ids.map((id) => [toVexKey(id)])
  const keys = ids.map((id) => toVexKey(id)).sort(byPitch)
  return [keys, ...keys.map((k) => [k])]
})
const staffCaptions = computed<string[] | undefined>(() => {
  if (mode.value === 'scale') return undefined
  const caps = Array.from({ length: chord.value.length + 1 }, () => '')
  caps[0] = 'block'
  caps[1] = 'broken'
  return caps
})
// block chord = quarter; the broken notes = eighths, beamed together, with a
// barline separating the two versions
const staffDurations = computed<string[] | undefined>(() =>
  mode.value === 'scale'
    ? undefined
    : ['q', ...chord.value.map(() => '8')],
)
const staffBeam = computed<number[] | undefined>(() =>
  mode.value === 'scale' ? undefined : chord.value.map((_, i) => i + 1),
)
const staffBarAfter = computed<number[] | undefined>(() =>
  mode.value === 'scale' ? undefined : [0],
)
// Two fixed layouts keyed to the root: roots C–E use a C-based window (C4–E5),
// roots F–B an F-based one (F4–B5). Each ends right after a complete black-key
// group (C→E gives 2-3-2 blacks, F→B gives 3-2-3) so the keyboard never shows a
// cut-off black group, and each still holds its group's widest chord. The
// layout only changes when you cross between the two groups.
const range = computed<[string, string]>(() =>
  [0, 1, 2, 3, 4].includes(effectiveRootPc.value) ? ['C4', 'E5'] : ['F4', 'B5'],
)

const rootLabel = computed(
  () => KEYS.find((k) => k.pc === rootPc.value)?.label ?? '',
)
const chordName = computed(() => {
  if (mode.value === 'degrees') {
    const i = degree.value - 1
    return (
      `${scaleSpelling.value[0]} major · ${ROMAN[i]} — ` +
      `${scaleSpelling.value[i]} ${DIATONIC_QUALITY[i].toLowerCase()} (${DEGREE_NAMES[i]})`
    )
  }
  return (
    `${rootLabel.value} ${category.value.toLowerCase()}` +
    (mode.value === 'scale' ? ' scale' : '')
  )
})

// --- MIDI config navigation ------------------------------------------------
// A connected instrument can drive every option hands-free (see useMidiConfigNav
// for the key map). Reuses the opt-in MIDI setting so no extra permission prompt.
const settings = useSettingsStore()

function cycle<T>(list: readonly T[], current: T, dir: 1 | -1): T {
  const n = list.length
  return list[(list.indexOf(current) + dir + n) % n]
}

// The Key row is intentionally NOT navigable — you set the key directly (A–G /
// play a note), so cycling through keys here would be pointless. Navigable rows,
// top to bottom: 0 = Type (chord/scale), 1 = Category, 2 = Hand
function changeRow(row: number, dir: 1 | -1) {
  if (row === 0)
    mode.value = cycle(['chord', 'scale', 'degrees'] as const, mode.value, dir)
  else if (row === 1) {
    // the middle row cycles the degree in Degrees mode, else the quality
    if (mode.value === 'degrees')
      degree.value = ((degree.value - 1 + dir + 7) % 7) + 1
    else
      category.value = cycle(
        categoryOptions.value.map((o) => o.value),
        category.value,
        dir,
      )
  } else if (row === 2) hand.value = cycle(hands, hand.value, dir)
}

let snapshot: {
  mode: 'chord' | 'scale' | 'degrees'
  rootPc: number
  category: string
  degree: number
  hand: Hand
} | null = null

const nav = useConfigNav({
  // Degrees mode drops the Hand row, so it has 2 navigable rows instead of 3
  rowCount: () => (mode.value === 'degrees' ? 2 : 3),
  onLeft: (row) => changeRow(row, -1),
  onRight: (row) => changeRow(row, 1),
  onRoot: (pc) => (rootPc.value = pc),
  onToggleDisplay: () =>
    (display.value = display.value === 'piano' ? 'staff' : 'piano'),
  onEnter: () => {
    snapshot = {
      mode: mode.value,
      rootPc: rootPc.value,
      category: category.value,
      degree: degree.value,
      hand: hand.value,
    }
  },
  onExit: (committed) => {
    if (!committed && snapshot) {
      mode.value = snapshot.mode
      rootPc.value = snapshot.rootPc
      category.value = snapshot.category
      degree.value = snapshot.degree
      hand.value = snapshot.hand
    }
    snapshot = null
  },
})
const navActive = nav.active
const navRow = nav.focusedRow
const navVia = nav.enteredVia
const displayKey = midiKeyName(DISPLAY_KEY) // F#7

// surface this view's own nav to the global store, so the footer nav badges +
// keyboard shortcuts (Home/Training/back/forward) light up here too — MIDI notes
// stay reserved for setting the key
const midiNav = useMidiNavStore()
watch(navActive, (open) => midiNav.setHostNav(open))
onUnmounted(() => midiNav.setHostNav(false))
// keyboard navigation is always on (also a simulator); MIDI is opt-in via the
// setting so its permission prompt only fires when the user wants it
const midiConfig = computed(() => settings.values.midiInput && nav.midiSupported)

// this view captures MIDI via its route meta (global nav suspended); it drives
// its own options through useConfigNav, which owns the leader key here
onMounted(() => nav.start({ midi: midiConfig.value }))
onUnmounted(() => nav.stop())
</script>

<template>
  <section class="chart">
    <p class="name" :class="{ 'no-caps': mode === 'degrees' }">
      {{ chordName }}<span v-if="hand !== 'None'"> · {{ hand }} hand</span>
    </p>

    <!-- harmonised scale: all 7 diatonic triads of the key, colour-coded by
         quality; tap one to select that degree -->
    <div v-if="mode === 'degrees'" class="harmonized">
      <button
        v-for="h in harmonized"
        :key="h.degree"
        type="button"
        class="degree-card"
        :class="[h.quality.toLowerCase(), { current: degree === h.degree }]"
        @click="degree = h.degree"
      >
        <span class="roman">{{ h.roman }}</span>
        <span class="chord">{{ h.name }}</span>
      </button>
    </div>

    <div
      v-if="midiConfig || navActive"
      class="midi-config"
      :class="{ active: navActive }"
    >
      <template v-if="navActive">
        <strong>Config</strong> — <kbd>h</kbd><kbd>j</kbd><kbd>k</kbd
        ><kbd>l</kbd> move &amp; change · <kbd>A</kbd>–<kbd>G</kbd> set key &amp;
        exit · <kbd>t</kbd> {{ display === 'piano' ? 'staff' : 'piano' }} ·
        <kbd>Enter</kbd> confirm · <kbd>Esc</kbd> cancel · tap anywhere to exit
        <span v-if="midiConfig" class="midi-line">
          MIDI: B7/A7 move · G7/C8 change · {{ displayKey }}
          {{ display === 'piano' ? 'staff' : 'piano' }} · A♯7/G♯7
          confirm/cancel · play a note = set key &amp; exit
        </span>
      </template>
      <template v-else>
        Press <kbd>Space</kbd> or your lowest key (A0) to configure hands-free
      </template>
    </div>

    <ChordStaff
      v-if="display === 'staff'"
      :groups="staffGroups"
      :captions="staffCaptions"
      :durations="staffDurations"
      :beam="staffBeam"
      :bar-after="staffBarAfter"
    />
    <PianoKeyboard
      v-else
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
      :class="{ 'nav-focus': navActive && navRow === 0 }"
    />
    <SelectButton
      v-if="mode !== 'degrees'"
      v-model="category"
      :options="categoryOptions"
      optionLabel="label"
      optionValue="value"
      :allowEmpty="false"
      :aria-label="mode === 'scale' ? 'Scale type' : 'Chord type'"
      :class="{ 'nav-focus': navActive && navRow === 1 }"
    />
    <SelectButton
      v-else
      v-model="degree"
      :options="DEGREE_OPTIONS"
      optionLabel="label"
      optionValue="value"
      :allowEmpty="false"
      aria-label="Scale degree"
      :class="{ 'nav-focus': navActive && navRow === 1 }"
    />
    <SelectButton
      v-if="mode !== 'degrees'"
      v-model="hand"
      :options="hands"
      :allowEmpty="false"
      aria-label="Hand"
      :class="{ 'nav-focus': navActive && navRow === 2 }"
    />
    <div class="display-row">
      <MidiKeyBadge
        v-if="navActive"
        :label="navVia === 'midi' ? displayKey : 't'"
        class="display-key"
      />
      <SelectButton
        v-model="display"
        :options="DISPLAY_OPTIONS"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        aria-label="Display"
      />
    </div>
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
/* Degrees labels carry lowercase Roman numerals (ii, vii°) — don't capitalize */
.name.no-caps {
  text-transform: none;
}

/* harmonised-scale strip: the 7 diatonic triads of the key */
.harmonized {
  display: flex;
  gap: 0.3rem;
  width: 100%;
  overflow-x: auto;
}
.degree-card {
  flex: 1 1 0;
  min-width: 2.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.4rem 0.15rem;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: var(--background);
  cursor: pointer;
}
.degree-card .roman {
  font-size: 0.82rem;
  font-weight: 800;
}
.degree-card .chord {
  font-size: 0.72rem;
  color: var(--text-muted);
}
.degree-card.current {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}
/* colour-code by quality so the Maj–min–min–Maj–Maj–min–dim pattern stands out */
.degree-card.major {
  background: color-mix(in srgb, var(--p-success) 20%, var(--background));
}
.degree-card.minor {
  background: color-mix(in srgb, var(--p-info) 20%, var(--background));
}
.degree-card.diminished {
  background: color-mix(in srgb, var(--p-danger) 22%, var(--background));
}
/* the Piano/Staff toggle key badge, shown on the control in config mode */
.display-row {
  position: relative;
}
.display-key {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  z-index: 1;
}

/* MIDI config guide: muted hint normally, accented banner while navigating */
.midi-config {
  width: 100%;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--text-muted);
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
}
.midi-config.active {
  color: var(--text);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  border: 1px solid var(--primary);
}
.midi-config.active strong {
  color: var(--primary);
}
.midi-config kbd {
  display: inline-block;
  min-width: 1.1rem;
  padding: 0 0.25rem;
  margin: 0 0.05rem;
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  text-align: center;
  background: color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 4px;
}
.midi-config .midi-line {
  display: block;
  margin-top: 0.2rem;
  color: var(--text-muted);
}

/* the option row the MIDI cursor is on */
.nav-focus {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
  border-radius: 8px;
}
</style>
