import { describe, expect, it } from 'vitest'
import { isGmMode } from './mode.js'

describe('isGmMode', () => {
  it('returns true for localhost', () => {
    expect(isGmMode('localhost')).toBe(true)
  })

  it('returns true for 127.0.0.1', () => {
    expect(isGmMode('127.0.0.1')).toBe(true)
  })

  it('returns false for GitHub Pages host', () => {
    expect(isGmMode('enmaku.github.io')).toBe(false)
  })
})

describe('isGmMode player preview override', () => {
  it('turns GM mode off with ?gmMode=false on localhost', () => {
    expect(isGmMode('localhost', '?gmMode=false')).toBe(false)
  })

  it('accepts ?gmMode=0', () => {
    expect(isGmMode('localhost', '?gmMode=0')).toBe(false)
  })

  it('ignores the override for other gmMode values', () => {
    expect(isGmMode('localhost', '?gmMode=yes')).toBe(true)
  })

  it('does not let ?gmMode=true force GM mode on a deployed host', () => {
    expect(isGmMode('enmaku.github.io', '?gmMode=true')).toBe(false)
  })

  it('reads the override from the hash route query too', () => {
    expect(isGmMode('localhost', '#/timeline?gmMode=false')).toBe(false)
  })

  it('accepts uppercase values', () => {
    expect(isGmMode('localhost', '?gmMode=FALSE')).toBe(false)
  })

  it('ignores unrelated queries', () => {
    expect(isGmMode('localhost', '?foo=bar')).toBe(true)
  })
})
