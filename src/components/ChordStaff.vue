<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Renderer,
  Stave,
  StaveNote,
  Formatter,
  Voice,
  Annotation,
  Beam,
  BarNote,
} from 'vexflow'

/** Renders chord/scale notes on a single treble staff — the notation view of the
 * Reference. Each group is one StaveNote's keys (a chord = one multi-key note; a
 * scale = a run of single-key notes). Treble only for now (low chords sit on
 * ledger lines). */
const props = defineProps<{
  /** each inner array is one StaveNote's keys, e.g. ['c/4','e/4','g/4'] */
  groups: string[][]
  /** default note duration when `durations` doesn't cover an index */
  duration?: string
  /** per-group note duration, e.g. ['q','8','8','8'] (block then beamed run) */
  durations?: string[]
  /** optional caption under each group, e.g. ['block', 'broken'] */
  captions?: string[]
  /** group indices to beam together (must be beamable durations, e.g. '8') */
  beam?: number[]
  /** insert a barline after these group indices */
  barAfter?: number[]
}>()

const scrollEl = ref<HTMLDivElement | null>(null)
const container = ref<HTMLDivElement | null>(null)

const CLEF_W = 56
const PAD = 24
const GROUP_W = 58 // per-note spacing — kept tight so the staff stays compact
const HEIGHT = 190
const STAVE_Y = 74 // headroom above for high notes; room below for ledger + caption

function render() {
  const el = container.value
  const scroll = scrollEl.value
  if (!el || !scroll) return
  el.replaceChildren()
  const groups = props.groups
  if (groups.length === 0) return

  // natural, compact width (centered by CSS); only long runs exceed the
  // viewport and then scroll — a few chord notes stay close together
  const width = CLEF_W + GROUP_W * groups.length + PAD

  const renderer = new Renderer(el, Renderer.Backends.SVG)
  renderer.resize(width, HEIGHT)
  const context = renderer.getContext()

  const stave = new Stave(0, STAVE_Y, width).addClef('treble')
  stave.setContext(context).draw()

  const notes = groups.map((keys, i) => {
    const note = new StaveNote({
      clef: 'treble',
      keys,
      duration: props.durations?.[i] ?? props.duration ?? 'q',
    })
    const cap = props.captions?.[i]
    if (cap) {
      note.addModifier(
        new Annotation(cap)
          .setFont('Arial', 11)
          .setVerticalJustification(Annotation.VerticalJustify.BOTTOM),
        0,
      )
    }
    return note
  })

  // interleave a barline between groups where asked (e.g. block | broken)
  const tickables: (StaveNote | BarNote)[] = []
  notes.forEach((note, i) => {
    tickables.push(note)
    if (props.barAfter?.includes(i)) tickables.push(new BarNote())
  })

  const voice = new Voice({ numBeats: groups.length, beatValue: 4 }).setStrict(
    false,
  )
  voice.addTickables(tickables)
  new Formatter().joinVoices([voice]).format([voice], width - CLEF_W - PAD)

  const beam =
    props.beam && props.beam.length > 1
      ? new Beam(props.beam.map((i) => notes[i]))
      : null

  voice.draw(context, stave)
  beam?.setContext(context).draw()

  // VexFlow draws in black; recolor to the theme text colour (light & dark)
  const svg = el.querySelector('svg')
  if (svg) {
    svg.setAttribute('fill', 'var(--text)')
    svg.setAttribute('stroke', 'var(--text)')
    svg
      .querySelectorAll('g.vf-clef')
      .forEach((n) => n.setAttribute('fill', 'var(--text)'))
    // crop the viewBox to the actual drawn content, so the tall canvas's dead
    // space (which made the staff look padded and bottom-aligned) is removed,
    // then scale that tight box to fill the width — bigger on large screens
    let box = `0 0 ${width} ${HEIGHT}`
    try {
      const b = svg.getBBox()
      const m = 8
      box = `${b.x - m} ${b.y - m} ${b.width + 2 * m} ${b.height + 2 * m}`
    } catch {
      box = `0 0 ${width} ${HEIGHT}` // not laid out yet — use the full canvas
    }
    svg.setAttribute('viewBox', box)
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.width = '100%'
    svg.style.height = 'auto'
  }
}

let observer: ResizeObserver | null = null
onMounted(() => {
  render()
  if (typeof ResizeObserver !== 'undefined' && scrollEl.value) {
    observer = new ResizeObserver(() => render())
    observer.observe(scrollEl.value)
  }
})
onUnmounted(() => observer?.disconnect())
watch(
  () => [
    props.groups,
    props.duration,
    props.durations,
    props.captions,
    props.beam,
    props.barAfter,
  ],
  render,
  { deep: true },
)
</script>

<template>
  <section class="chord-staff">
    <div ref="scrollEl" class="scroll">
      <div ref="container" class="stave" />
    </div>
  </section>
</template>

<style scoped>
.chord-staff {
  width: 100%;
}
.scroll {
  width: 100%;
}
.stave {
  width: 100%;
}
</style>
