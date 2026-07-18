// Scale intervals and the standard one-octave piano fingerings.
//
// Fingerings are key-specific (thumbs land on different scale degrees per key),
// so they are stored explicitly per root — never derived. Each array is 8
// fingers, one per note, ascending: index 0 = tonic ... index 7 = octave.
// 1 = thumb ... 5 = pinky. Both `rh` and `lh` are ordered tonic-first (lowest
// note first) so they align with the ascending note list — e.g. C-major `lh`
// [5,4,3,2,1,3,2,1] means pinky on the bottom C, thumb on the top C.
//
// Cross-checked against LearnMusicTheory.net's method sheet, pianoscales.org,
// and piano-keyboard-guide.com; standard Alfred/ABRSM/Hanon fingerings. The
// same fingering serves the natural/harmonic/melodic forms of a minor, per
// convention. Enharmonic minor roots (D#, A#) use their conventional flat
// spelling's fingering (Eb minor, Bb minor) — physically identical keys.

export type ScaleType = 'major' | 'minor'

/** semitones from the root, including the octave */
export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12], // natural minor
}

type Fingering = { rh: number[]; lh: number[] }

// keyed by pitch class (0 = C ... 11 = B)
export const SCALE_FINGERINGS: Record<ScaleType, Record<number, Fingering>> = {
  major: {
    0: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // C
    7: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // G
    2: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // D
    9: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // A
    4: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // E
    11: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] }, // B
    6: { rh: [2, 3, 4, 1, 2, 3, 1, 2], lh: [4, 3, 2, 1, 3, 2, 1, 4] }, // F#/Gb
    1: { rh: [2, 3, 1, 2, 3, 4, 1, 2], lh: [3, 2, 1, 4, 3, 2, 1, 3] }, // Db/C#
    8: { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] }, // Ab/G#
    3: { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] }, // Eb/D#
    10: { rh: [2, 1, 2, 3, 1, 2, 3, 4], lh: [3, 2, 1, 4, 3, 2, 1, 3] }, // Bb/A#
    5: { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // F
  },
  minor: {
    9: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // A
    4: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // E
    11: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] }, // B
    6: { rh: [2, 3, 1, 2, 3, 1, 2, 3], lh: [4, 3, 2, 1, 3, 2, 1, 4] }, // F#
    1: { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] }, // C#
    8: { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 3, 2, 1, 4, 3] }, // G#
    3: { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [2, 1, 4, 3, 2, 1, 3, 2] }, // D#/Eb
    10: { rh: [2, 1, 2, 3, 1, 2, 3, 4], lh: [2, 1, 3, 2, 1, 4, 3, 2] }, // A#/Bb
    5: { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // F
    0: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // C
    7: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // G
    2: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] }, // D
  },
}
