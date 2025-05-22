<template>
  <div class="grid" v-if="visible">
    <ProgressBar :progress="progress" />
    <div ref="vfContainer" class="staff-container py-8 overflow-hidden"></div>

    <div class="note-buttons grid grid-flow-col">
      <button
        v-for="note in notes"
        :key="note"
        @click="handleGuess(note)"
        class="bg-sky-700 px-4 py-2 text-white hover:bg-sky-800 sm:px-8 sm:py-3"
      >
        {{ note }}
      </button>
    </div>

    <div class="h-8">
      <p v-if="state == 'feedback'">{{ feedback }}</p>
    </div>

    <div class="stats">
      <h3>Stats</h3>
      <p>Correct Guesses: {{ stats.correctGuesses }}</p>
      <p>Incorrect Guesses: {{ stats.incorrectGuesses }}</p>
      <p>Total Guesses: {{ stats.totalGuesses }}</p>
      <button
        @click="resetStats"
        class="bg-sky-700 px-4 py-2 text-white hover:bg-sky-800 sm:px-8 sm:py-3"
      >
        Reset Stats
      </button>
      <button
        @click="handleResetGame"
        class="bg-sky-700 px-4 py-2 text-white hover:bg-sky-800 sm:px-8 sm:py-3"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted, nextTick } from 'vue'
import { Renderer, Stave, StaveNote, Formatter, Voice, RenderContext, Annotation } from 'vexflow'
import ProgressBar from './ProgressBar.vue'

type Note = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
type Clef = 'treble' | 'bass' | 'mixed'
type NoteQueueItem = {
  note: StaveNote
  voice: Voice
  meta: {
    index: number
    startX: number
    currentX: number
    delay: number
    old: boolean
    answered: boolean
    removed: boolean
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

type Stats = {
  correctGuesses: number
  incorrectGuesses: number
  totalGuesses: number
  correctGuessesResponseTimes: number[]
  exercise: Clef
  startTime: string
  endTime: string | null
}

type SavedStats = {
  exercises: {
    treble: Stats[]
    bass: Stats[]
    mixed: Stats[]
  }
}

type ExerciseProps = {
  exercise: Clef
}
const { exercise } = defineProps<ExerciseProps>()

const initialState = {
  correctGuesses: 0,
  incorrectGuesses: 0,
  totalGuesses: 0,
  correctGuessesResponseTimes: [],
  exercise: exercise,
  startTime: new Date().toISOString(),
  endTime: null,
}
const stats = ref<Stats>(structuredClone(initialState))

watch(
  stats,
  (newStats) => {
    console.log(newStats)
  },
  { deep: true },
)

const vfContainer = ref<HTMLDivElement | null>(null)
const userGuess = ref<Note | ''>('')
const feedback = ref<string>('')
const notes: Note[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const state = ref('scrolling') // scrolling | waiting | feedback
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

function updateStats(isCorrect: boolean) {
  if (isCorrect) {
    stats.value.correctGuesses++
    stats.value.correctGuessesResponseTimes.push(new Date().getTime() - questionStartTime)
  } else {
    stats.value.incorrectGuesses++
  }
  stats.value.totalGuesses++
}

function resetStats() {
  stats.value = structuredClone(initialState)
  stats.value.startTime = new Date().toISOString()
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
  if (state.value !== 'scrolling' || noteItem.meta.removed) return
  const { meta, note } = noteItem

  const duration = meta.delay
  const startX = meta.startX
  const startTime = performance.now()

  function step(now: DOMHighResTimeStamp) {
    let elapsed, progress, currentX
    if (meta.old) {
      // Resume from the old position
      const remainingDistance = meta.currentX - stopX
      const remainingDuration = (remainingDistance / (meta.startX - stopX)) * duration
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

    if (currentX <= noteQuestionSpot && !meta.answered) {
      state.value = 'waiting'
      notesQueue.value.forEach((item) => {
        item.meta.old = true
        if (item.raf) {
          cancelAnimationFrame(item.raf)
        }
      })
      guestionTimer()
    }
    if (!meta.fadeOutStarted && currentX <= noteFadeOutSpot && meta.answered) {
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
  questionTimerIntervalID = setInterval(checkTime, 1000)

  progressTimerID = setInterval(increaseProgress, 100)

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

  state.value = 'feedback'
  resetQuestionTimer()

  const item = notesQueue.value.find((item) => item.meta.answered == false)
  if (!item) {
    console.error('No item found in notesQueue')
    return
  }

  const svgNote = item.note.getSVGElement()
  if (!svgNote) {
    console.error('SVG element not found for note:', item.note)
    return
  }

  modifySVGAttribute(item.note as StaveNote, 'visibility', 'visible')
  item.meta.answered = true

  const correctNote = item.note.keys[0].charAt(0)

  if (guessNote === correctNote) {
    feedback.value = '✅ Correct!'
    svgNote.setAttribute('fill', 'green')
    svgNote.setAttribute('stroke', 'green')
    updateStats(true)
  } else {
    feedback.value = `❌ Incorrect. It was ${correctNote}`
    svgNote.setAttribute('fill', 'red')
    svgNote.setAttribute('stroke', 'red')
    updateStats(false)
    if (stats.value.incorrectGuesses >= totalGuessesToDefeat) {
      endGame()
      return
    }
  }

  setTimeout(() => {
    resetProgressTimer()
    state.value = 'scrolling'
    feedback.value = ''
    userGuess.value = ''
    addNotes(1)
    notesQueue.value.forEach((item) => animateNote(item as NoteQueueItem))
  }, 2000)
}

function modifySVGAttribute(note: StaveNote, attribute: string, value: string) {
  const annotation = note.getSVGElement()?.querySelector('g.vf-annotation text')
  if (annotation) {
    annotation.setAttribute(attribute, value)
  }
}

function removeNote(note: NoteQueueItem) {
  if (note.raf) {
    cancelAnimationFrame(note.raf)
  }
  note.meta.removed = true
  const svg = note.note.getSVGElement()
  if (svg) {
    svg.remove()
  }
}

function waitForNoteGroup(maxAttempts = 10, delay = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    function check() {
      const groups = document.querySelector('svg')?.querySelectorAll('g.vf-stavenote')
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
      notesQueue.value.length > 0 ? notesQueue.value[notesQueue.value.length - 1] : null

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
    modifySVGAttribute(staveNote, 'visibility', 'hidden')
    if (!svgNote) {
      console.error('SVG element not found for note:', staveNote)
      return
    }

    const startX = lastNote ? lastNote.meta.currentX + noteSpacing : initialStartingX
    const distance = startX - stopX
    const delay = (distance / pixelsPerSecond) * noteDelay

    notesQueue.value.push({
      note: staveNote,
      voice,
      meta: {
        index: notesQueue.value.length,
        startX,
        currentX: startX,
        delay: delay,
        old: false,
        answered: false,
        removed: false,
        fadeOutStarted: false,
        elapsedStartTime: 0,
        progress: 0,
      },
      raf: undefined,
    })

    svgNote.setAttribute('data-id', notesQueue.value.length.toString())
    svgNote.setAttribute('data-start-x', startX.toString())
    svgNote.setAttribute('data-clef', randomNote.clef)
    svgNote.setAttribute('data-note', randomNote.note)
    svgNote.setAttribute('data-octave', randomNote.octave.toString())
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
    renderer.resize(1000, 220)
  } else if (exercise === 'treble' || exercise === 'bass') {
    renderer.resize(1000, 120)
  }
  context = renderer.getContext()
  context.beginPath()
  context.moveTo(50, 0) // Start at top (y=0)
  context.lineTo(50, 200) // Go down to bottom (y=200)
  context.stroke()
  context.beginPath()
  context.moveTo(150, 0) // Start at top (y=0)
  context.lineTo(150, 200) // Go down to bottom (y=200)
  context.stroke()
  context.beginPath()
  context.moveTo(200, 0) // Start at top (y=0)
  context.lineTo(200, 200) // Go down to bottom (y=200)
  context.stroke()

  if (exercise === 'mixed') {
    staveTreble = new Stave(0, 0, 1000)
    staveTreble.addClef('treble')
    staveTreble.setContext(context).draw()
    staveBass = new Stave(0, 100, 1000)
    staveBass.addClef('bass')
    staveBass.setContext(context).draw()
  } else if (exercise === 'treble') {
    staveTreble = new Stave(0, 0, 1000)
    staveTreble.addClef(exercise)
    staveTreble.setContext(context).draw()
  } else if (exercise === 'bass') {
    staveBass = new Stave(0, 0, 1000)
    staveBass.addClef(exercise)
    staveBass.setContext(context).draw()
  }

  addNotes(5)

  waitForNoteGroup()
    .then(() => notesQueue.value.forEach((item) => animateNote(item as NoteQueueItem)))
    .catch((err) => console.error(err.message))
}

function handleResetGame() {
  resetGame()
}

function resetGame(startAgain = true) {
  notesQueue.value.forEach((item) => {
    if (item.raf) {
      cancelAnimationFrame(item.raf)
    }
  })
  state.value = 'scrolling'
  userGuess.value = ''
  feedback.value = ''
  notesQueue.value = []
  resetQuestionTimer()
  resetProgressTimer()

  saveStats()
  resetStats()

  if (startAgain) {
    startExercise()
  }
}

function endGame() {
  state.value = 'feedback'
  feedback.value = 'Game Over'
}

function initializeStats() {
  if (!localStorage.getItem('stats')) {
    localStorage.setItem(
      'stats',
      JSON.stringify({
        exercises: {
          treble: [],
          bass: [],
          mixed: [],
        },
      }),
    )
  }
}

function saveStats() {
  if (stats.value.totalGuesses === 0) return

  const savedStats = localStorage.getItem('stats')
  if (!savedStats) return

  const parsedStats: SavedStats = JSON.parse(savedStats)
  // Prevent double saving the same exercise
  if (
    parsedStats.exercises[stats.value.exercise].find((s) => s.startTime === stats.value.startTime)
  ) {
    return
  }
  stats.value.endTime = new Date().toISOString()
  parsedStats.exercises[stats.value.exercise].push(stats.value)
  localStorage.setItem('stats', JSON.stringify(parsedStats))
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

<style scoped>
input {
  padding: 0.5em;
  margin: 1em 0.5em 1em 0;
  font-size: 1em;
}
.vf-stavenote {
  transition: opacity 0.5s ease-out;
}
</style>
