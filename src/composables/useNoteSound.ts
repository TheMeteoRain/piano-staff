import { Sampler, start as toneStart, getContext } from 'tone'

/**
 * Authentic piano note playback via Tone.Sampler, using the SplendidGrandPiano
 * recordings self-hosted under /piano (see public/piano). Fully offline once
 * the app is installed — the samples are precached by the service worker.
 *
 * One shared sampler for the whole app. Call `unlockAudio()` from a user
 * gesture (browsers block audio until then), then `playNote('C/4')`.
 */

// note -> sample file; Tone pitch-shifts to fill the gaps between samples
const SAMPLES: Record<string, string> = {
  'C#2': 'Cs2.m4a',
  D2: 'D2.m4a',
  E2: 'E2.m4a',
  F2: 'F2.m4a',
  G2: 'G2.m4a',
  A2: 'A2.m4a',
  B2: 'B2.m4a',
  C3: 'C3.m4a',
  D3: 'D3.m4a',
  E3: 'E3.m4a',
  F3: 'F3.m4a',
  G3: 'G3.m4a',
  'G#3': 'Gs3.m4a',
  A3: 'A3.m4a',
  'A#3': 'As3.m4a',
  B3: 'B3.m4a',
  C4: 'C4.m4a',
  D4: 'D4.m4a',
  E4: 'E4.m4a',
  F4: 'F4.m4a',
  G4: 'G4.m4a',
  A4: 'A4.m4a',
  B4: 'B4.m4a',
  C5: 'C5.m4a',
  D5: 'D5.m4a',
  E5: 'E5.m4a',
  F5: 'F5.m4a',
  G5: 'G5.m4a',
  'G#5': 'Gs5.m4a',
  A5: 'A5.m4a',
  'A#5': 'As5.m4a',
  B5: 'B5.m4a',
}

let sampler: Sampler | null = null
let gestureBound = false

function getSampler(): Sampler {
  if (!sampler) {
    // Tone schedules events lookAhead seconds ahead (default 0.1s) to avoid
    // glitches — but that reads as a ~100ms delay when a note is played on a
    // key press. Zero it so notes sound the instant they're triggered.
    getContext().lookAhead = 0
    sampler = new Sampler({
      urls: SAMPLES,
      baseUrl: `${import.meta.env.BASE_URL}piano/`,
      // short damper-like release so the previous note stops cleanly (no
      // click) when the next key is pressed
      release: 0.3,
    }).toDestination()
  }
  return sampler
}

/** Resume the audio context if it is not already running. */
function ensureRunning(): void {
  const ctx = getContext()
  if (ctx.rawContext.state !== 'running') {
    void toneStart()
  }
}

/**
 * Start loading the samples ahead of time (no user gesture needed for the
 * fetch/decode) and unlock audio on the first pointer/key gesture anywhere —
 * which fires before the first answer's click, so even the first note plays.
 * Call on mount.
 */
export function preloadSound(): void {
  getSampler()
  if (gestureBound || typeof window === 'undefined') return
  gestureBound = true
  const unlock = () => ensureRunning()
  window.addEventListener('pointerdown', unlock, { once: true, capture: true })
  window.addEventListener('keydown', unlock, { once: true, capture: true })
}

/** Resume the audio context from a user gesture; safe to call repeatedly. */
export async function unlockAudio(): Promise<void> {
  await toneStart()
  getSampler()
}

// hard cap on how long a note rings — short enough that it finishes with a
// little silence before the next note comes up
const MAX_RING_SECONDS = 1.8

/**
 * Play a note like a real key press: strike it and let it ring, but never
 * longer than MAX_RING_SECONDS so it ends a beat before the next note. If you
 * answer faster than that, the next press damps this one — only one rings at a
 * time. Accepts the app's `note/octave` key (e.g. "C/4") or a plain Tone note
 * name ("C4"). No-op until the samples have loaded.
 */
export function playNote(note: string): void {
  const s = getSampler()
  // called from a click handler, so resuming here is allowed — covers a
  // context that was suspended (first gesture, or mobile backgrounding)
  ensureRunning()
  if (!s.loaded) return
  s.releaseAll() // damp the previous note before striking the next
  s.triggerAttackRelease(note.replace('/', ''), MAX_RING_SECONDS)
}

/**
 * Play the notes as one chord, struck together. Uses a softer velocity than a
 * single note: three notes at full velocity pile up energy in the low end and
 * turn muddy, so easing off keeps the chord clear. Each note rings up to
 * MAX_RING_SECONDS and a previous chord is damped first. Accepts Tone note
 * names ("C4", "F#4") or "C/4" form. No-op until the samples have loaded.
 */
export function playChord(notes: string[], velocity = 0.6): void {
  const s = getSampler()
  ensureRunning()
  if (!s.loaded || notes.length === 0) return
  s.releaseAll()
  s.triggerAttackRelease(
    notes.map((n) => n.replace('/', '')),
    MAX_RING_SECONDS,
    undefined,
    velocity,
  )
}

export function useNoteSound() {
  return { preloadSound, unlockAudio, playNote, playChord }
}
