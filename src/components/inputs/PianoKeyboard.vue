<script setup lang="ts">
import { computed } from 'vue'

/** A piano keyboard as an answer/display surface. Renders whatever pitch range
 * `range` asks for (default one octave), emits the tapped note name without
 * octave ("C", "C#", …). A swappable sight-reading input method (see also
 * LetterAnswers) and the chord viewer's display keyboard. */
const {
  disabled = false,
  readonly = false,
  highlight = [],
  flash = false,
  flashTick = 0,
  fingers = {},
  crossovers = [],
  range = ['C4', 'B4'],
} = defineProps<{
  disabled?: boolean
  /** display-only: keys don't emit answers (e.g. the chord viewer) */
  readonly?: boolean
  /** keys to highlight — either specific keys as name+octave (["C4","E4","G4"],
   * chord viewer) or bare note names (["C#"], the game's pressed key) */
  highlight?: string[]
  /** highlight briefly flashes and fades (game) instead of persisting (viewer) */
  flash?: boolean
  /** bump this on every press so the flash replays even for a repeated note */
  flashTick?: number
  /** finger numbers to badge on keys, keyed by name+octave: { "C4": 1, "E4": 3 } */
  fingers?: Record<string, string | number>
  /** keys (name+octave) where the hand shifts position in a scale — badged with
   * a small marker so the thumb-under / cross-over point stands out */
  crossovers?: string[]
  /** inclusive pitch range [lowest, highest], e.g. ['F3', 'B5'] */
  range?: [string, string]
}>()
const emit = defineEmits<{ answer: [note: string] }>()

// marker on the fingering badge at a hand-shift note (thumb-under / cross-over)
const CROSS_SYMBOL = '↪'

function press(note: string) {
  if (!readonly) emit('answer', note)
}
function isCrossover(id: string) {
  return crossovers.includes(id)
}

function isHighlighted(key: { id: string; name: string }) {
  return highlight.includes(key.id) || highlight.includes(key.name)
}
// remount the flashing key on each press so its fade animation restarts, even
// when the same note is pressed again (chord viewer keeps stable keys)
function keyFor(key: { id: string; name: string }) {
  return flash && isHighlighted(key) ? `${key.id}-${flashTick}` : key.id
}

const CHROMA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
function toMidi(note: string): number {
  const m = note.match(/^([A-G]#?)(-?\d+)$/)
  return m ? parseInt(m[2], 10) * 12 + CHROMA.indexOf(m[1]) : 0
}

// Build the white/black key layout for the requested range. White keys flex to
// equal widths; black keys are absolutely positioned over the boundary after
// the white key a semitone below them, scaled to the white-key width.
const keys = computed(() => {
  const lo = toMidi(range[0])
  const hi = toMidi(range[1])
  const whites: { id: string; name: string }[] = []
  const rawBlacks: { id: string; name: string; afterIndex: number }[] = []
  for (let mi = lo; mi <= hi; mi++) {
    const name = CHROMA[((mi % 12) + 12) % 12]
    const octave = Math.floor(mi / 12)
    if (name.includes('#')) {
      if (whites.length)
        rawBlacks.push({ id: `${name}${octave}`, name, afterIndex: whites.length - 1 })
    } else {
      whites.push({ id: `${name}${octave}`, name })
    }
  }
  const whiteW = 100 / (whites.length || 1)
  const blackW = whiteW * 0.6
  const blacks = rawBlacks.map((b) => ({
    ...b,
    left: (b.afterIndex + 1) * whiteW - blackW / 2,
    width: blackW,
  }))
  return { whites, blacks }
})
</script>

<template>
  <div class="piano" :class="{ disabled, readonly, flash }">
    <div class="whites">
      <button
        v-for="k in keys.whites"
        :key="keyFor(k)"
        type="button"
        class="white-key"
        :class="{ highlight: isHighlighted(k) }"
        :disabled="disabled"
        @click="press(k.name)"
      >
        <span
          v-if="fingers[k.id]"
          class="finger"
          :class="{ crossover: isCrossover(k.id) }"
        >
          <span
            v-if="isCrossover(k.id)"
            class="cross-mark"
            aria-hidden="true"
            >{{ CROSS_SYMBOL }}</span
          >{{ fingers[k.id] }}</span
        >
        <span class="label">{{ k.name }}</span>
      </button>
    </div>
    <button
      v-for="b in keys.blacks"
      :key="keyFor(b)"
      type="button"
      class="black-key"
      :class="{ highlight: isHighlighted(b) }"
      :style="{ left: b.left + '%', width: b.width + '%' }"
      :disabled="disabled"
      @click="press(b.name)"
    >
      <span
        v-if="fingers[b.id]"
        class="finger finger-black"
        :class="{ crossover: isCrossover(b.id) }"
      >
        <span
          v-if="isCrossover(b.id)"
          class="cross-mark"
          aria-hidden="true"
          >{{ CROSS_SYMBOL }}</span
        >{{ fingers[b.id] }}</span
      >
    </button>
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

/* Piano keys keep real-piano colours (white naturals, black accidentals) in
   both light and dark themes — a piano looks the same whatever the lighting. */
.white-key {
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.6rem;
  background: #fbfbfb;
  border: 1px solid #c7c4d1;
  border-top: none;
  border-radius: 0 0 8px 8px;
  color: #4a4753;
  font-weight: 600;
  cursor: pointer;
  box-shadow: inset 0 -5px 7px -5px rgba(0, 0, 0, 0.28);
}
.white-key:not(:disabled):active {
  background: #ece9f6;
}
.white-key:disabled {
  cursor: not-allowed;
}

.black-key {
  position: absolute;
  top: 0;
  /* width comes from the range-derived inline style */
  height: 62%;
  background: #201e28;
  border: 1px solid #000;
  border-radius: 0 0 6px 6px;
  cursor: pointer;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.4);
}
.black-key:not(:disabled):active {
  background: #3b3746;
}
.black-key:disabled {
  cursor: not-allowed;
}

/* persistent highlight (chord viewer) */
.white-key.highlight {
  background: #6a2be0;
  color: #fff;
  border-color: #5a1fc0;
}
.black-key.highlight {
  background: #8b5cf6;
  border-color: #4b1aa8;
}

/* flash mode (game): the pressed key lights up then fades back within ~0.9s,
   even though the parent still remembers the guess */
.piano.flash .white-key.highlight {
  background: #fbfbfb;
  color: #4a4753;
  border-color: #c7c4d1;
  animation: key-flash-white 0.9s ease-out;
}
.piano.flash .black-key.highlight {
  background: #201e28;
  border-color: #000;
  animation: key-flash-black 0.9s ease-out;
}
@keyframes key-flash-white {
  from {
    background: #6a2be0;
    color: #fff;
    border-color: #5a1fc0;
  }
}
@keyframes key-flash-black {
  from {
    background: #8b5cf6;
    border-color: #4b1aa8;
  }
}

.piano.readonly .white-key,
.piano.readonly .black-key {
  cursor: default;
}

/* fingering badge (chord chart) — white circle so the number reads on any key */
.finger {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 9999px;
  background: #fff;
  color: #2b2540;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
.white-key .finger {
  bottom: 2.1rem;
}
.black-key .finger {
  bottom: 0.35rem;
}

/* hand-shift badge: accent ring so the thumb-under / cross-over note stands out,
   with a small directional symbol sitting just above the number */
.finger.crossover {
  background: #ffd24a;
  color: #2b2540;
  box-shadow:
    0 0 0 2px #b8860b,
    0 1px 2px rgba(0, 0, 0, 0.3);
}
.cross-mark {
  position: absolute;
  bottom: 1.15rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.9rem;
  line-height: 1;
  font-weight: 700;
  color: #b8860b;
  pointer-events: none;
}
</style>
