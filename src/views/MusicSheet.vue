<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  Renderer,
  Stave,
  StaveNote,
  Formatter,
  Voice,
  Annotation,
} from 'vexflow'

const scrollEl = ref<HTMLDivElement | null>(null)
const container = ref<HTMLDivElement | null>(null)

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
type NoteRef = { letter: string; octave: number }

/** ascending list of notes from start to end inclusive */
function range(
  startLetter: string,
  startOct: number,
  endLetter: string,
  endOct: number,
): NoteRef[] {
  const out: NoteRef[] = []
  let li = LETTERS.indexOf(startLetter)
  let oct = startOct
  for (let guard = 0; guard < 100; guard++) {
    out.push({ letter: LETTERS[li], octave: oct })
    if (LETTERS[li] === endLetter && oct === endOct) break
    if (++li >= LETTERS.length) {
      li = 0
      oct++
    }
  }
  return out
}

const CLEF_W = 60
const NOTE_W = 32
const PAD = 24
const HEIGHT = 400
const H_PADDING = 32 // .scroll left+right padding

function render() {
  const el = container.value
  const scroll = scrollEl.value
  if (!el || !scroll) return

  const treble = range('C', 4, 'C', 6) // middle C up to C6
  const bass = range('C', 2, 'C', 4) // C2 up to middle C
  const count = Math.max(treble.length, bass.length)

  // natural width fits notes at NOTE_W each; on wider screens stretch to fill
  // the available width, on narrower ones keep natural size and scroll
  const natural = CLEF_W + NOTE_W * count + PAD
  const available = scroll.clientWidth - H_PADDING
  const width = Math.max(natural, available)

  el.replaceChildren() // clear any previous render (e.g. on resize)
  const renderer = new Renderer(el, Renderer.Backends.SVG)
  renderer.resize(width, HEIGHT)
  const context = renderer.getContext()

  const drawStave = (list: NoteRef[], clef: 'treble' | 'bass', y: number) => {
    const stave = new Stave(0, y, width).addClef(clef)
    stave.setContext(context).draw()
    const notes = list.map((n) => {
      const note = new StaveNote({
        clef,
        keys: [`${n.letter.toLowerCase()}/${n.octave}`],
        duration: 'q',
      })
      note.addModifier(
        new Annotation(n.letter)
          .setFont('Arial', 11)
          .setVerticalJustification(Annotation.VerticalJustify.BOTTOM),
        0,
      )
      return note
    })
    const voice = new Voice({ numBeats: list.length, beatValue: 4 }).setStrict(
      false,
    )
    voice.addTickables(notes)
    new Formatter().joinVoices([voice]).format([voice], width - CLEF_W - PAD)
    voice.draw(context, stave)
  }

  drawStave(treble, 'treble', 60)
  drawStave(bass, 'bass', 230)

  // VexFlow draws in black; recolor with the theme text colour so it's visible
  // in both light and dark themes (same trick the exercise uses)
  const svg = el.querySelector('svg')
  if (svg) {
    svg.setAttribute('fill', 'var(--text)')
    svg.setAttribute('stroke', 'var(--text)')
    svg
      .querySelectorAll('g.vf-clef, g.vf-stavebarline')
      .forEach((n) => n.setAttribute('fill', 'var(--text)'))
  }
}

let observer: ResizeObserver | null = null
onMounted(() => {
  render()
  if (typeof ResizeObserver !== 'undefined' && scrollEl.value) {
    // re-fit when the width changes (e.g. rotating a tablet)
    observer = new ResizeObserver(() => render())
    observer.observe(scrollEl.value)
  }
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <section class="musicsheet">
    <div ref="scrollEl" class="scroll">
      <div ref="container" class="stave" />
    </div>
  </section>
</template>

<style scoped>
.musicsheet {
  padding: 1rem 0;
}
/* break out of the centered app column so wide screens use the full width;
   collapses to no-op on phones (viewport == the column) */
.scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 1rem;
  margin-inline: calc(50% - 50vw);
}
.stave {
  width: max-content;
  margin: 0 auto;
}
</style>
