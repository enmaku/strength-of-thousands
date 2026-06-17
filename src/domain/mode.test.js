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
