import { describe, expect, it } from 'vitest'
import { getPublishedPlayerRules, rulesDocIdFromQuery, rulesPageHref } from './playerRules.js'

const catalog = [{ id: 'academia-downtime' }, { id: 'branch-implements' }]

describe('rulesDocIdFromQuery', () => {
  it('accepts a published handout id', () => {
    expect(rulesDocIdFromQuery('branch-implements', catalog)).toBe('branch-implements')
  })

  it('reads the first value when the query repeats', () => {
    expect(rulesDocIdFromQuery(['academia-downtime', 'branch-implements'], catalog)).toBe(
      'academia-downtime',
    )
  })

  it('rejects an unknown id', () => {
    expect(rulesDocIdFromQuery('session-prep', catalog)).toBe(null)
    expect(rulesDocIdFromQuery('', catalog)).toBe(null)
    expect(rulesDocIdFromQuery(undefined, catalog)).toBe(null)
  })
})

describe('rulesPageHref', () => {
  it('builds a hash-route link for a published handout', () => {
    expect(rulesPageHref('branch-implements', '/')).toBe('/#/rules?doc=branch-implements')
    expect(rulesPageHref('magaambya-branches', '/strength-of-thousands/')).toBe(
      '/strength-of-thousands/#/rules?doc=magaambya-branches',
    )
  })

  it('returns null for an id that is not published', () => {
    expect(rulesPageHref('not-a-handout', '/')).toBe(null)
  })

  it('includes every published id', () => {
    for (const doc of getPublishedPlayerRules()) {
      expect(rulesPageHref(doc.id, '/')).toBe(`/#/rules?doc=${doc.id}`)
    }
  })
})
