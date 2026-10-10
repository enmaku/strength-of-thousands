const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

export function staticUrl(path) {
  const base = pagesBase || ''
  return `${base}/${path}`.replace(/\/+/g, '/')
}

export function staticJsonUrl(path, cacheBust = Date.now()) {
  const url = staticUrl(path)
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${cacheBust}`
}

export function fetchStaticJson(path) {
  return fetch(staticJsonUrl(path), { cache: 'no-store' })
}
