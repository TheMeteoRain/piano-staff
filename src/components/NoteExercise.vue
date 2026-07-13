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
import LetterAnswers from './inputs/LetterAnswers.vue'
import PianoKeyboard from './inputs/PianoKeyboard.vue'
import { useStats, type Stats } from '@/utils/stats'
import { useNoteSound } from '@/composables/useNoteSound'
import type { Clef } from '@/types/global'

const { preloadSound, unlockAudio, playNote } = useNoteSound()

type Note = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
type GameState = 'not-playing' | 'scrolling' | 'waiting' | 'pause' | 'game-over'
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
  /** seconds the game pauses after an answer before scrolling resumes */
  pauseDuration?: number
  /** wrong answers before the exercise ends; 0 means unlimited */
  errorsAllowed?: number
  /** play a piano sound when a note is answered */
  soundEnabled?: boolean
  /** answer the leading note immediately, self-paced, without waiting for it
   * to scroll to the question spot */
  answerInLine?: boolean
  /** how the player answers: letter buttons or a piano keyboard */
  inputMethod?: 'letters' | 'piano'
}
const {
  exercise,
  secondsBetweenNotes = 3,
  questionTimeLimit = 5,
  showLastNoteQuessed = true,
  pauseDuration = 1,
  errorsAllowed = 3,
  soundEnabled = true,
  answerInLine = false,
  inputMethod = 'letters',
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
const noteSpacing = 50
const noteDelay = 1
const progress = ref<number>(0)
// self-paced mode has no between-notes wait — you set the pace by answering
const pauseDurationMs = answerInLine ? 0 : pauseDuration * 1000
/** on the final mistake, hold at least this long so the shake and the tally
 * hitting the limit are visible before the game-over screen */
const gameOverHoldMs = 1400
let defeated = false
let pauseLoopRafId: number | null = null
let questionStartGameMs: number = 0
let questionLoopRafId: number | null = null
/** brief orientation pause before the notes start moving */
const START_DELAY_MS = 900
let startDelayTimeout: number | null = null
/** incorrect guesses so far — the game ends when this reaches errorsAllowed (0 = unlimited) */
const incorrectGuessTotal = computed(() =>
  Object.values(stats.value.guesses).reduce(
    (sum, guess) => sum + guess.incorrectGuesses,
    0,
  ),
)
const correctGuessTotal = computed(() =>
  Object.values(stats.value.guesses).reduce(
    (sum, guess) => sum + guess.correctGuesses,
    0,
  ),
)
/** answers accepted while a note is in question — or anytime in self-paced */
const answersDisabled = computed(
  () => !answerInLine && state.value !== 'waiting',
)
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
      (state.value === 'scrolling' ||
        state.value === 'waiting' ||
        state.value === 'pause')
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
    // Kill leaked loops: stopNotes() can miss a callback that is already
    // queued in the current frame batch (its stored rAF id is stale). Notes
    // must only ever animate while scrolling — bail out otherwise.
    if (state.value !== 'scrolling' || noteItem.meta.state === 'removed') {
      noteItem.raf = undefined
      return
    }
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
    svgNote.style.setProperty('--note-x', `${currentX}px`)

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

function handleGuess(guessNote: string) {
  // self-paced mode: also answerable while notes are still scrolling in
  const early = answerInLine && state.value === 'scrolling'
  if (state.value !== 'waiting' && !early) return

  // this runs inside the note-button click, the gesture that unlocks audio
  void unlockAudio()

  resetQuestionTimer()
  // keep the question fill where it stopped — the pause overlay fills over it,
  // and resetProgressTimer() clears both when scrolling resumes

  // normally the note at the spot; when answering early, the leading note
  // still scrolling toward it
  const item =
    notesQueue.value.find((item) => item.meta.state == 'in-question') ??
    notesQueue.value.find((item) => item.meta.state == 'default')
  if (!item) {
    // should not happen — but never leave the game dead
    console.error('No item found in notesQueue')
    if (!early) startPauseTimer()
    return
  }

  const svgNote = item.note.getSVGElement()
  if (!svgNote) {
    console.error('SVG element not found for note:', item.note)
    if (!early) startPauseTimer()
    return
  }

  modifyStaveNoteAnnotation(item.note as StaveNote, 'visibility', 'visible')
  item.meta.state = 'answered'
  svgNote.setAttribute('data-state', item.meta.state)

  // always play the correct pitch — hearing the right note is the ear-training
  if (soundEnabled) playNote(item.randomNote.key)

  const correctNote = item.note.keys[0].charAt(0)

  if (guessNote === correctNote) {
    colorizeNoteElement(svgNote, 'var(--p-success)')
    svgNote.style.setProperty('--note-x', `${item.meta.currentX}px`)
    svgNote.classList.add('correct')
    updateStats(true, item as NoteQueueItem)
  } else {
    colorizeNoteElement(svgNote, 'var(--p-danger)')
    svgNote.style.setProperty('--note-x', `${item.meta.currentX}px`)
    svgNote.classList.add('wrong')

    updateStats(false, item as NoteQueueItem)
    // don't end instantly — let the pause play so the shake and the tally
    // reaching the limit register, then end when the hold finishes
    if (errorsAllowed > 0 && incorrectGuessTotal.value >= errorsAllowed) {
      defeated = true
    }
  }

  if (early) {
    // the answered note keeps scrolling off on its own; no stop, no pause.
    // keep ~5 upcoming notes in the pipeline, but cap the total so answering
    // faster than notes scroll off can't pile them up unboundedly.
    if (defeated) {
      startPauseTimer() // shows the game-over hold, then ends
      return
    }
    const upcoming = notesQueue.value.filter(
      (i) => i.meta.state === 'default',
    ).length
    if (upcoming < 5 && notesQueue.value.length < 8) {
      addNotes(1)
      animateNote(
        notesQueue.value[notesQueue.value.length - 1] as NoteQueueItem,
      )
    }
    return
  }

  startPauseTimer()
}

function startPauseTimer() {
  state.value = 'pause'
  // game clock, not wall clock — the pause freezes in background tabs
  const pauseStart = gameNow()
  // drain the question fill back to zero over the full pause — the drain is
  // visible for the whole pause regardless of how early the answer came
  const drainFrom = progress.value
  // a losing answer holds long enough to see the outcome, even if the normal
  // pause is short or zero
  const durationMs = defeated
    ? Math.max(pauseDurationMs, gameOverHoldMs)
    : pauseDurationMs

  function finish() {
    pauseLoopRafId = null
    if (defeated) {
      endGame()
      return
    }
    state.value = 'scrolling'
    userGuess.value = ''
    resetQuestionTimer()
    resetProgressTimer()
    addNotes(1)
    playNotes()
  }

  function tickPause() {
    if (state.value !== 'pause') {
      pauseLoopRafId = null
      return
    }
    const elapsed = gameNow() - pauseStart
    progress.value =
      durationMs > 0 ? drainFrom * Math.max(0, 1 - elapsed / durationMs) : 0
    if (elapsed >= durationMs) {
      finish()
      return
    }
    pauseLoopRafId = requestAnimationFrame(tickPause)
  }
  pauseLoopRafId = requestAnimationFrame(tickPause)
}

function resetPauseTimer() {
  if (pauseLoopRafId !== null) {
    cancelAnimationFrame(pauseLoopRafId)
    pauseLoopRafId = null
  }
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
        .querySelector('#stave svg')
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

    // position immediately — the first animation frame may only run AFTER the
    // next paint (e.g. when added from within a rAF callback), and an
    // un-translated note would flash at its raw draw position for one frame
    svgNote.setAttribute('transform', `translate(${startX}, 0)`)
    colorizeNoteElement(svgNote, 'var(--text)')
    svgNote.setAttribute('data-id', notesQueue.value.length.toString())
    svgNote.setAttribute('data-start-x', startX.toString())
    svgNote.setAttribute('data-clef', randomNote.clef)
    svgNote.setAttribute('data-note', randomNote.note)
    svgNote.setAttribute('data-octave', randomNote.octave.toString())
    svgNote.setAttribute('data-state', noteQueueItem.meta.state)
    svgNote.setAttribute('data-current-x', startX.toString())
  })
}

function startExercise() {
  const container = vfContainer.value
  if (!container) {
    console.error('Container not found')
    return
  }
  defeated = false

  container.innerHTML = ''

  renderer = new Renderer(container, Renderer.Backends.SVG)
  // small headroom above the staves — without it the tallest up-stems get
  // clipped at the canvas edge
  const staveHeadroom = 10
  if (exercise === 'mixed') {
    renderer.resize(1000, 230 + staveHeadroom)
  } else if (exercise === 'treble' || exercise === 'bass') {
    renderer.resize(1000, 140 + staveHeadroom)
  }
  context = renderer.getContext()

  const staves = []
  if (exercise === 'mixed') {
    staveTreble = new Stave(0, staveHeadroom, 1000)
    staveTreble.addClef('treble')
    staveTreble.setContext(context).draw()
    staves.push(staveTreble)
    staveBass = new Stave(0, staveHeadroom + 100, 1000)
    staveBass.addClef('bass')
    staveBass.setContext(context).draw()
    staves.push(staveBass)
  } else if (exercise === 'treble') {
    staveTreble = new Stave(0, staveHeadroom, 1000)
    staveTreble.addClef(exercise)
    staveTreble.setContext(context).draw()
    staves.push(staveTreble)
  } else if (exercise === 'bass') {
    staveBass = new Stave(0, staveHeadroom, 1000)
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
  drawQuestionMarkers(staves)
  state.value = 'scrolling'

  // let the staff and first notes sit still briefly so the player can take in
  // the view before the notes start moving
  waitForNoteGroup()
    .then(() => {
      startDelayTimeout = window.setTimeout(playNotes, START_DELAY_MS)
    })
    .catch((err) => console.error(err.message))
}

/** Dashed vertical guide marking where the question happens — one local
 * segment per stave (so in mixed mode the gap between the staves stays
 * clear), drawn behind the notes. No extra canvas space needed. */
function drawQuestionMarkers(staves: Stave[]) {
  const svg = document.querySelector('#stave svg')
  const firstNote = notesQueue.value[0]?.note.getSVGElement()
  if (!svg || staves.length === 0 || !firstNote) return

  // visual x of a note when it reaches the question spot: the notehead's
  // drawn position plus the noteQuestionSpot translate
  const head = (firstNote.querySelector('.vf-notehead') ??
    firstNote) as SVGGraphicsElement
  const headBox = head.getBBox()
  const x = headBox.x + headBox.width / 2 + noteQuestionSpot

  for (const stave of staves) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', `${x}`)
    line.setAttribute('x2', `${x}`)
    line.setAttribute('y1', `${stave.getYForLine(0) - 10}`)
    line.setAttribute('y2', `${stave.getYForLine(4) + 10}`)
    // faded, almost-invisible guide: one ramp step off the background in
    // both themes — same step the progress bar track uses
    line.setAttribute('stroke', 'var(--background-200)')
    line.setAttribute('stroke-width', '1')
    line.setAttribute('stroke-dasharray', '12 10')
    line.setAttribute('class', 'question-marker')
    // first child: behind the staff lines and every note that scrolls past
    svg.insertBefore(line, svg.firstChild)
  }
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
  resetPauseTimer()
  if (startDelayTimeout !== null) {
    clearTimeout(startDelayTimeout)
    startDelayTimeout = null
  }

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
  initializeStats()
  preloadSound()
  document.addEventListener('visibilitychange', onDocumentVisibilityChange)
  startExercise()
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

  <div class="grid" v-if="state != 'game-over'">
    <ProgressBar :progress="progress" />
    <div
      ref="vfContainer"
      id="stave"
      class="staff-container pt-4 overflow-hidden"
    />
    <!-- piano input: tally above the keyboard -->
    <template v-if="inputMethod === 'piano'">
      <div
        class="mb-3 flex flex-col items-center pointer-events-none select-none text-center"
      >
        <div
          :key="correctGuessTotal"
          class="tally-correct text-3xl font-bold tabular-nums text-(--success-text)"
        >
          {{ correctGuessTotal }}
        </div>
        <div class="mt-1 text-sm font-semibold tabular-nums text-(--error-text)">
          {{ incorrectGuessTotal }} /
          {{ errorsAllowed > 0 ? errorsAllowed : '∞' }}
        </div>
      </div>
      <PianoKeyboard :disabled="answersDisabled" @answer="handleGuess" />
    </template>

    <!-- letter input: tally overlaid in the centre of the circle -->
    <div v-else class="relative">
      <LetterAnswers
        :notes="notes"
        :disabled="answersDisabled"
        @answer="handleGuess"
      />
      <div
        class="guess-tally absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center"
      >
        <!-- :key remounts the element on each increment, replaying the splash -->
        <div
          :key="correctGuessTotal"
          class="tally-correct text-3xl font-bold tabular-nums text-(--success-text)"
        >
          {{ correctGuessTotal }}
        </div>
        <div class="mt-1 text-sm font-semibold tabular-nums text-(--error-text)">
          {{ incorrectGuessTotal }} /
          {{ errorsAllowed > 0 ? errorsAllowed : '∞' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vf-stavenote {
  transition: opacity 0.5s ease-out;
}

/* splash when the correct-guess count goes up: the number pops and a
   success-colored ring ripples outward */
.tally-correct {
  position: relative;
  animation: tally-pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1);
}

/* droplet splash: each box-shadow is one droplet — they burst from behind
   the number, fly outward at uneven distances and shrink away (negative
   spread) like spray */
.tally-correct::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  margin: -3px;
  border-radius: 50%;
  background: transparent;
  pointer-events: none;
  opacity: 0;
  animation: tally-splash 0.65s ease-out;
}

@keyframes tally-pop {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes tally-splash {
  0% {
    opacity: 1;
    box-shadow:
      0 0 0 0 var(--success),
      0 0 0 -1px var(--success),
      0 0 0 0 var(--success),
      0 0 0 -1px var(--success),
      0 0 0 0 var(--success),
      0 0 0 -1px var(--success),
      0 0 0 0 var(--success),
      0 0 0 -1px var(--success);
  }
  100% {
    opacity: 0;
    box-shadow:
      0 -28px 0 -2px var(--success),
      19px -21px 0 -3px var(--success),
      27px 3px 0 -2px var(--success),
      17px 20px 0 -3px var(--success),
      -2px 26px 0 -2px var(--success),
      -20px 18px 0 -3px var(--success),
      -26px -3px 0 -2px var(--success),
      -16px -22px 0 -3px var(--success);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tally-correct,
  .tally-correct::after {
    animation: none;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(var(--note-x, 0px));
  }
  15% {
    transform: translateX(calc(var(--note-x, 0px) - 4px));
  }
  30% {
    transform: translateX(calc(var(--note-x, 0px) + 4px));
  }
  45% {
    transform: translateX(calc(var(--note-x, 0px) - 4px));
  }
  60% {
    transform: translateX(calc(var(--note-x, 0px) + 2px));
  }
  75% {
    transform: translateX(calc(var(--note-x, 0px) - 2px));
  }
}

/* The transform attribute is always translate(x, 0) — the note's vertical
   staff position lives in its path data, so y offsets are relative to 0.
   translateX(--note-x) must be carried through every frame because the CSS
   transform replaces the SVG transform attribute during the animation. */
/* single hop: fast rise that eases off at the peak, accelerating fall */
@keyframes jump {
  0% {
    transform: translateX(var(--note-x, 0px)) translateY(0px);
    animation-timing-function: ease-out;
  }
  45% {
    transform: translateX(var(--note-x, 0px)) translateY(-8px);
    animation-timing-function: ease-in;
  }
  100% {
    transform: translateX(var(--note-x, 0px)) translateY(0px);
  }
}

:deep(.wrong) {
  animation: shake 0.4s linear;
}

:deep(.correct) {
  animation: jump 0.3s;
}
</style>
