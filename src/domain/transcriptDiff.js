import { diffWordsWithSpace } from 'diff'

export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrap(className, value) {
  return `<span class="transcript-diff ${className}">${escapeHtml(value)}</span>`
}

function mergeChangePairs(parts) {
  const merged = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const next = parts[i + 1]
    if (part.removed && next?.added) {
      merged.push({ changed: true, oldValue: part.value, newValue: next.value })
      i++
    } else {
      merged.push(part)
    }
  }
  return merged
}

export function diffToHtml(original, edited) {
  if (!original && !edited) return ''
  if (original === edited) return escapeHtml(original ?? '')

  const parts = mergeChangePairs(diffWordsWithSpace(original ?? '', edited ?? ''))
  let html = ''

  for (const part of parts) {
    if (part.changed) {
      html += wrap('transcript-diff--changed', part.oldValue)
      html += wrap('transcript-diff--added', part.newValue)
    } else if (part.added) {
      html += wrap('transcript-diff--added', part.value)
    } else if (part.removed) {
      html += wrap('transcript-diff--removed', part.value)
    } else {
      html += escapeHtml(part.value)
    }
  }

  return html
}
