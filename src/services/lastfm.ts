import type { LastFmArtist } from '../types'

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'

function getApiKey(): string {
  const settings = localStorage.getItem('cratewave_settings')
  if (!settings) return ''
  return (JSON.parse(settings) as { lastfmApiKey?: string }).lastfmApiKey ?? ''
}

async function lastfmFetch<T>(params: Record<string, string>): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Last.fm API key not configured')

  const query = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: 'json',
  })

  const res = await fetch(`${LASTFM_API}?${query}`)
  if (!res.ok) throw new Error(`Last.fm API error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getSimilarArtists(
  artist: string,
  limit = 10,
): Promise<LastFmArtist[]> {
  const data = await lastfmFetch<{
    similarartists: { artist: LastFmArtist[] }
  }>({
    method: 'artist.getsimilar',
    artist,
    limit: String(limit),
  })
  return data.similarartists.artist
}
