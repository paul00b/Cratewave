import type { LastFmArtist, LastFmTag } from '../types'

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'
const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY as string | undefined

async function lastfmFetch<T>(params: Record<string, string>): Promise<T> {
  if (!LASTFM_API_KEY) throw new Error('Last.fm API key not configured (VITE_LASTFM_API_KEY)')
  const query = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY,
    format: 'json',
  })
  const res = await fetch(`${LASTFM_API}?${query}`)
  if (!res.ok) throw new Error(`Last.fm API error: ${res.status}`)
  return res.json() as Promise<T>
}

// --- Simple localStorage cache (24h TTL) ---

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { value, expires } = JSON.parse(raw) as { value: T; expires: number }
    if (Date.now() > expires) {
      localStorage.removeItem(key)
      return null
    }
    return value
  } catch {
    return null
  }
}

function cacheSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ value, expires: Date.now() + CACHE_TTL_MS }),
    )
  } catch { /* quota — ignore */ }
}

// --- API methods ---

export async function getSimilarArtists(
  artist: string,
  limit = 10,
): Promise<LastFmArtist[]> {
  const cacheKey = `lfm_similar_${artist.toLowerCase()}_${limit}`
  const cached = cacheGet<LastFmArtist[]>(cacheKey)
  if (cached) return cached

  const data = await lastfmFetch<{
    similarartists: { artist: LastFmArtist[] }
  }>({
    method: 'artist.getsimilar',
    artist,
    limit: String(limit),
    autocorrect: '1',
  })
  const result = data.similarartists?.artist ?? []
  cacheSet(cacheKey, result)
  return result
}

export async function getArtistTopTags(artist: string): Promise<LastFmTag[]> {
  const cacheKey = `lfm_tags_${artist.toLowerCase()}`
  const cached = cacheGet<LastFmTag[]>(cacheKey)
  if (cached) return cached

  try {
    const data = await lastfmFetch<{
      toptags?: { tag?: { name: string; count: number }[] }
    }>({
      method: 'artist.gettoptags',
      artist,
      autocorrect: '1',
    })
    const tags = (data.toptags?.tag ?? []).map((t) => ({
      name: t.name,
      count: Number(t.count) || 0,
    }))
    cacheSet(cacheKey, tags)
    return tags
  } catch {
    return []
  }
}
