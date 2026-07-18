import { onUnmounted, ref } from 'vue'

// Web MIDI input. Works over Bluetooth (BLE-MIDI) or USB — the browser sees any
// OS-paired instrument as a MIDI input, the transport is irrelevant here.
// Supported on Android Chrome (incl. the TWA) and desktop Chrome/Edge; NOT on
// iOS/iPadOS Safari, which has never shipped Web MIDI — hence `supported`.

const CHROMA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// "Chord gesture": this many note-ons landing within this window counts as a
// deliberate simultaneous chord (all fingers down together) rather than a
// melody — used as a hands-free restart on the score screen. A time window
// avoids depending on note-off, which not every controller sends reliably.
const CHORD_NOTES = 3
const CHORD_WINDOW_MS = 120
const CHORD_COOLDOWN_MS = 400

export type MidiNote = {
  /** note letter with accidental, no octave — "C", "C#" (matches PianoKeyboard's emit) */
  name: string
  /** bare letter — "C" */
  letter: string
  /** full name with octave — "C4" (middle C = MIDI 60) */
  key: string
  midi: number
  velocity: number
}

export function useMidiInput() {
  const supported =
    typeof navigator !== 'undefined' &&
    typeof navigator.requestMIDIAccess === 'function'
  const enabled = ref(false)
  const error = ref<string | null>(null)
  /** names of the currently connected input devices */
  const devices = ref<string[]>([])

  let access: MIDIAccess | null = null
  let onNote: ((note: MidiNote) => void) | null = null
  let onChord: (() => void) | null = null
  // timestamps of recent note-ons, for the simultaneous-chord gesture
  let recentOns: number[] = []
  let chordCooldownUntil = 0

  function decode(data: Uint8Array): MidiNote | null {
    const status = data[0]
    const midi = data[1]
    const velocity = data[2]
    // note-on on any channel with non-zero velocity (velocity 0 == note-off)
    if ((status & 0xf0) !== 0x90 || !velocity) return null
    const pc = ((midi % 12) + 12) % 12
    const octave = Math.floor(midi / 12) - 1
    const name = CHROMA[pc]
    return { name, letter: name[0], key: `${name}${octave}`, midi, velocity }
  }

  function detectChord() {
    if (!onChord) return
    const now = performance.now()
    recentOns = recentOns.filter((t) => now - t <= CHORD_WINDOW_MS)
    recentOns.push(now)
    if (recentOns.length >= CHORD_NOTES && now >= chordCooldownUntil) {
      // don't retrigger on the same slam or its release chatter
      chordCooldownUntil = now + CHORD_COOLDOWN_MS
      recentOns = []
      onChord()
    }
  }

  function onMessage(e: MIDIMessageEvent) {
    if (!e.data) return
    const note = decode(e.data)
    if (!note) return
    onNote?.(note)
    detectChord()
  }

  // (Re)attach to every input — also runs on statechange so a piano paired or
  // powered on after start() is picked up without a restart.
  function bindInputs() {
    if (!access) return
    const names: string[] = []
    access.inputs.forEach((input) => {
      input.onmidimessage = onMessage
      if (input.name) names.push(input.name)
    })
    devices.value = names
  }

  async function start(opts: {
    /** fired on every note-on, with the note's name/letter */
    onNote?: (note: MidiNote) => void
    /** fired once when several keys are pressed together (a chord gesture) */
    onChord?: () => void
  }) {
    onNote = opts.onNote ?? null
    onChord = opts.onChord ?? null
    if (!supported) {
      error.value = 'Web MIDI is not available on this device'
      return
    }
    try {
      access = await navigator.requestMIDIAccess({ sysex: false })
      access.onstatechange = bindInputs
      bindInputs()
      enabled.value = true
      error.value = null
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : 'Could not access MIDI devices'
      enabled.value = false
    }
  }

  function stop() {
    onNote = null
    onChord = null
    recentOns = []
    if (access) {
      access.inputs.forEach((input) => {
        input.onmidimessage = null
      })
      access.onstatechange = null
      access = null
    }
    enabled.value = false
    devices.value = []
  }

  onUnmounted(stop)

  return { supported, enabled, error, devices, start, stop }
}
