<script setup lang="ts">
import { computed, markRaw, onMounted, ref, onUnmounted, nextTick } from 'vue'
import {
  Renderer,
  Stave,
  StaveNote,
  Formatter,
  Voice,
  RenderContext,
  Annotation,
} from 'vexflow'
import ProgressBar from './ProgressBar.vue'
import EndScreen from './EndScreen.vue'
import { useStats, type Stats } from '@/utils/stats'
import type { Clef } from '@/types/global'

type Note = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
type GameState = 'not-playing' | 'scrolling' | 'waiting' | 'game-over'
type NoteQueueItem = {
  note: StaveNote
  randomNote: RandomNote
  voice: Voice
  meta: {
    index: number
    startX: number
    currentX: number
    delay: number
    old: boolean
    state: 'default' | 'in-question' | 'answered' | 'removed'
    fadeOutStarted: boolean
    elapsedStartTime: number
    progress: number
  }
  raf?: number
}
type RandomNote = {
  note: Note
  octave: number
  clef: Clef
  key: string
}

type ExerciseProps = {
  exercise: Clef
  secondsBetweenNotes: number
  questionTimeLimit: number
  showLastNoteQuessed: boolean
}
const {
  exercise,
  secondsBetweenNotes = 3,
  questionTimeLimit = 5,
  showLastNoteQuessed = true,
} = defineProps<ExerciseProps>()
const initialStatsState: Stats = {
  guesses: {},
  exercise: exercise,
  startTime: new Date().toISOString(),
  endTime: null,
}
const { stats, initializeStats, saveStats, lastSavedStats } =
  useStats(initialStatsState)
const vfContainer = ref<HTMLDivElement | null>(null)
const userGuess = ref<Note | ''>('')
const notes: Note[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const state = ref<GameState>('not-playing')
const notesQueue = ref<NoteQueueItem[]>([])
const visible = ref<boolean>(false)
const noteSpacing = 50
const noteDelay = 1
const progress = ref<number>(0)
let questionStartGameMs: number = 0
let questionLoopRafId: number | null = null
const totalGuessesToDefeat = 10003
const noteFadeOutSpot = showLastNoteQuessed ? 45 : 100
const noteQuestionSpot = 100
const initialStartingX = 150
const deleteNoteAtX = 0
const pixelsPerSecond = 0.05 / secondsBetweenNotes
/** Wall time spent with the document hidden — subtract from performance.now() so game time pauses in background tabs. */
let gameClockOffsetMs = 0
let visibilityHiddenAt: number | null = null

function gameNow(): number {
  return performance.now() - gameClockOffsetMs
}

function syncGameClockAfterVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    if (
      visibilityHiddenAt === null &&
      (state.value === 'scrolling' || state.value === 'waiting')
    ) {
      visibilityHiddenAt = performance.now()
    }
  } else if (visibilityHiddenAt !== null) {
    gameClockOffsetMs += performance.now() - visibilityHiddenAt
    visibilityHiddenAt = null
  }
}

let renderer = null
let context: RenderContext
let staveTreble: Stave
let staveBass: Stave
let lastRandomNote = ''

function updateStats(isCorrect: boolean, item: NoteQueueItem) {
  const noteKey = item.randomNote.key.replace('/', '')

  if (stats.value.guesses[noteKey]) {
    // update existing
    const existingStat = stats.value.guesses[noteKey]
    stats.value.guesses[noteKey] = {
      averageMs:
        (existingStat.averageMs * existingStat.totalGuesses +
          (gameNow() - questionStartGameMs)) /
        (existingStat.totalGuesses + 1),
      totalGuesses: existingStat.totalGuesses + 1,
      correctGuesses: isCorrect
        ? existingStat.correctGuesses + 1
        : existingStat.correctGuesses,
      incorrectGuesses: isCorrect
        ? existingStat.incorrectGuesses
        : existingStat.incorrectGuesses + 1,
      guessRate: isCorrect
        ? ((existingStat.correctGuesses + 1) /
            (existingStat.totalGuesses + 1)) *
          100
        : (existingStat.correctGuesses / (existingStat.totalGuesses + 1)) * 100,
    }
  } else {
    // new entry
    stats.value.guesses[noteKey] = {
      averageMs: gameNow() - questionStartGameMs,
      totalGuesses: 1,
      correctGuesses: isCorrect ? 1 : 0,
      incorrectGuesses: isCorrect ? 0 : 1,
      guessRate: isCorrect ? 100 : 0,
    }
  }

  // stats.value.guesses.push({
  //   note: noteKey,
  //   ms: new Date().getTime() - questionStartTime,
  //   correct: isCorrect,
  // });
}

function getRandomNote(): RandomNote {
  let clef: Clef = exercise
  if (exercise === 'mixed') {
    clef = Math.random() < 0.5 ? 'treble' : 'bass'
  } else if (exercise === 'bass') {
    clef = 'bass'
  } else if (exercise === 'treble') {
    clef = 'treble'
  }
  const octaves = clef === 'treble' ? [4, 5] : [2, 3, 4]

  let note: Note, octave: number
  do {
    note = notes[Math.floor(Math.random() * notes.length)]
    octave = octaves[Math.floor(Math.random() * octaves.length)]

    // constraint bass clef to maximum of C4
    while (clef === 'bass' && octave === 4 && note != 'C') {
      note = notes[Math.floor(Math.random() * notes.length)]
      octave = octaves[Math.floor(Math.random() * octaves.length)]
    }
  } while (lastRandomNote === `${note}/${octave}`)

  lastRandomNote = `${note}/${octave}`

  return {
    note: note,
    octave: octave,
    clef: clef,
    key: `${note}/${octave}`,
  }
}

function playNotes() {
  console.log(notesQueue.value.length)
  notesQueue.value.forEach((item) => animateNote(item as NoteQueueItem))
}

function stopNotes() {
  notesQueue.value.forEach((item) => {
    item.meta.old = true
    if (item.raf) {
      cancelAnimationFrame(item.raf)
    }
  })
}

function animateNote(noteItem: NoteQueueItem) {
  if (state.value !== 'scrolling' || noteItem.meta.state == 'removed') return
  const { meta, note } = noteItem

  const duration = meta.delay
  const startX = meta.startX
  const startTime = gameNow()

  function step(now: DOMHighResTimeStamp) {
    const gameT = now - gameClockOffsetMs
    let elapsed, progress, currentX
    if (meta.old) {
      // Resume from the old position
      const remainingDistance = meta.currentX - deleteNoteAtX
      const remainingDuration =
        (remainingDistance / (meta.startX - deleteNoteAtX)) * duration
      elapsed = gameT - meta.elapsedStartTime
      progress = Math.min(elapsed / remainingDuration, 1)
      currentX = meta.currentX - remainingDistance * progress
    } else {
      // Starting animation
      elapsed = gameT - startTime
      progress = Math.min(elapsed / duration, 1)
      currentX = startX - (startX - deleteNoteAtX) * progress
    }

    meta.elapsedStartTime = gameT
    meta.progress = progress
    meta.currentX = currentX

    const svgNote = note.getSVGElement()
    if (!svgNote) {
      console.error('SVG element not found for note:', note)
      return
    }
    svgNote.setAttribute('transform', `translate(${currentX}, 0)`)
    svgNote.setAttribute('data-current-x', currentX.toString())
    svgNote.setAttribute('data-progress', progress.toString())

    if (currentX > deleteNoteAtX) {
      noteItem.raf = requestAnimationFrame(step)
    } else {
      removeNote(noteItem)
    }

    if (currentX <= noteQuestionSpot && meta.state == 'default') {
      state.value = 'waiting'
      stopNotes()
      guestionTimer()
      meta.state = 'in-question'
      svgNote.setAttribute('data-state', meta.state)
      colorizeNoteElement(svgNote, 'var(--p-info)')
    }
    if (
      !meta.fadeOutStarted &&
      currentX <= noteFadeOutSpot &&
      meta.state == 'answered'
    ) {
      svgNote?.setAttribute(
        'style',
        'visibility: hidden; opacity: 0; transition: visibility 0s 1s, opacity 1s linear;',
      )
      meta.fadeOutStarted = true
    }
  }
  if (meta.old && meta.elapsedStartTime) {
    const pauseDuration = gameNow() - meta.elapsedStartTime
    meta.elapsedStartTime += pauseDuration
  }
  noteItem.raf = requestAnimationFrame(step)
}

function guestionTimer() {
  if (state.value !== 'waiting') return

  questionStartGameMs = gameNow()
  progress.value = 0

  function tickQuestion() {
    if (state.value !== 'waiting') {
      if (questionLoopRafId !== null) {
        cancelAnimationFrame(questionLoopRafId)
        questionLoopRafId = null
      }
      return
    }
    const elapsed = gameNow() - questionStartGameMs
    const limitMs = questionTimeLimit * 1000
    progress.value = Math.min(100, (elapsed / limitMs) * 100)
    if (elapsed >= limitMs) {
      handleGuess('')
      return
    }
    questionLoopRafId = requestAnimationFrame(tickQuestion)
  }
  questionLoopRafId = requestAnimationFrame(tickQuestion)
}

function resetProgressTimer() {
  progress.value = 0
}

function resetQuestionTimer() {
  if (questionLoopRafId !== null) {
    cancelAnimationFrame(questionLoopRafId)
    questionLoopRafId = null
  }
}

function handleGuess(guessNote: Note | '') {
  if (state.value !== 'waiting') return

  resetQuestionTimer()
  progress.value = 100

  const item = notesQueue.value.find((item) => item.meta.state == 'in-question')
  if (!item) {
    console.error('No item found in notesQueue')
    return
  }

  const svgNote = item.note.getSVGElement()
  if (!svgNote) {
    console.error('SVG element not found for note:', item.note)
    return
  }

  modifyStaveNoteAnnotation(item.note as StaveNote, 'visibility', 'visible')
  item.meta.state = 'answered'

  const correctNote = item.note.keys[0].charAt(0)

  if (guessNote === correctNote) {
    colorizeNoteElement(svgNote, 'var(--p-success)')
    updateStats(true, item as NoteQueueItem)
  } else {
    colorizeNoteElement(svgNote, 'var(--p-danger)')
    svgNote.style.setProperty('--note-x', `${item.meta.currentX}px`)
    svgNote.classList.add('wrong')

    updateStats(false, item as NoteQueueItem)
    if (
      Object.entries(stats.value.guesses).reduce(
        (prev, [, guess]) => prev + guess.incorrectGuesses,
        0,
      ) >= totalGuessesToDefeat
    ) {
      endGame()
      return
    }
  }

  setTimeout(() => {
    state.value = 'scrolling'
    userGuess.value = ''
    resetQuestionTimer()
    resetProgressTimer()
    addNotes(1)
    playNotes()
  }, 2000)
}

function modifyStaveNoteAnnotation(
  note: StaveNote,
  attribute: string,
  value: string,
) {
  const annotation = note.getSVGElement()?.querySelector('g.vf-annotation text')
  if (annotation) {
    annotation.setAttribute(attribute, value)
  }
}

function colorizeNoteElement(svg: SVGElement, color: string) {
  svg.setAttribute('fill', color)
  svg.setAttribute('stroke', color)
  svg.querySelectorAll('path')?.forEach((el) => {
    el.setAttribute('fill', color)
    el.setAttribute('stroke', color)
  })
}

function removeNote(note: NoteQueueItem) {
  if (note.raf) {
    cancelAnimationFrame(note.raf)
  }
  note.meta.state = 'removed'
  const svg = note.note.getSVGElement()
  if (svg) {
    svg.remove()
  }
  notesQueue.value.shift()
}

function waitForNoteGroup(maxAttempts = 10, delay = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    function check() {
      const groups = document
        .querySelector('svg')
        ?.querySelectorAll('g.vf-stavenote')
      if (groups && groups.length > 0) {
        resolve(true)
      } else if (attempts++ < maxAttempts) {
        setTimeout(check, delay)
      } else {
        reject(new Error('Note group not found'))
      }
    }
    check()
  })
}

function addNotes(n = 5) {
  const notes = []
  for (let i = 0; i < n; i++) {
    const randomNote = getRandomNote()
    notes.push({
      randomNote,
      staveNote: new StaveNote({
        clef: randomNote.clef,
        keys: [randomNote.key],
        duration: 'q',
      }),
    })
  }

  notes.forEach((note) => {
    const { randomNote, staveNote } = note
    const lastNote =
      notesQueue.value.length > 0
        ? notesQueue.value[notesQueue.value.length - 1]
        : null

    const annotation = new Annotation(randomNote.note)
      .setFont('Arial', 12)
      .setVerticalJustification(Annotation.VerticalJustify.BOTTOM)
    staveNote.addModifier(annotation, 0)
    const voice = new Voice({ numBeats: 1, beatValue: 1 }).setStrict(false)
    voice.addTickables([staveNote])
    new Formatter().joinVoices([voice]).format([voice])
    if (randomNote.clef === 'treble') {
      voice.draw(context, staveTreble)
    } else {
      voice.draw(context, staveBass)
    }
    const svgNote = staveNote.getSVGElement()
    modifyStaveNoteAnnotation(staveNote, 'visibility', 'hidden')
    if (!svgNote) {
      console.error('SVG element not found for note:', staveNote)
      return
    }

    const startX = lastNote
      ? lastNote.meta.currentX + noteSpacing
      : initialStartingX
    const distance = startX - deleteNoteAtX
    const delay = (distance / pixelsPerSecond) * noteDelay
    // const delay = startX
    const noteQueueItem: NoteQueueItem = {
      // raw: VexFlow object graphs are huge — letting Vue deep-proxy them
      // costs a full reactive traversal on every animation frame
      note: markRaw(staveNote),
      randomNote: randomNote,
      voice: markRaw(voice),
      meta: {
        index: notesQueue.value.length,
        startX,
        currentX: startX,
        delay: delay,
        old: false,
        state: 'default',
        fadeOutStarted: false,
        elapsedStartTime: 0,
        progress: 0,
      },
      raf: undefined,
    }

    notesQueue.value.push(noteQueueItem)

    colorizeNoteElement(svgNote, 'var(--text)')
    svgNote.setAttribute('data-id', notesQueue.value.length.toString())
    svgNote.setAttribute('data-start-x', startX.toString())
    svgNote.setAttribute('data-clef', randomNote.clef)
    svgNote.setAttribute('data-note', randomNote.note)
    svgNote.setAttribute('data-octave', randomNote.octave.toString())
    svgNote.setAttribute('data-state', noteQueueItem.meta.state)
  })
}

function startExercise() {
  const container = vfContainer.value
  if (!container) {
    console.error('Container not found')
    return
  }

  container.innerHTML = ''

  renderer = new Renderer(container, Renderer.Backends.SVG)
  if (exercise === 'mixed') {
    renderer.resize(1000, 230)
  } else if (exercise === 'treble' || exercise === 'bass') {
    renderer.resize(1000, 140)
  }
  context = renderer.getContext()

  const staves = []
  if (exercise === 'mixed') {
    staveTreble = new Stave(0, 0, 1000)
    staveTreble.addClef('treble')
    staveTreble.setContext(context).draw()
    staves.push(staveTreble)
    staveBass = new Stave(0, 100, 1000)
    staveBass.addClef('bass')
    staveBass.setContext(context).draw()
    staves.push(staveBass)
  } else if (exercise === 'treble') {
    staveTreble = new Stave(0, 0, 1000)
    staveTreble.addClef(exercise)
    staveTreble.setContext(context).draw()
    staves.push(staveTreble)
  } else if (exercise === 'bass') {
    staveBass = new Stave(0, 0, 1000)
    staveBass.addClef(exercise)
    staveBass.setContext(context).draw()
    staves.push(staveBass)
  }

  const staveSvg = document.querySelector('#stave svg')
  if (staveSvg) {
    staveSvg.setAttribute('fill', 'var(--text)')
    staveSvg.setAttribute('stroke', 'var(--text)')
    staveSvg.setAttribute('shadowColor', 'var(--text)')
    staveSvg.querySelectorAll('g.vf-clef').forEach((el) => {
      el.setAttribute('fill', 'var(--text)')
    })
    staveSvg.querySelectorAll('g.vf-stavebarline')?.forEach((el) => {
      el.setAttribute('fill', 'var(--text)')
    })
  } else {
    console.error('Stave SVG element not found.')
  }

  // staves.forEach((stave) => {
  //   const staveSvg = stave.getSVGElement()
  //   if (staveSvg) {
  //     colorizeStaveElement(staveSvg, 'white')
  //   } else {
  //     console.error('Stave SVG element not found.')
  //   }
  // })

  addNotes(5)
  state.value = 'scrolling'

  waitForNoteGroup()
    .then(() => playNotes())
    .catch((err) => console.error(err.message))
}

function handleResetGame(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  resetGame()
}

async function resetGame(startAgain = true) {
  notesQueue.value.forEach((item) => {
    if (item.raf) {
      cancelAnimationFrame(item.raf)
    }
  })

  gameClockOffsetMs = 0
  visibilityHiddenAt = null

  state.value = 'scrolling'
  await nextTick()

  userGuess.value = ''
  notesQueue.value = []
  resetQuestionTimer()
  resetProgressTimer()

  if (startAgain) {
    startExercise()
  }
}

function endGame() {
  saveStats()
  state.value = 'game-over'
}

function onDocumentVisibilityChange() {
  syncGameClockAfterVisibilityChange()
}

onMounted(() => {
  visible.value = false
  initializeStats()
  document.addEventListener('visibilitychange', onDocumentVisibilityChange)

  setTimeout(async () => {
    visible.value = true
    await nextTick()

    startExercise()
  }, 1000)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onDocumentVisibilityChange)
  saveStats()
  resetGame(false)
})
</script>

<template>
  <EndScreen
    v-if="state == 'game-over'"
    :stats="lastSavedStats"
    :reset="handleResetGame"
  />

  <div v-if="state == 'not-playing'" class="mt-10">
    <div class="justify-self-center mt-5">
      <i
        class="pi pi-spin pi-spinner"
        style="font-size: 5rem; color: var(--primary)"
      />
    </div>
  </div>
  <div class="grid" v-if="state != 'game-over' && visible">
    <ProgressBar :progress="progress" />
    <div
      ref="vfContainer"
      id="stave"
      class="staff-container pt-4 overflow-hidden"
    />
    <div class="note-buttons">
      <button
        v-for="note in notes"
        :key="note"
        @click="handleGuess(note)"
        :disabled="state !== 'waiting'"
        class="note-button cursor-pointer disabled:cursor-not-allowed"
      >
        {{ note }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.vf-stavenote {
  transition: opacity 0.5s ease-out;
}

.note-buttons {
  position: relative;
  height: 300px;
}

button {
  /* Larger touch targets for better accessibility */
  min-width: 56px;
  min-height: 56px;
  border-radius: 50%;

  /* Enhanced visual styling */
  background: var(--primary-fill);
  color: var(--on-primary);
  font-size: 1.125rem;
  font-weight: 600;

  /* Better borders and shadows */
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

@media (prefers-reduced-motion: reduce) {
  button:not(:disabled),
  button:not(:disabled)::after {
    animation: none;
  }

  button:not(:disabled)::after {
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

@keyframes shake {
  0%,
  100% {
    transform: translateX(var(--note-x, 0px));
  }
  15% {
    transform: translateX(calc(var(--note-x, 0px) - 8px));
  }
  30% {
    transform: translateX(calc(var(--note-x, 0px) + 8px));
  }
  45% {
    transform: translateX(calc(var(--note-x, 0px) - 8px));
  }
  60% {
    transform: translateX(calc(var(--note-x, 0px) + 8px));
  }
  75% {
    transform: translateX(calc(var(--note-x, 0px) - 4px));
  }
}

:deep(.wrong) {
  animation: shake 0.4s linear;
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
    /* Larger buttons on bigger screens */
    min-width: 64px;
    min-height: 64px;
    font-size: 1.25rem;
  }
}
</style>
