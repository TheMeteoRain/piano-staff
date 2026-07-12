<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { Renderer, Stave, type RenderContext } from 'vexflow'
import ProgressBar from './ProgressBar.vue'
import EndScreen from './EndScreen.vue'
import Button from '@/volt/Button.vue'
import { useNoteSound } from '@/composables/useNoteSound'
import {
  MAJOR_KEYS,
  buildChoices,
  keysFor,
  type MajorKey,
  type KeyMode,
} from '@/utils/keySignatures'

/**
 * Key-signature recognition — a static flashcard: render a clef + key
 * signature, pick its major key. Shares only the flashcard-relevant settings
 * (time to answer, mistakes allowed, sound); the scrolling-note settings don't
 * apply here.
 */
type Props = {
  /** which keys to practise: flat, sharp, or all */
  mode?: KeyMode
  /** seconds to answer before the card counts as missed; 0 = untimed */
  questionTimeLimit?: number
  /** wrong answers before the exercise ends; 0 = unlimited */
  errorsAllowed?: number
  /** play the key's tonic on reveal */
  soundEnabled?: boolean
}
const {
  mode = 'mixed',
  questionTimeLimit = 8,
  errorsAllowed = 3,
  soundEnabled = true,
} = defineProps<Props>()

const pool = keysFor(mode)

const { preloadSound, unlockAudio, playNote } = useNoteSound()

type GameState = 'playing' | 'revealed' | 'game-over'
type Guess = {
  totalGuesses: number
  correctGuesses: number
  incorrectGuesses: number
  guessRate: number
}

const staveContainer = ref<HTMLDivElement | null>(null)
const state = ref<GameState>('playing')
const current = ref<MajorKey>(MAJOR_KEYS[0])
const choices = ref<MajorKey[]>([])
const picked = ref<string | null>(null)
const progress = ref(0)
const guesses = ref<Record<string, Guess>>({})

let renderer: Renderer | null = null
let context: RenderContext | null = null
let timerRaf: number | null = null
let advanceTimeout: number | null = null
let startTimeout: number | null = null
let disposed = false
let firstCard = true
let lastKey = ''
/** brief orientation pause before the first card's timer starts */
const START_DELAY_MS = 900

const incorrectTotal = computed(() =>
  Object.values(guesses.value).reduce((s, g) => s + g.incorrectGuesses, 0),
)
const correctTotal = computed(() =>
  Object.values(guesses.value).reduce((s, g) => s + g.correctGuesses, 0),
)

/** stats shaped for the shared EndScreen (per-key rows) */
const endStats = computed(() => ({
  guesses: Object.fromEntries(
    Object.entries(guesses.value).map(([k, g]) => [k, { ...g, averageMs: 0 }]),
  ),
  exercise: 'treble' as const,
  startTime: '',
  endTime: null,
}))

function pickNextKey(): MajorKey {
  let key: MajorKey
  do {
    key = pool[Math.floor(Math.random() * pool.length)]
  } while (key.spec === lastKey && pool.length > 1)
  lastKey = key.spec
  return key
}

function drawKeySignature(k: MajorKey) {
  const container = staveContainer.value
  if (!container) return
  container.innerHTML = ''
  renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(320, 140)
  context = renderer.getContext()

  const stave = new Stave(10, 20, 300)
  stave.addClef('treble')
  if (k.spec !== 'C') stave.addKeySignature(k.spec)
  stave.setContext(context).draw()

  const svg = container.querySelector('svg')
  if (svg) {
    svg.setAttribute('fill', 'var(--text)')
    svg.setAttribute('stroke', 'var(--text)')
    svg.querySelectorAll('path, rect').forEach((el) => {
      el.setAttribute('fill', 'var(--text)')
    })
  }
}

function startCard() {
  if (disposed) return
  picked.value = null
  current.value = pickNextKey()
  choices.value = buildChoices(current.value, pool)
  progress.value = 0
  state.value = 'playing'
  nextTick(() => drawKeySignature(current.value))

  if (firstCard) {
    // show the first card but hold the countdown so the player can orient
    firstCard = false
    startTimeout = window.setTimeout(() => {
      if (!disposed) startTimer()
    }, START_DELAY_MS)
  } else {
    startTimer()
  }
}

function startTimer() {
  stopTimer()
  if (questionTimeLimit <= 0) return
  const start = performance.now()
  const limitMs = questionTimeLimit * 1000
  progress.value = 0
  function tick() {
    if (state.value !== 'playing') return
    const elapsed = performance.now() - start
    progress.value = Math.min(100, (elapsed / limitMs) * 100)
    if (elapsed >= limitMs) {
      answer('') // timed out
      return
    }
    timerRaf = requestAnimationFrame(tick)
  }
  timerRaf = requestAnimationFrame(tick)
}

function stopTimer() {
  if (timerRaf !== null) {
    cancelAnimationFrame(timerRaf)
    timerRaf = null
  }
}

function record(isCorrect: boolean) {
  const name = current.value.name
  const g = guesses.value[name] ?? {
    totalGuesses: 0,
    correctGuesses: 0,
    incorrectGuesses: 0,
    guessRate: 0,
  }
  g.totalGuesses += 1
  if (isCorrect) g.correctGuesses += 1
  else g.incorrectGuesses += 1
  g.guessRate = (g.correctGuesses / g.totalGuesses) * 100
  guesses.value[name] = g
}

function answer(spec: string) {
  if (state.value !== 'playing' || disposed) return
  void unlockAudio()
  stopTimer()
  picked.value = spec
  const correct = spec === current.value.spec
  record(correct)
  state.value = 'revealed'
  if (soundEnabled) playNote(current.value.tonic)

  if (!correct && errorsAllowed > 0 && incorrectTotal.value >= errorsAllowed) {
    // hold on the revealed answer briefly, then end
    advanceTimeout = window.setTimeout(() => {
      if (!disposed) state.value = 'game-over'
    }, 1200)
    return
  }
  // brief reveal, then next card
  advanceTimeout = window.setTimeout(startCard, correct ? 550 : 1100)
}

function handleReset(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  guesses.value = {}
  firstCard = true
  startCard()
}

onMounted(() => {
  preloadSound()
  startCard()
})
onUnmounted(() => {
  // stop everything so cards don't keep advancing (and playing) after leaving
  disposed = true
  stopTimer()
  if (advanceTimeout !== null) {
    clearTimeout(advanceTimeout)
    advanceTimeout = null
  }
  if (startTimeout !== null) {
    clearTimeout(startTimeout)
    startTimeout = null
  }
})
</script>

<template>
  <main>
    <EndScreen
      v-if="state === 'game-over'"
      :stats="endStats"
      :reset="handleReset"
      item-label="key"
    />

    <div v-else class="grid gap-6">
      <ProgressBar :progress="progress" />

      <h2 class="text-center text-lg font-semibold text-(--text-muted)">
        Which major key?
      </h2>

      <div ref="staveContainer" class="justify-self-center" />

      <div class="grid grid-cols-2 gap-3">
        <Button
          v-for="choice in choices"
          :key="choice.spec"
          :label="choice.name"
          class="h-16 text-xl"
          :variant="
            state === 'revealed'
              ? choice.spec === current.spec
                ? undefined
                : 'outlined'
              : 'outlined'
          "
          :class="[
            state === 'revealed' &&
              choice.spec === current.spec &&
              'correct-choice',
            state === 'revealed' &&
              picked === choice.spec &&
              choice.spec !== current.spec &&
              'wrong-choice',
          ]"
          @click="answer(choice.spec)"
        />
      </div>

      <div class="text-center tabular-nums text-(--text-muted)">
        <span class="text-(--success-text) font-bold">{{ correctTotal }}</span>
        <span class="mx-2">·</span>
        <span class="text-(--error-text)">
          {{ incorrectTotal }} / {{ errorsAllowed > 0 ? errorsAllowed : '∞' }}
        </span>
      </div>
    </div>
  </main>
</template>

<style scoped>
.correct-choice {
  background: var(--success) !important;
  border-color: var(--success) !important;
  color: var(--on-primary) !important;
}
.wrong-choice {
  background: var(--error) !important;
  border-color: var(--error) !important;
  color: var(--on-primary) !important;
}
</style>
