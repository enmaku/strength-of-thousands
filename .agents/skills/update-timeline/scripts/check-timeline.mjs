#!/usr/bin/env node
// Structural checks for data/timeline.json. The prose gate (foreshadowing regex)
// lives in src/domain/timelineContent.test.js and runs under `npm test`; this script
// covers the invariants that test does not, and warns on language the test misses.

import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const beatsPath = path.join(root, 'data/timeline.json')
const rosterPath = path.join(root, 'heroes', 'index.json')

const args = process.argv.slice(2)
const sinceIndex = args.indexOf('--since')
const since = sinceIndex === -1 ? undefined : Number(args[sinceIndex + 1])

const beats = JSON.parse(readFileSync(beatsPath, 'utf8'))
const roster = JSON.parse(readFileSync(rosterPath, 'utf8'))
const heroes = new Map(roster.map((hero) => [hero.slug, hero]))

if (since !== undefined && !beats.some((beat) => beat.session === since)) {
  console.error(`no beats for session ${since}`)
  process.exit(1)
}

const errors = []
const warnings = []
const fail = (beat, message) => errors.push(`${beat?.id ?? '(row)'}: ${message}`)
const warn = (beat, message) => warnings.push(`${beat?.id ?? '(row)'}: ${message}`)

const LANES = new Set(['story', 'player', 'book'])
const CONFIDENCE = new Set(['played', 'firm', 'projected', 'optional'])

// Language that tells a reader what a beat leads to. Heuristic — a hit is a prompt
// to reread the sentence, not proof of a spoiler. Only applied to newly revealed prose
// (see inProseScope) and never to book headers, whose descriptions are GM-only.
const FORWARD_REFERENCES = [
  /\bwill\b/i,
  /\bwould\b/i,
  /\bsoon\b/i,
  /\beventually\b/i,
  /\bone day\b/i,
  /\bsomeday\b/i,
  /\byears later\b/i,
  /\bnot yet\b/i,
  /\bin time\b/i,
  /\bdestin/i,
  /\bfate\b/i,
  /\bprophec/i,
  /\bforetold\b/i,
  /\bforeshadow/i,
  /\bfor now\b/i,
  /\bthe truth\b/i,
  /\bin truth\b/i,
  /\bsecretly\b/i,
  /\bsecret\b/i,
  /\bhint/i,
  /\bturns out\b/i,
  /\bthe real\b/i,
  /\bactually\s+\w+s\b/i,
  /\bunwitting/i,
  /\bnobody knows\b/i,
  /\bstill ahead\b/i,
  /\bthis matters\b/i,
  /\bpay(s)? off\b/i,
  /\bpayoff\b/i,
  /\bthe arc\b/i,
  /\bwill matter\b/i,
]

if (!Array.isArray(beats)) {
  console.error('data/timeline.json must be an array')
  process.exit(1)
}

const ids = new Set()
const bookHeaderIndex = new Map()
let lastBook = 0
let lastSession = -1

// Spoiler-language warnings are confined to the scope this run is revealing — by default the
// newest revealed session, or everything from --since when a run catches up several sessions.
// Older revealed rows were vetted when they were revealed and are not re-audited.
const frontierSession = Math.max(
  ...beats.filter((beat) => beat.revealed && beat.lane !== 'book').map((beat) => beat.session),
)
const proseFrom = since ?? frontierSession
const inProseScope = (beat) =>
  beat.revealed && beat.lane !== 'book' && beat.session >= proseFrom

beats.forEach((beat, index) => {
  if (!beat || typeof beat !== 'object') return fail(beat, 'row is not an object')
  if (!beat.id || typeof beat.id !== 'string') return fail(beat, 'missing id')
  if (ids.has(beat.id)) fail(beat, 'duplicate id')
  ids.add(beat.id)

  if (!Number.isInteger(beat.book) || beat.book < 1 || beat.book > 6) {
    fail(beat, `book must be 1–6 (got ${beat.book})`)
  }
  if (!LANES.has(beat.lane)) fail(beat, `unknown lane ${beat.lane}`)
  if (typeof beat.title !== 'string' || !beat.title.trim()) fail(beat, 'missing title')
  if (typeof beat.revealed !== 'boolean') fail(beat, 'revealed must be a boolean')
  if (beat.confidence && !CONFIDENCE.has(beat.confidence)) {
    fail(beat, `unknown confidence ${beat.confidence}`)
  }
  if (beat.revealed && beat.confidence !== 'played') {
    fail(beat, `revealed with confidence "${beat.confidence}" — reveal == played`)
  }
  if (!beat.revealed && beat.confidence === 'played') {
    fail(beat, 'confidence is "played" but the beat is unrevealed')
  }
  if (beat.book < lastBook) fail(beat, 'books must not go backwards in display order')
  lastBook = Math.max(lastBook, beat.book)

  if (beat.lane === 'book') {
    if (beat.session !== null) fail(beat, 'book header must have session null')
    if (beat.heroSlug) fail(beat, 'book header must not carry heroSlug')
    if (bookHeaderIndex.has(beat.book)) fail(beat, `second header for book ${beat.book}`)
    bookHeaderIndex.set(beat.book, index)
    return
  }

  if (!Number.isInteger(beat.session) || beat.session < 0) {
    fail(beat, `session must be a non-negative integer (got ${beat.session})`)
    return
  }
  if (beat.session < lastSession) fail(beat, 'sessions must ascend in display order')
  lastSession = Math.max(lastSession, beat.session)

  const prefix = /^s(\d+)-/.exec(beat.id)
  if (!prefix) warn(beat, 'id has no s<session>- prefix')
  else if (Number(prefix[1]) !== beat.session) {
    fail(beat, `id prefix says session ${prefix[1]} but row says ${beat.session}`)
  }

  if (beat.lane === 'story') {
    if (beat.heroSlug) fail(beat, 'story beat must not carry heroSlug')
  }

  if (beat.lane === 'player') {
    if (!beat.heroSlug) fail(beat, 'player beat needs a heroSlug')
    else if (!heroes.has(beat.heroSlug)) fail(beat, `unknown heroSlug ${beat.heroSlug}`)
    else if (heroes.get(beat.heroSlug).active === false && beat.session >= frontierSession) {
      warn(beat, `hero ${beat.heroSlug} is inactive — no new beats for retired heroes`)
    }
    if (beat.source) warn(beat, 'source refs belong on story beats only')
  }

  if (beat.revealed && !beat.description?.trim()) {
    warn(beat, 'revealed beat has no description')
  }
  if (inProseScope(beat)) {
    const hits = FORWARD_REFERENCES.filter((pattern) =>
      pattern.test(`${beat.title} ${beat.description ?? ''}`),
    )
    if (hits.length) warn(beat, `possible future-facing language (${hits.length} pattern(s))`)
  }
})

// Every book needs a header, and it must sit before that book's first beat.
for (const book of [1, 2, 3, 4, 5, 6]) {
  if (!bookHeaderIndex.has(book)) errors.push(`(rows): book ${book} has no header row`)
}
for (const [book, headerIndex] of bookHeaderIndex) {
  const firstBeat = beats.findIndex((beat) => beat.book === book && beat.lane !== 'book')
  if (firstBeat !== -1 && headerIndex > firstBeat) {
    errors.push(`(rows): book ${book} header comes after its first beat`)
  }
}

// Reveal is a prefix, per scope: story beats share a lane with book headers, and each
// hero's player beats form their own lane. This mirrors scopeFor() in src/domain/timeline.js.
function checkPrefix(scopeLabel, rows) {
  const firstHidden = rows.findIndex((beat) => !beat.revealed)
  if (firstHidden === -1) return
  const leaked = rows.slice(firstHidden).filter((beat) => beat.revealed)
  if (leaked.length) {
    errors.push(
      `(reveal): ${scopeLabel} has a gap — ${leaked.map((beat) => beat.id).join(', ')} revealed after ${rows[firstHidden].id}`,
    )
  }
}

checkPrefix('story', beats.filter((beat) => beat.lane === 'story' || beat.lane === 'book'))
for (const slug of heroes.keys()) {
  checkPrefix(slug, beats.filter((beat) => beat.lane === 'player' && beat.heroSlug === slug))
}

// A played session leaves nothing scheduled behind it. Every row at or before the frontier is
// either revealed as played or moved forward to a later session — including an absent hero's.
for (const beat of beats) {
  if (beat.lane === 'book' || beat.revealed || !Number.isInteger(beat.session)) continue
  if (beat.session <= frontierSession) {
    fail(
      beat,
      `still scheduled for session ${beat.session}, which has been played — reveal it as played or move it forward`,
    )
  }
}

const revealedSessions = beats
  .filter((beat) => beat.revealed && beat.lane !== 'book')
  .map((beat) => beat.session)
const through = revealedSessions.length ? Math.max(...revealedSessions) : null
const byLane = (lane) =>
  beats.filter((beat) => beat.lane === lane && beat.revealed).length

for (const warning of warnings) console.warn(`WARN  ${warning}`)
for (const error of errors) console.error(`FAIL  ${error}`)

console.log(
  `\n${beats.length} beats · revealed through session ${through ?? '—'} · ` +
    `${byLane('story')} story + ${byLane('player')} player revealed · ` +
    `${errors.length} error(s), ${warnings.length} warning(s)`,
)

process.exit(errors.length ? 1 : 0)
