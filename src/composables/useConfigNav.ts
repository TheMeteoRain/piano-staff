import { ref } from 'vue'
import { useMidiInput, type MidiNote } from './useMidiInput'

// Hands-free option navigation, so a player never has to reach for the screen.
// Two input paths drive the same actions:
//   - MIDI: static 88-key layout (A0 = MIDI 21 ... C8 = 108). The lowest key is
//     the "leader" that toggles config mode; a compact cluster of the top keys
//     is the vim cursor. (Device key range can't be queried over Web MIDI, so
//     88 keys is assumed for now.)
//   - Keyboard (also a simulator for the MIDI flow): Space = leader, hjkl =
//     navigation, Enter = confirm, Esc = cancel.
const MIDI = {
  leader: 21, // A0, lowest key
  up: 107, // B7
  down: 105, // A7
  left: 103, // G7
  right: 108, // C8
  confirm: 106, // A#7 (highest black)
  cancel: 104, // G#7 (2nd-highest black)
  display: 102, // F#7 — toggle an extra view (piano/staff on the Reference)
}
/** the F#7 key that toggles the optional display, exposed for the on-screen hint */
export const DISPLAY_KEY = MIDI.display

// note letters -> pitch class, so the keyboard can set the root directly like
// playing a note does on MIDI. Naturals only for now — accidentals (black keys)
// aren't typeable yet.
const NOTE_KEYS: Record<string, number> = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
}

export function useConfigNav(opts: {
  /** number of option rows to cycle through with up/down (or a getter, for
   * views whose row count changes with the mode) */
  rowCount: number | (() => number)
  /** change the focused row's value: left = -1, right = +1 */
  onLeft: (row: number) => void
  onRight: (row: number) => void
  /** set the root directly to a pitch class (0=C .. 11=B): a non-reserved MIDI
   * key played, or a note letter typed, while in config mode */
  onRoot?: (pc: number) => void
  /** toggle an extra display (piano/staff) without leaving config mode */
  onToggleDisplay?: () => void
  /** entering config mode — snapshot current values here for a later cancel */
  onEnter?: () => void
  /** leaving config mode — committed = false means the user cancelled */
  onExit?: (committed: boolean) => void
}) {
  const midi = useMidiInput()
  const active = ref(false)
  const focusedRow = ref(0)
  // how config mode was entered, so hints show the matching key set
  const enteredVia = ref<'keyboard' | 'midi' | null>(null)

  function enter(via: 'keyboard' | 'midi') {
    opts.onEnter?.()
    focusedRow.value = 0
    enteredVia.value = via
    active.value = true
  }
  function exit(committed: boolean) {
    active.value = false
    opts.onExit?.(committed)
  }
  function toggle(via: 'keyboard' | 'midi') {
    if (active.value) exit(true)
    else enter(via)
  }
  function rowCount() {
    return typeof opts.rowCount === 'function' ? opts.rowCount() : opts.rowCount
  }
  function up() {
    const n = rowCount()
    focusedRow.value = (focusedRow.value - 1 + n) % n
  }
  function down() {
    const n = rowCount()
    focusedRow.value = (focusedRow.value + 1) % n
  }
  // picking a root directly (a played note / typed letter) is also the "done"
  // action: set the key, then commit and leave config mode
  function selectRoot(pc: number) {
    opts.onRoot?.(pc)
    exit(true)
  }

  function onNote(note: MidiNote) {
    const m = note.midi
    if (m === MIDI.leader) return toggle('midi')
    if (!active.value) return
    switch (m) {
      case MIDI.up:
        up()
        break
      case MIDI.down:
        down()
        break
      case MIDI.left:
        opts.onLeft(focusedRow.value)
        break
      case MIDI.right:
        opts.onRight(focusedRow.value)
        break
      case MIDI.confirm:
        exit(true)
        break
      case MIDI.cancel:
        exit(false)
        break
      case MIDI.display:
        opts.onToggleDisplay?.() // stays in config mode
        break
      default:
        selectRoot(((m % 12) + 12) % 12)
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key
    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault() // also stops Space from scrolling / clicking a focused button
      toggle('keyboard')
      return
    }
    if (k === 'Escape') {
      if (active.value) {
        e.preventDefault()
        exit(false)
      }
      return
    }
    if (!active.value) return
    if (k === 'Enter') {
      e.preventDefault()
      exit(true)
      return
    }
    const key = k.toLowerCase()
    if (key === 'h') opts.onLeft(focusedRow.value)
    else if (key === 'l') opts.onRight(focusedRow.value)
    else if (key === 'j') down()
    else if (key === 'k') up()
    else if (key === 't') opts.onToggleDisplay?.() // toggle piano/staff, stay
    else if (key in NOTE_KEYS) selectRoot(NOTE_KEYS[key]) // A–G set root & exit
    else return // leave other keys to the browser
    e.preventDefault()
  }

  // on a pointer device you'd just use the on-screen controls directly, so a
  // click/tap anywhere leaves config mode (committing). Not prevented, so the
  // control you tapped still does its thing.
  function onPointerDown() {
    if (active.value) exit(true)
  }

  /** attach input listeners. keyboard + pointer are always on; MIDI only when
   * asked, so the permission prompt is opt-in. */
  function start({ midi: useMidi = false }: { midi?: boolean } = {}) {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('pointerdown', onPointerDown)
    if (useMidi) void midi.start({ onNote })
  }
  function stop() {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('pointerdown', onPointerDown)
    midi.stop()
  }

  return {
    midiSupported: midi.supported,
    active,
    focusedRow,
    enteredVia,
    start,
    stop,
  }
}
