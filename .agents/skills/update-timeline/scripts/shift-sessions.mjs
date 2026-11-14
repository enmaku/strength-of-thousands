#!/usr/bin/env node
// Slide every beat from a point in the timeline by whole sessions, keeping display order
// and the s<session>- id prefix in sync. Preview by default; pass --write to save.
//
//   node shift-sessions.mjs --from s9-story-monochrome --delta 1
//   node shift-sessions.mjs --from s9-story-monochrome --delta -1 --write

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return undefined
  const value = args[i + 1]
  return value?.startsWith('--') ? true : value
}
const from = flag('from')
const delta = Number(flag('delta'))
const write = args.includes('--write')

if (!from || !Number.isInteger(delta) || delta === 0) {
  console.error('usage: shift-sessions.mjs --from <beat-id> --delta <±n> [--write]')
  process.exit(1)
}

const beatsPath = path.join(process.cwd(), 'data', 'timeline.json')
const beats = JSON.parse(readFileSync(beatsPath, 'utf8'))

const start = beats.findIndex((beat) => beat.id === from)
if (start === -1) {
  console.error(`no beat with id "${from}"`)
  process.exit(1)
}
if (beats[start].lane === 'book') {
  console.error(`"${from}" is a book header; anchor on its first beat instead`)
  process.exit(1)
}

const tooEarly = beats.slice(start).find((beat) => beat.lane !== 'book' && beat.session + delta < 0)
if (tooEarly) {
  console.error(`"${tooEarly.id}" would move to session ${tooEarly.session + delta}`)
  process.exit(1)
}

const shifted = beats.map((beat, index) => {
  if (index < start || beat.lane === 'book') return beat
  return {
    ...beat,
    session: beat.session + delta,
    id: beat.id.replace(/^s\d+-/, `s${beat.session + delta}-`),
  }
})

const moved = shifted.slice(start).filter((beat) => beat.lane !== 'book')
const lastSession = (rows) => Math.max(...rows.filter((b) => b.lane !== 'book').map((b) => b.session))

// Shifting backwards can push beats past rows that stayed put; a reorder must be an
// explicit file edit, not a side effect of a cascade.
for (let i = 1; i < shifted.length; i++) {
  const previous = shifted[i - 1]
  const current = shifted[i]
  if (previous.lane === 'book' || current.lane === 'book') continue
  if (current.session < previous.session || current.book < previous.book) {
    console.error(
      `shift would reorder the timeline: ${previous.id} (session ${previous.session}) ` +
        `now precedes ${current.id} (session ${current.session})`,
    )
    process.exit(1)
  }
}

// Renaming can collide with a beat that already owns the target id.
const seen = new Set()
for (const beat of shifted) {
  if (seen.has(beat.id)) {
    console.error(`shift would duplicate the id "${beat.id}"`)
    process.exit(1)
  }
  seen.add(beat.id)
}

console.log(`${moved.length} beat(s) from "${from}" moved by ${delta > 0 ? '+' : ''}${delta}`)
console.log(`last session ${lastSession(beats)} → ${lastSession(shifted)}`)
for (const [index, beat] of shifted.slice(start).entries()) {
  if (beat.lane === 'book') continue
  console.log(`  ${beats[start + index].id} → ${beat.id}${beat.revealed ? ' (revealed)' : ''}`)
}

if (!write) {
  console.log('\npreview only — rerun with --write to save')
  process.exit(0)
}

writeFileSync(beatsPath, `${JSON.stringify(shifted, null, 2)}\n`)
console.log(`\nwrote ${beatsPath}`)
