<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted, nextTick } from 'vue'
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

type Note = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Clef = 'treble' | 'bass' | 'mixed'
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
}
const { exercise } = defineProps<ExerciseProps>()
const initialStatsState: Stats = {
  guesses: {},
  exercise: exercise,
  startTime: new Date().toISOString(),
  endTime: null,
}
const { stats, initializeStats, saveStats, lastSavedStats } =
  useStats(initialStatsState)
const prefersDarkScheme = window.matchMedia(
  '(prefers-color-scheme: dark)',
).matches
const vfContainer = ref<HTMLDivElement | null>(null)
const userGuess = ref<Note | ''>('')
const notes: Note[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const state = ref<GameState>('not-playing')
const notesQueue = ref<NoteQueueItem[]>([])
const visible = ref<boolean>(false)
const noteSpacing = 50
const noteDelay = 1500
const progress = ref<number>(0)
const questionTimeLimit = 5000
let questionTimerIntervalID: number | null = null
let questionStartTime: number = 0
let progressTimerID: number | null = null
const totalGuessesToDefeat = 3
const noteFadeOutSpot = 45
const noteQuestionSpot = 100
const initialStartingX = 200
const stopX = 0
const pixelsPerSecond = 50
let renderer = null
let context: RenderContext
let staveTreble: Stave
let staveBass: Stave
let lastRandomNote = ''

watch(
  () => notesQueue.value,
  (newQueue) => {
    newQueue.forEach((item) => {
      if (item.meta.state === 'removed') return
      item.note.getSVGElement()?.setAttribute('data-state', item.meta.state)
    })
  },
  { deep: true },
)

function updateStats(isCorrect: boolean, item: NoteQueueItem) {
  const noteKey = item.randomNote.key.replace('/', '')

  if (stats.value.guesses[noteKey]) {
    // update existing
    const existingStat = stats.value.guesses[noteKey]
    stats.value.guesses[noteKey] = {
      averageMs:
        (existingStat.averageMs * existingStat.totalGuesses +
          (new Date().getTime() - questionStartTime)) /
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
      averageMs: new Date().getTime() - questionStartTime,
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

function animateNote(noteItem: NoteQueueItem) {
  if (state.value !== 'scrolling' || noteItem.meta.state == 'removed') return
  const { meta, note } = noteItem

  const duration = meta.delay
  const startX = meta.startX
  const startTime = performance.now()

  function step(now: DOMHighResTimeStamp) {
    let elapsed, progress, currentX
    if (meta.old) {
      // Resume from the old position
      const remainingDistance = meta.currentX - stopX
      const remainingDuration =
        (remainingDistance / (meta.startX - stopX)) * duration
      elapsed = now - meta.elapsedStartTime
      progress = Math.min(elapsed / remainingDuration, 1)
      currentX = meta.currentX - remainingDistance * progress
    } else {
      // Starting animation
      elapsed = now - startTime
      progress = Math.min(elapsed / duration, 1)
      currentX = startX - (startX - stopX) * progress
    }

    meta.elapsedStartTime = now
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

    if (currentX > 0) {
      noteItem.raf = requestAnimationFrame(step)
    } else {
      removeNote(noteItem)
    }

    if (currentX <= noteQuestionSpot && meta.state == 'default') {
      state.value = 'waiting'
      notesQueue.value.forEach((item) => {
        item.meta.old = true
        if (item.raf) {
          cancelAnimationFrame(item.raf)
        }
      })
      guestionTimer()
      meta.state = 'in-question'
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
    const pauseDuration = performance.now() - meta.elapsedStartTime
    meta.elapsedStartTime += pauseDuration
  }
  noteItem.raf = requestAnimationFrame(step)
}

function guestionTimer() {
  if (state.value !== 'waiting') return

  questionStartTime = new Date().getTime()
  // Don't know why this happens
  // Type 'Timeout' is not assignable to type 'number'.
  questionTimerIntervalID = setInterval(checkTime, 1000) as unknown as number
  progressTimerID = setInterval(increaseProgress, 100) as unknown as number

  function checkTime() {
    if (new Date().getTime() - questionStartTime > questionTimeLimit) {
      handleGuess('')
      resetQuestionTimer()
    }
  }

  function increaseProgress() {
    progress.value = Math.min(100, progress.value + 2)
  }
}

function resetProgressTimer() {
  if (progressTimerID) {
    clearInterval(progressTimerID)
    progressTimerID = null
    progress.value = 0
  }
}

function resetQuestionTimer() {
  if (questionTimerIntervalID) {
    clearInterval(questionTimerIntervalID)
    questionTimerIntervalID = null
  }
}

function handleGuess(guessNote: Note | '') {
  if (state.value !== 'waiting') return

  resetQuestionTimer()

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

  resetProgressTimer()

  setTimeout(() => {
    state.value = 'scrolling'
    userGuess.value = ''
    addNotes(1)
    notesQueue.value.forEach((item) => animateNote(item as NoteQueueItem))
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
    const distance = startX - stopX
    const delay = (distance / pixelsPerSecond) * noteDelay
    const noteQueueItem: NoteQueueItem = {
      note: staveNote,
      randomNote: randomNote,
      voice,
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

    if (prefersDarkScheme) colorizeNoteElement(svgNote, 'var(--text)')
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
    .then(() =>
      notesQueue.value.forEach((item) => animateNote(item as NoteQueueItem)),
    )
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

onMounted(() => {
  visible.value = false
  initializeStats()

  setTimeout(async () => {
    visible.value = true
    await nextTick()

    startExercise()
  }, 1000)
})

onUnmounted(() => {
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
    ></div>

    <div class="note-buttons">
      <button
        v-for="note in notes"
        :key="note"
        @click="handleGuess(note)"
        :disabled="state !== 'waiting'"
        class="test cursor-pointer disabled:cursor-not-allowed"
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
  border-radius: 30px;
  box-shadow: 0 0px 15px var(--primary-300);
  border: 1px solid var(--secondary);
}
button:disabled {
  border: 1px solid var(--secondary);
  box-shadow: none;
}

.test {
  position: absolute;
  line-height: initial;
  padding: 1rem 2rem;
  top: 40%;
  left: 40%;
  transform-origin: center;
}

.test:nth-child(1) {
  transform: rotate(-90deg) translate(120px) rotate(90deg);
}
.test:nth-child(2) {
  transform: rotate(-40deg) translate(120px) rotate(40deg);
}
.test:nth-child(3) {
  transform: rotate(10deg) translate(120px) rotate(-10deg);
}
.test:nth-child(4) {
  transform: rotate(60deg) translate(120px) rotate(-60deg);
}
.test:nth-child(5) {
  transform: rotate(120deg) translate(120px) rotate(-120deg);
}
.test:nth-child(6) {
  transform: rotate(170deg) translate(120px) rotate(-170deg);
}
.test:nth-child(7) {
  transform: rotate(220deg) translate(120px) rotate(-220deg);
}

@media (width >= 40rem) {
  .note-buttons {
    height: 400px;
  }
  .test {
    line-height: 40px;
    top: 45%;
    left: 45%;
  }
  .test:nth-child(1) {
    transform: rotate(-90deg) translate(180px) rotate(90deg);
  }
  .test:nth-child(2) {
    transform: rotate(-40deg) translate(180px) rotate(40deg);
  }
  .test:nth-child(3) {
    transform: rotate(10deg) translate(180px) rotate(-10deg);
  }
  .test:nth-child(4) {
    transform: rotate(60deg) translate(180px) rotate(-60deg);
  }
  .test:nth-child(5) {
    transform: rotate(120deg) translate(180px) rotate(-120deg);
  }
  .test:nth-child(6) {
    transform: rotate(170deg) translate(180px) rotate(-170deg);
  }
  .test:nth-child(7) {
    transform: rotate(220deg) translate(180px) rotate(-220deg);
  }
}
</style>
