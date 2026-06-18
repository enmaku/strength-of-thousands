import { describe, expect, it } from 'vitest'
import { diffToHtml, escapeHtml } from './transcriptDiff.js'

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml('<b>"A & B"</b>')).toBe('&lt;b&gt;&quot;A &amp; B&quot;&lt;/b&gt;')
  })
})

describe('diffToHtml', () => {
  it('returns escaped text when strings match', () => {
    expect(diffToHtml('hello world', 'hello world')).toBe('hello world')
  })

  it('highlights removed words in red', () => {
    expect(diffToHtml('hello world', 'hello')).toContain('transcript-diff--removed')
    expect(diffToHtml('hello world', 'hello')).toContain('world')
  })

  it('highlights added words in green', () => {
    expect(diffToHtml('hello', 'hello world')).toContain('transcript-diff--added')
    expect(diffToHtml('hello', 'hello world')).toContain('world')
  })

  it('highlights changed words in yellow and green', () => {
    const html = diffToHtml('meet Alicia', 'meet Aliciet')
    expect(html).toContain('transcript-diff--changed')
    expect(html).toContain('transcript-diff--added')
    expect(html).toContain('Alicia')
    expect(html).toContain('Aliciet')
  })
})
