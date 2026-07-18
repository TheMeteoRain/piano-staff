// Regenerates public/NOTICE.md — the open-source dependency attribution table
// served by the app. Run via `pnpm notice`; also run on release so the notice
// stays in sync with the dependency tree.
import { init } from 'license-checker-rseidelsohn'
import { writeFileSync } from 'node:fs'

// direct dependencies only (depth 0), matching the existing NOTICE scope
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
