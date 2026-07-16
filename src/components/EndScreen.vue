<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { Stats } from '@/utils/stats'
import Button from '@/volt/Button.vue'

type EndScreenProps = {
  reset: (event: Event) => void
  stats: Stats
  /** what each per-item row represents, e.g. "note" or "key" */
  itemLabel?: string
}
const { reset, stats, itemLabel = 'note' } = defineProps<EndScreenProps>()

// "R" retries from the score screen (this component only mounts on game-over)
function handleRetryKey(event: KeyboardEvent) {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key.toLowerCase() !== 'r') return
  event.preventDefault()
  reset(event)
}
onMounted(() => window.addEventListener('keydown', handleRetryKey))
onUnmounted(() => window.removeEventListener('keydown', handleRetryKey))

const PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/** Sort value for a per-item key: pitch order (octave then chromatic). Handles
 * note keys like "C4"/"F#5" and key names like "D♭"; unknowns sort last. */
function pitchValue(key: string): number {
  const m = key.match(/^([A-Ga-g])([#♯b♭]?)(-?\d+)?$/)
  if (!m) return Number.POSITIVE_INFINITY
  let semitone = PITCH_CLASS[m[1].toUpperCase()]
  if (m[2] === '#' || m[2] === '♯') semitone += 1
  else if (m[2] === 'b' || m[2] === '♭') semitone -= 1
  const octave = m[3] !== undefined ? parseInt(m[3], 10) : 0
  return octave * 12 + semitone
}

/** per-item rows, highest pitch first — mirrors top-to-bottom on the staff */
const sortedGuesses = computed(() =>
  Object.entries(stats.guesses).sort(
    ([a], [b]) => pitchValue(b) - pitchValue(a),
  ),
)

function animate(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const result__content = target.querySelector(
    '.result__content',
  ) as HTMLElement
  result__content.classList.toggle('animate')
}
</script>

<template>
  <div class="result" @click="animate">
    <div
      class="result__content end-screen relative transition-transform duration-1000 cursor-pointer"
    >
      <div
        class="result__front absolute grid content-center gap-5 top-0 bottom-0 right-0 left-0"
      >
        <h1 class="text-center text-3xl font-bold">Try again!</h1>
        <p class="text-center text-lg">Tap to show statistics.</p>
      </div>
      <div
        class="result__back absolute content-center gap-5 top-0 bottom-0 right-0 left-0"
      >
        <h1 class="text-center text-3xl font-bold">Statistics</h1>
        <h2 class="text-center text-2xl font-bold mt-10">Overall</h2>
        <div class="stat">
          <div class="stat_item text-right">Correct Guesses</div>
          <div class="stat_item text-left">
            {{
              Object.entries(stats.guesses).reduce(
                (prev, [key, guess]) => prev + guess.correctGuesses,
                0,
              )
            }}
          </div>
        </div>
        <div class="stat">
          <div class="stat_item text-right">Incorrect Guesses</div>
          <div class="stat_item text-left">
            {{
              Object.entries(stats.guesses).reduce(
                (prev, [key, guess]) => prev + guess.incorrectGuesses,
                0,
              )
            }}
          </div>
        </div>
        <div class="stat">
          <div class="stat_item text-right">Total Guesses</div>
          <div class="stat_item text-left">
            {{
              Object.entries(stats.guesses).reduce(
                (prev, [key, guess]) => prev + guess.totalGuesses,
                0,
              )
            }}
          </div>
        </div>

        <h2 class="text-center text-2xl font-bold mt-10">
          Per {{ itemLabel }} accuracy
        </h2>
        <div v-for="[key, guess] in sortedGuesses" :key="key" class="stat">
          <div class="stat_item text-right">{{ key }}</div>
          <div class="stat_item text-left">
            {{ guess.correctGuesses }}/{{ guess.totalGuesses }} -
            {{ Math.round(guess.guessRate) }}%
          </div>
        </div>
      </div>
    </div>
    <Button class="shrink-0" @click="reset"> Retry </Button>
  </div>
</template>

<style scoped>
.result {
  perspective: 500px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* fill the space above the fixed bottom nav; the card flexes and its inner
     list scrolls, so the Retry button always stays pinned at the bottom */
  height: calc(100vh - 3.5rem - 3.5rem);
}
.result__content {
  transform-style: preserve-3d;
  flex: 1;
  min-height: 0;
}
.animate {
  transform: rotateY(0.5turn);
}

.stat {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-self: center;
  grid-gap: calc(var(--spacing) * 20);
}
.stat_item {
}

.result__front,
.result__back {
  backface-visibility: hidden;
}
.result__back {
  transform: rotateY(0.5turn);
  /* long per-item lists exceed the fixed card height — let them scroll instead
     of being clipped (scrollbars are hidden app-wide; touch/drag still works) */
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: 1rem;
}
</style>
