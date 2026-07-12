/**
 * Major key signatures, ordered around the circle of fifths (C at 0, sharps
 * clockwise, flats counter-clockwise). Shared data for the key-signature
 * exercise (and, later, a circle-of-fifths view).
 */
export type MajorKey = {
  /** display name, e.g. "B♭" */
  name: string
  /** VexFlow key-signature spec, e.g. "Bb" (also the tonic letter) */
  spec: string
  /** tonic pitch to play on reveal, within the sampler range */
  tonic: string
  /** signed accidental count: +sharps, -flats */
  accidentals: number
}

// index order = circle of fifths going sharp, then the flats
export const MAJOR_KEYS: MajorKey[] = [
  { name: 'C', spec: 'C', tonic: 'C4', accidentals: 0 },
  { name: 'G', spec: 'G', tonic: 'G4', accidentals: 1 },
  { name: 'D', spec: 'D', tonic: 'D4', accidentals: 2 },
  { name: 'A', spec: 'A', tonic: 'A4', accidentals: 3 },
  { name: 'E', spec: 'E', tonic: 'E4', accidentals: 4 },
  { name: 'B', spec: 'B', tonic: 'B4', accidentals: 5 },
  { name: 'F♯', spec: 'F#', tonic: 'F#4', accidentals: 6 },
  { name: 'C♯', spec: 'C#', tonic: 'C#4', accidentals: 7 },
  { name: 'F', spec: 'F', tonic: 'F4', accidentals: -1 },
  { name: 'B♭', spec: 'Bb', tonic: 'Bb4', accidentals: -2 },
  { name: 'E♭', spec: 'Eb', tonic: 'Eb4', accidentals: -3 },
  { name: 'A♭', spec: 'Ab', tonic: 'Ab4', accidentals: -4 },
  { name: 'D♭', spec: 'Db', tonic: 'Db4', accidentals: -5 },
  { name: 'G♭', spec: 'Gb', tonic: 'Gb4', accidentals: -6 },
  { name: 'C♭', spec: 'Cb', tonic: 'Cb4', accidentals: -7 },
]

/** Keys ordered by accidental count, easiest (fewest) first. */
export const MAJOR_KEYS_BY_DIFFICULTY = [...MAJOR_KEYS].sort(
  (a, b) => Math.abs(a.accidentals) - Math.abs(b.accidentals),
)

export type KeyMode = 'flat' | 'sharp' | 'mixed'

/** The keys practised in a given mode. C (no accidentals) only appears in mixed. */
export function keysFor(mode: KeyMode): MajorKey[] {
  if (mode === 'sharp') return MAJOR_KEYS.filter((k) => k.accidentals > 0)
  if (mode === 'flat') return MAJOR_KEYS.filter((k) => k.accidentals < 0)
  return MAJOR_KEYS
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Build an answer set for a prompt: the correct key plus `distractorCount`
 * plausible wrong answers, biased toward keys with a nearby accidental count
 * (so choices actually teach), then shuffled.
 */
export function buildChoices(
  answer: MajorKey,
  pool: MajorKey[] = MAJOR_KEYS,
  distractorCount = 3,
  rng: () => number = Math.random,
): MajorKey[] {
  const others = pool
    .filter((k) => k.spec !== answer.spec)
    .sort(
      (a, b) =>
        Math.abs(a.accidentals - answer.accidentals) -
        Math.abs(b.accidentals - answer.accidentals),
    )
  // take from the nearest ~6, pick distractorCount at random for variety
  const nearby = others.slice(0, Math.max(distractorCount + 3, 6))
  const distractors = shuffle(nearby, rng).slice(0, distractorCount)
  return shuffle([answer, ...distractors], rng)
}
