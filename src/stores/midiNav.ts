import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// App-wide MIDI navigation: keys are mapped to navigation actions (bottom nav,
// history back/forward, and the current view's links). Views register their
// targets; the app-level MIDI listener (App.vue) calls dispatch() on each
// note-on. Static 88-key layout (A0 = MIDI 21 ... C8 = 108) — device range
// can't be queried over Web MIDI, so 88 keys is assumed.

const CHROMA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
/** MIDI number -> note name with octave, e.g. 24 -> "C1" (middle C = 60 = C4) */
export function midiKeyName(m: number): string {
  return CHROMA[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1)
}

const WHITE = [0, 2, 4, 5, 7, 9, 11]
/** `count` ascending white-key MIDI numbers starting at/after `start` */
export function whiteKeys(start: number, count: number): number[] {
  const out: number[] = []
  for (let m = start; out.length < count; m++) {
    if (WHITE.includes(((m % 12) + 12) % 12)) out.push(m)
  }
  return out
}

// Fixed persistent keys, low register so they're easy to find by feel. The
// leader is the lowest key, kept distinct from Back so both can be live at once
// on a protected view (leader arms nav, Back/Forward then work).
export const LEADER_KEY = 21 // A0 — arms nav mode on protected training views
export const HISTORY_KEYS = { back: 23, forward: 24 } // B0, C1
export const BOTTOM_KEYS = whiteKeys(26, 8) // D1, E1, F1, ... for the footer nav
export const VIEW_KEYS = whiteKeys(36, 40) // C2 upward, for in-view links

export const useMidiNavStore = defineStore('midiNav', () => {
  // MIDI is present and the user opted in (kept in sync by App.vue)
  const enabled = ref(false)
  // set from the current route. A leaf training view "captures" MIDI so global
  // nav is suspended there — a user playing along doesn't navigate. Most also
  // enable the leader (lowest key) to toggle nav mode on demand; the Reference
  // captures but owns its leader itself, so it doesn't.
  const captured = ref(false)
  const leaderEnabled = ref(false)
  // while nav mode is on, global nav is live again on a captured view (entered
  // via the leader) — this is the protection: notes navigate only when armed
  const navMode = ref(false)
  // a captured view (e.g. the Reference) has opened its OWN nav. MIDI notes stay
  // reserved for that view, but the global *keyboard* nav + badges turn on — so
  // it's navigable/debuggable without a device. Any future such view sets this.
  const hostNav = ref(false)
  // how nav was last armed, so badges/hints show the matching key set
  const navVia = ref<'keyboard' | 'midi'>('midi')
  // MIDI nav: suspended on captured views unless armed by the leader
  const midiActive = computed(
    () => enabled.value && (!captured.value || navMode.value),
  )
  // badges + keyboard nav: also live when a captured view surfaces its own nav
  const active = computed(
    () => midiActive.value || (enabled.value && hostNav.value),
  )

  const actions = new Map<number, () => void>() // midi number -> action
  const keyActions = new Map<string, () => void>() // keyboard key -> action
  const midiToKey = new Map<number, string>() // for cleanup on unregister

  function register(midi: number, action: () => void, key?: string) {
    actions.set(midi, action)
    if (key) {
      keyActions.set(key, action)
      midiToKey.set(midi, key)
    }
  }
  function unregister(midi: number) {
    actions.delete(midi)
    const k = midiToKey.get(midi)
    if (k !== undefined) {
      keyActions.delete(k)
      midiToKey.delete(midi)
    }
  }
  function dispatch(midi: number) {
    // MIDI dispatch uses the strict gate — never fires on a captured view's own
    // notes (they belong to that view), only when the leader has armed nav
    if (!midiActive.value) return
    const action = actions.get(midi)
    if (action) {
      navVia.value = 'midi'
      action()
    }
  }
  function dispatchKey(key: string): boolean {
    if (!active.value) return false
    const action = keyActions.get(key)
    if (action) {
      navVia.value = 'keyboard'
      action()
      return true
    }
    return false
  }

  // App sets the MIDI context on every route change
  function setView(opts: { captured: boolean; leader: boolean }) {
    captured.value = opts.captured
    leaderEnabled.value = opts.leader
    navMode.value = false // never carry nav mode across a view change
    hostNav.value = false
  }
  // a captured view calls this while its own nav is open/closed
  function setHostNav(v: boolean) {
    hostNav.value = v
  }
  function toggleNavMode(via: 'keyboard' | 'midi' = 'midi') {
    if (leaderEnabled.value) {
      navMode.value = !navMode.value
      navVia.value = via
    }
  }

  return {
    enabled,
    captured,
    leaderEnabled,
    navMode,
    hostNav,
    navVia,
    midiActive,
    active,
    register,
    unregister,
    dispatch,
    dispatchKey,
    setView,
    setHostNav,
    toggleNavMode,
  }
})
