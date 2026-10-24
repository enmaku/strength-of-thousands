const PLAYER_PREVIEW_VALUES = ['false', '0']

function paramsFor(url) {
  const [, query = ''] = (url ?? '').split('?')
  return new URLSearchParams(query)
}

function isPlayerPreview(search, hash) {
  const params = [paramsFor(search), paramsFor(hash)].find(
    (candidate) => candidate.has('gmMode'),
  )
  return params
    ? PLAYER_PREVIEW_VALUES.includes((params.get('gmMode') ?? '').toLowerCase())
    : false
}

export function isGmMode(hostname, search, hash) {
  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')
  if (host !== 'localhost' && host !== '127.0.0.1') return false

  const inWindow = (value, read) =>
    value ?? (typeof window !== 'undefined' ? read(window.location) : '')

  return !isPlayerPreview(
    inWindow(search, (location) => location.search),
    inWindow(hash, (location) => location.hash),
  )
}
