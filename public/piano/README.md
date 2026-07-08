# Piano samples

Authentic piano recordings for note playback, self-hosted so the app works
offline (see `src/composables/useNoteSound.ts` and the `m4a` precache glob in
`vite.config.ts`).

These are the **SplendidGrandPiano** samples from
[smplr](https://github.com/danigb/smplr) — specifically the **MF** (mezzo-forte)
velocity layer, which covers velocity 85–100. We only use one velocity layer
because a reading trainer doesn't vary dynamics.

- Source base URL: `https://smpldsnds.github.io/sfzinstruments-splendid-grand-piano/samples`
- Original names use a Yamaha octave convention (middle C = C3); files here are
  renamed to **scientific pitch** (middle C = C4, `#` → `s`), e.g. `Cs2.m4a`.
- Format: `.m4a` (AAC) for broad mobile/Safari support.
- Current range: **C2–B5** (MIDI 36–83), matching the exercise's note range.
  Tone.Sampler pitch-shifts the ~1-semitone gaps between samples.

## Re-downloading / expanding the range

To change the range (or velocity layer), edit the filters below and run it from
the repo root. It reads smplr's own sample list so filenames stay correct.

```js
// download-piano.mjs — run: node download-piano.mjs
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

// smplr's sample manifest lives in its dist bundle. Install it anywhere:
//   pnpm add smplr   (in a scratch dir)   then point SMPLR_DIST at its index.js
const SMPLR_DIST = process.env.SMPLR_DIST || './node_modules/smplr/dist/index.js'

const LAYER = 'MF' // one of: PPP, PP, MP, MF, FF
const MIDI_MIN = 36 // C2
const MIDI_MAX = 83 // B5
const BASE =
  'https://smpldsnds.github.io/sfzinstruments-splendid-grand-piano/samples'
const OUT = 'public/piano'
const SCI = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const src = readFileSync(SMPLR_DIST, 'utf8')
const start = src.indexOf('var LAYERS = [')
const LAYERS = eval(
  src.slice(start + 'var LAYERS = '.length, src.indexOf('];', start) + 2),
)
const layer = LAYERS.find((l) => l.name === LAYER)

mkdirSync(OUT, { recursive: true })
for (const [midi, name] of layer.samples) {
  if (midi < MIDI_MIN || midi > MIDI_MAX) continue
  const sci = SCI[midi % 12] + (Math.floor(midi / 12) - 1) // midi 60 -> C4
  const safe = sci.replace('#', 's')
  const url = `${BASE}/${encodeURIComponent(name)}.m4a`
  execSync(`curl -sf -o '${OUT}/${safe}.m4a' '${url}'`)
  console.log(`${name}  ->  ${safe}.m4a`)
}
```

After changing the files, update the `SAMPLES` map in
`src/composables/useNoteSound.ts` to match (key = scientific note name, value =
filename). The keys are what Tone.Sampler maps notes to.
