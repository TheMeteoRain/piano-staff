// Regenerates public/NOTICE.md — the third-party open-source attribution table
// served by the app. Run via `pnpm notice` whenever dependencies change; CI
// fails if it's out of date. Lists direct dependencies only (depth 0) and
// excludes the app itself (a NOTICE attributes others, not you).
import { init } from 'license-checker-rseidelsohn'
import { readFileSync, writeFileSync } from 'node:fs'

const selfName = JSON.parse(readFileSync('package.json', 'utf8')).name

init({ start: process.cwd(), direct: 0 }, (err, packages) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  const rows = Object.entries(packages)
    .map(([key, info]) => {
      const at = key.lastIndexOf('@') // handles scoped names like @vue/tsconfig
      return {
        name: key.slice(0, at),
        version: key.slice(at + 1),
        license: Array.isArray(info.licenses)
          ? info.licenses.join(', ')
          : info.licenses || 'UNKNOWN',
        repository: info.repository || '',
      }
    })
    .filter((r) => r.name !== selfName) // the app doesn't attribute itself
    .sort((a, b) => a.name.localeCompare(b.name))

  const out =
    'This application makes use of the following open source packages:\n\n' +
    '| Library | Version | License | Repository |\n' +
    '|---|---|---|---|\n' +
    rows
      .map((r) => `| ${r.name} | ${r.version} | ${r.license} | ${r.repository} |`)
      .join('\n') +
    '\n'

  writeFileSync('public/NOTICE.md', out)
  console.log(`Wrote public/NOTICE.md (${rows.length} packages)`)
})
