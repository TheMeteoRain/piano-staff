<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import CircleOfFifths from '@/components/CircleOfFifths.vue'
import PianoKeyboard from '@/components/inputs/PianoKeyboard.vue'
import Button from '@/volt/Button.vue'
import Slider from '@/volt/Slider.vue'
import Divider from '@/volt/Divider.vue'
import { useNoteSound } from '@/composables/useNoteSound'

const { preloadSound, unlockAudio, playChord } = useNoteSound()

type Quality = 'major' | 'minor'
type Selection = { index: number; root: string; quality: Quality; name: string }

// canonical (sharp) spelling per pitch class — matches the keyboard's key names
const CHROMA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const PITCH_CLASS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

const selected = ref<Selection | null>(null)
const circle = ref<InstanceType<typeof CircleOfFifths>>()
const muted = ref(false)

// don't play the initial (mount-time) selection — audio needs a user gesture
let ready = false

/** triad as concrete keys (name+octave) voiced around middle C: the root is
 * placed in the F3–E4 window so every chord sits centered on C4. */
const triad = computed(() => {
  if (!selected.value) return []
  const pc = PITCH_CLASS[selected.value.root]
  const rootMidi = pc >= 5 ? 36 + pc : 48 + pc
  const offsets = selected.value.quality === 'major' ? [0, 4, 7] : [0, 3, 7]
  return offsets.map((o) => {
    const midi = rootMidi + o
    return CHROMA[midi % 12] + Math.floor(midi / 12)
  })
})

/** note names without octave, for the label */
const triadNames = computed(() =>
  triad.value.map((id) => id.replace(/\d+$/, '')),
)

function onSelect(payload: Selection) {
  selected.value = payload
  playPos = payload.index // keep auto-play in sync with manual taps
  if (ready && !muted.value) {
    void unlockAudio()
    playChord(triad.value)
  }
}

function toggleMute() {
  muted.value = !muted.value
  if (!muted.value) void unlockAudio() // unmuting is a gesture — unlock audio
}

// auto-play: walk through the 12 keys, playing each. The buttons pick the
// quality (major/minor); the direction toggle picks which way it rotates.
const KEY_COUNT = 12
const direction = ref<1 | -1>(1) // 1 = clockwise, -1 = counter-clockwise
const playingQuality = ref<Quality | null>(null) // null = stopped
let timer: ReturnType<typeof setInterval> | null = null
let playPos = 0

// seconds between chords: 1s (fastest) to 10s (slowest)
const STEP_MIN_S = 1
const STEP_MAX_S = 10
const stepSeconds = ref(2)
// apply a speed change immediately while playing by restarting the interval
watch(stepSeconds, () => {
  if (playingQuality.value !== null && timer !== null) {
    clearInterval(timer)
    timer = setInterval(step, stepSeconds.value * 1000)
  }
})

function step() {
  playPos = (playPos + direction.value + KEY_COUNT) % KEY_COUNT
  circle.value?.select(playPos, playingQuality.value ?? 'major')
}

function stop() {
  playingQuality.value = null
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function startPlay(quality: Quality) {
  if (playingQuality.value === quality) {
    stop() // pressing the active one again stops
    return
  }
  playingQuality.value = quality
  void unlockAudio()
  circle.value?.select(playPos, quality) // play the current key now
  if (timer !== null) clearInterval(timer)
  timer = setInterval(step, stepSeconds.value * 1000)
}

function toggleDirection() {
  direction.value = direction.value === 1 ? -1 : 1
}

onMounted(() => {
  preloadSound()
  ready = true
})
onUnmounted(stop)
</script>

<template>
  <section class="chords">
    <CircleOfFifths ref="circle" @select="onSelect" />

    <p class="chord-name">
      <span class="name">{{ selected?.name ?? 'Pick a chord' }}</span>
      <span v-if="triadNames.length" class="notes">{{
        triadNames.join(' · ')
      }}</span>
    </p>

    <PianoKeyboard readonly :highlight="triad" :range="['F3', 'B4']" />

    <Divider />

    <div class="controls">
      <Button
        :label="playingQuality === 'major' ? 'Stop' : 'Play majors'"
        @click="startPlay('major')"
      >
        <template #icon>
          <Icon
            :icon="playingQuality === 'major' ? 'mdi:stop' : 'mdi:play'"
            width="20"
          />
        </template>
      </Button>
      <Button
        :label="playingQuality === 'minor' ? 'Stop' : 'Play minors'"
        @click="startPlay('minor')"
      >
        <template #icon>
          <Icon
            :icon="playingQuality === 'minor' ? 'mdi:stop' : 'mdi:play'"
            width="20"
          />
        </template>
      </Button>
      <Button
        variant="outlined"
        :aria-label="direction === 1 ? 'Clockwise' : 'Counter-clockwise'"
        :title="direction === 1 ? 'Clockwise' : 'Counter-clockwise'"
        @click="toggleDirection"
      >
        <template #icon>
          <Icon
            :icon="direction === 1 ? 'mdi:rotate-right' : 'mdi:rotate-left'"
            width="22"
          />
        </template>
      </Button>
      <Button
        variant="outlined"
        :aria-label="muted ? 'Unmute' : 'Mute'"
        :title="muted ? 'Unmute' : 'Mute'"
        @click="toggleMute"
      >
        <template #icon>
          <Icon
            :icon="muted ? 'mdi:volume-off' : 'mdi:volume-high'"
            width="22"
          />
        </template>
      </Button>
    </div>

    <div class="speed">
      <div class="speed-value">{{ stepSeconds.toFixed(1) }}s per chord</div>
      <div class="speed-row">
        <span class="speed-label">{{ STEP_MIN_S }}s</span>
        <Slider
          v-model="stepSeconds"
          :min="STEP_MIN_S"
          :max="STEP_MAX_S"
          :step="0.5"
          class="speed-slider"
          aria-label="Seconds between chords"
        />
        <span class="speed-label">{{ STEP_MAX_S }}s</span>
      </div>
    </div>

  </section>
</template>

<style scoped>
.chords {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem;
  max-width: 480px;
  margin: 0 auto;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}
.speed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  max-width: 340px;
}
.speed-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}
.speed-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.speed-slider {
  flex: 1;
}
.speed-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.chord-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  text-align: center;
}
.chord-name .name {
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: capitalize;
}
.chord-name .notes {
  color: var(--text-muted);
  font-size: 1rem;
  letter-spacing: 0.03em;
}
</style>
