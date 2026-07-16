<script setup lang="ts">
import { ref, onMounted } from 'vue'

/** Interactive circle of fifths. Outer ring = major keys, inner ring = relative
 * minors. Selection uses polar hit-testing (tap angle picks the key over a full
 * 30° slice, tap radius picks major vs minor), so even the smaller inner ring is
 * finger-friendly. Emits the chosen chord's root + quality. */

type Quality = 'major' | 'minor'
const emit = defineEmits<{
  select: [payload: { index: number; root: string; quality: Quality; name: string }]
}>()

// clockwise from the top (12 o'clock)
const MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const MINORS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D']

const VIEW = 400
const C = VIEW / 2
const OUTER = 192
const SPLIT = 120
const HOLE = 52
const MAJOR_LABEL_R = (SPLIT + OUTER) / 2
const MINOR_LABEL_R = (HOLE + SPLIT) / 2

function pt(r: number, i: number, off = 0): [number, number] {
  const rad = ((i * 30 + off - 90) * Math.PI) / 180
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)]
}
function sector(ri: number, ro: number, i: number): string {
  const [x0i, y0i] = pt(ri, i, -15)
  const [x0o, y0o] = pt(ro, i, -15)
  const [x1o, y1o] = pt(ro, i, 15)
  const [x1i, y1i] = pt(ri, i, 15)
  return `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${ro} ${ro} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${ri} ${ri} 0 0 0 ${x0i} ${y0i} Z`
}

const wedges = MAJORS.map((major, i) => {
  const [mlx, mly] = pt(MAJOR_LABEL_R, i)
  const [nlx, nly] = pt(MINOR_LABEL_R, i)
  return {
    i,
    major,
    minorLabel: MINORS[i] + 'm',
    majorPath: sector(SPLIT, OUTER, i),
    minorPath: sector(HOLE, SPLIT, i),
    majorLabel: { x: mlx, y: mly },
    minorLabelPos: { x: nlx, y: nly },
  }
})

const svgRef = ref<SVGSVGElement>()
const selectedIndex = ref<number | null>(null)
const selectedQuality = ref<Quality | null>(null)

function select(i: number, quality: Quality) {
  selectedIndex.value = i
  selectedQuality.value = quality
  const root = quality === 'major' ? MAJORS[i] : MINORS[i]
  emit('select', { index: i, root, quality, name: `${root} ${quality}` })
}

// let the parent drive selection (e.g. the auto-play walk through the majors)
defineExpose({ select })

function onPointer(e: PointerEvent) {
  const svg = svgRef.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * VIEW - C
  const y = ((e.clientY - rect.top) / rect.height) * VIEW - C
  const r = Math.hypot(x, y)
  if (r < HOLE || r > OUTER) return // center hole or outside the rings
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360
  const i = Math.round(deg / 30) % 12
  select(i, r < SPLIT ? 'minor' : 'major')
}

// start on C major so the keyboard shows a chord immediately
onMounted(() => select(0, 'major'))
</script>

<template>
  <svg
    ref="svgRef"
    class="circle"
    :viewBox="`0 0 ${VIEW} ${VIEW}`"
    @pointerdown.prevent="onPointer"
  >
    <template v-for="w in wedges" :key="w.i">
      <path
        class="wedge major"
        :class="{
          selected: selectedIndex === w.i && selectedQuality === 'major',
        }"
        :d="w.majorPath"
      />
      <path
        class="wedge minor"
        :class="{
          selected: selectedIndex === w.i && selectedQuality === 'minor',
        }"
        :d="w.minorPath"
      />
    </template>
    <template v-for="w in wedges" :key="`l${w.i}`">
      <text
        class="label"
        :class="{
          selected: selectedIndex === w.i && selectedQuality === 'major',
        }"
        :x="w.majorLabel.x"
        :y="w.majorLabel.y"
      >
        {{ w.major }}
      </text>
      <text
        class="label minor"
        :class="{
          selected: selectedIndex === w.i && selectedQuality === 'minor',
        }"
        :x="w.minorLabelPos.x"
        :y="w.minorLabelPos.y"
      >
        {{ w.minorLabel }}
      </text>
    </template>
  </svg>
</template>

<style scoped>
.circle {
  width: 100%;
  max-width: 380px;
  aspect-ratio: 1;
  touch-action: manipulation;
  user-select: none;
}
/* semi-transparent brand tints keep contrast in both light and dark themes,
   since the alpha preserves the underlying page-background luminance */
.wedge {
  stroke: var(--background);
  stroke-width: 2.5;
  cursor: pointer;
}
.wedge.major {
  fill: rgba(93, 33, 222, 0.12);
}
.wedge.minor {
  fill: rgba(93, 33, 222, 0.24);
}
.wedge.selected {
  fill: #5d21de;
}
.label {
  fill: var(--text);
  font-weight: 600;
  font-size: 16px;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}
.label.minor {
  font-size: 13px;
}
.label.selected {
  fill: #fff;
}
</style>
