import { describe, expect, it, vi } from 'vitest'
import { fetchStaticJson, staticJsonUrl, staticUrl } from './staticAssetUrl.js'

describe('staticAssetUrl', () => {
  it('builds a path under the pages base', () => {
    expect(staticUrl('heroes/index.json')).toBe('/heroes/index.json')
  })

  it('appends a cache-bust query for JSON URLs', () => {
    expect(staticJsonUrl('heroes/taraan-skyseeker.json', 123)).toBe(
      '/heroes/taraan-skyseeker.json?v=123',
    )
  })

  it('fetchStaticJson uses no-store', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(Date, 'now').mockReturnValue(999)

    await fetchStaticJson('transcripts/index.json')

    expect(fetchMock).toHaveBeenCalledWith('/transcripts/index.json?v=999', { cache: 'no-store' })
  })
})
