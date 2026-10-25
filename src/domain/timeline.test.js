import { describe, expect, it } from 'vitest'
import {
  STORY_COLOR,
  buildTimelineGroups,
  buildTimelineToc,
  heroColor,
  hideFrom,
  revealTo,
  visibleBeats,
} from './timeline.js'

const beat = (overrides) => ({
  id: 'x',
  book: 1,
  session: 1,
  lane: 'story',
  title: 'Title',
  description: '',
  revealed: false,
  ...overrides,
})

const story = (id, session, revealed, extra = {}) =>
  beat({ id, session, lane: 'story', revealed, title: id, ...extra })

const player = (id, session, heroSlug, revealed) =>
  beat({ id, session, lane: 'player', heroSlug, revealed, title: id })

const bookHeader = (book, revealed) =>
  beat({ id: `book-${book}`, book, session: null, lane: 'book', revealed, title: `Book ${book}` })

describe('buildTimelineGroups', () => {
  it('returns no groups for an empty timeline', () => {
    expect(buildTimelineGroups([], { gmMode: false })).toEqual([])
  })

  it('drops hidden beats in player mode and keeps them in GM mode', () => {
    const beats = [story('a', 1, true), story('b', 1, false)]

    const playerGroups = buildTimelineGroups(beats, { gmMode: false })
    expect(playerGroups).toHaveLength(1)
    expect(playerGroups[0].type).toBe('session')
    expect(playerGroups[0].beats.map((entry) => entry.id)).toEqual(['a'])

    const gmGroups = buildTimelineGroups(beats, { gmMode: true })
    expect(gmGroups[0].beats.map((entry) => entry.id)).toEqual(['a', 'b'])
  })

  it('omits a session group with nothing revealed in player mode', () => {
    const beats = [story('a', 1, true), story('b', 2, false)]

    expect(buildTimelineGroups(beats, { gmMode: false })).toHaveLength(1)
    expect(buildTimelineGroups(beats, { gmMode: false })[0].session).toBe(1)
    expect(buildTimelineGroups(beats, { gmMode: true })).toHaveLength(2)
  })

  it('drops a book header with no revealed beats beneath it in player mode', () => {
    const beats = [bookHeader(1, true), story('a', 1, true), bookHeader(2, true), story('b', 20, false)]

    const playerGroups = buildTimelineGroups(beats, { gmMode: false })
    expect(playerGroups.map((group) => group.type)).toEqual(['book', 'session'])
    expect(playerGroups[0].beat.book).toBe(1)

    const gmGroups = buildTimelineGroups(beats, { gmMode: true })
    expect(gmGroups.map((group) => group.type)).toEqual(['book', 'session', 'book', 'session'])
  })

  it('keeps book headers in array order', () => {
    const beats = [
      bookHeader(1, true),
      story('s1', 1, true),
      bookHeader(2, true),
      story('s20', 20, true),
      bookHeader(3, true),
      story('s36', 36, true),
    ]

    const groups = buildTimelineGroups(beats, { gmMode: false })
    expect(groups.filter((group) => group.type === 'book').map((group) => group.beat.book)).toEqual([
      1, 2, 3,
    ])
  })

  it('groups consecutive beats by session and keeps array order within a group', () => {
    const beats = [
      bookHeader(1, true),
      story('s1-story', 1, true),
      player('s1-b', 1, 'anya', true),
      player('s1-a', 1, 'yggostrus', true),
      story('s2-story', 2, true),
    ]

    const groups = buildTimelineGroups(beats, { gmMode: true })
    expect(groups.map((group) => group.type)).toEqual(['book', 'session', 'session'])
    expect(groups[1].session).toBe(1)
    expect(groups[1].beats.map((entry) => entry.id)).toEqual(['s1-story', 's1-b', 's1-a'])
    expect(groups[2].beats.map((entry) => entry.id)).toEqual(['s2-story'])
  })
})

describe('buildTimelineToc', () => {
  it('lists every header the player timeline shows, in order', () => {
    const beats = [
      bookHeader(1, true),
      story('s1', 1, true),
      story('s2', 2, false),
      bookHeader(2, false),
    ]

    const groups = buildTimelineGroups(beats, { gmMode: false })
    expect(buildTimelineToc(groups, { gmMode: false })).toEqual([
      { anchor: 'timeline-group-0', type: 'book', label: 'Book 1' },
      { anchor: 'timeline-group-1', type: 'session', label: 'Session 1' },
    ])
  })

  it('skips unrevealed headers in GM mode but keeps the timeline anchor index', () => {
    const beats = [bookHeader(1, true), story('s1', 1, false), story('s2', 2, true)]

    const groups = buildTimelineGroups(beats, { gmMode: true })
    expect(buildTimelineToc(groups, { gmMode: true })).toEqual([
      { anchor: 'timeline-group-0', type: 'book', label: 'Book 1' },
      { anchor: 'timeline-group-2', type: 'session', label: 'Session 2' },
    ])
  })

  it('returns nothing when no header is revealed', () => {
    const beats = [bookHeader(1, false), story('s1', 1, false)]

    expect(buildTimelineToc(buildTimelineGroups(beats, { gmMode: true }), { gmMode: true })).toEqual(
      [],
    )
  })
})

describe('revealTo', () => {
  it('reveals the clicked story beat and every earlier story beat', () => {
    const beats = [story('s1', 1, false), story('s2', 2, false), story('s3', 3, false)]

    const result = revealTo(beats, { id: 's2', lane: 'story' })
    expect(result.map((entry) => entry.revealed)).toEqual([true, true, false])
  })

  it('includes revealed book headers in the story lane', () => {
    const beats = [bookHeader(1, false), story('s1', 1, false), story('s2', 2, false)]

    const result = revealTo(beats, { id: 's1', lane: 'story' })
    expect(result.map((entry) => entry.revealed)).toEqual([true, true, false])
  })

  it('never reveals other heroes from a player beat', () => {
    const beats = [
      story('s1', 1, false),
      player('s1-anya', 1, 'anya', false),
      player('s1-yggo', 1, 'yggostrus', false),
      player('s2-anya', 2, 'anya', false),
    ]

    const result = revealTo(beats, { id: 's1-anya', lane: 'player' })
    expect(result.map((entry) => entry.revealed)).toEqual([false, true, false, false])
  })

  it('does not mutate the input array', () => {
    const beats = [story('s1', 1, false), story('s2', 2, false)]

    revealTo(beats, { id: 's2', lane: 'story' })
    expect(beats.map((entry) => entry.revealed)).toEqual([false, false])
  })

  it('returns an unchanged copy when the id is unknown', () => {
    const beats = [story('s1', 1, false)]

    const result = revealTo(beats, { id: 'missing', lane: 'story' })
    expect(result).toEqual(beats)
    expect(result).not.toBe(beats)
  })
})

describe('hideFrom', () => {
  it('hides the clicked story beat and every later story beat', () => {
    const beats = [story('s1', 1, true), story('s2', 2, true), story('s3', 3, true)]

    const result = hideFrom(beats, { id: 's2', lane: 'story' })
    expect(result.map((entry) => entry.revealed)).toEqual([true, false, false])
  })

  it('hides book headers in the story lane', () => {
    const beats = [story('s1', 1, true), story('s2', 2, true), bookHeader(2, true)]

    const result = hideFrom(beats, { id: 's2', lane: 'story' })
    expect(result.map((entry) => entry.revealed)).toEqual([true, false, false])
  })

  it('never hides other heroes or story beats from a player beat', () => {
    const beats = [
      player('s1-anya', 1, 'anya', true),
      player('s1-yggo', 1, 'yggostrus', true),
      story('s1', 1, true),
      player('s2-anya', 2, 'anya', true),
    ]

    const result = hideFrom(beats, { id: 's2-anya', lane: 'player' })
    expect(result.map((entry) => entry.revealed)).toEqual([true, true, true, false])
  })

  it('does not mutate the input array', () => {
    const beats = [story('s1', 1, true)]

    hideFrom(beats, { id: 's1', lane: 'story' })
    expect(beats[0].revealed).toBe(true)
  })
})

describe('visibleBeats', () => {
  it('returns every beat in GM mode and only revealed beats in player mode', () => {
    const beats = [story('a', 1, true), story('b', 2, false)]

    expect(visibleBeats(beats, { gmMode: true })).toHaveLength(2)
    expect(visibleBeats(beats, { gmMode: false }).map((entry) => entry.id)).toEqual(['a'])
  })
})

describe('heroColor', () => {
  const playerMap = {
    players: {
      Dave: { role: 'gm', color: '#000000' },
      Kiri: { character: "Cy'An Copperbottom", heroSlug: 'cy-an-copperbottom', color: '#6A1B9A' },
      Julia: { character: 'Anya', heroSlug: 'anya', color: '#AD1457' },
    },
  }

  it('matches a hero slug to the player colour', () => {
    expect(heroColor('anya', playerMap)).toBe('#AD1457')
    expect(heroColor('cy-an-copperbottom', playerMap)).toBe('#6A1B9A')
  })

  it('falls back for an unknown hero slug', () => {
    expect(heroColor('nobody', playerMap)).toBe(STORY_COLOR)
  })

  it('falls back when no player map is loaded', () => {
    expect(heroColor('anya', null)).toBe(STORY_COLOR)
  })
})

describe('STORY_COLOR', () => {
  it('is the page palette teal', () => {
    expect(STORY_COLOR).toBe('#204050')
  })
})
