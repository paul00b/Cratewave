import type {
  SpotifyTokens,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyPlaylist,
  TimeRange,
} from '../types'

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API = 'https://api.spotify.com/v1'

const getClientId = () =>
  (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined) ?? ''
const getRedirectUri = () => `${window.location.origin}/`

const SCOPES = [
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

// PKCE helpers

function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Auth flow

export async function startSpotifyAuth(): Promise<void> {
  const verifier = generateRandomString(64)
  const challenge = await generateCodeChallenge(verifier)
  localStorage.setItem('cratewave_pkce_verifier', verifier)

  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    show_dialog: 'true',
  })

  window.location.href = `${SPOTIFY_AUTH_URL}?${params}`
}

export async function exchangeCode(code: string): Promise<SpotifyTokens> {
  const verifier = localStorage.getItem('cratewave_pkce_verifier') ?? ''
  localStorage.removeItem('cratewave_pkce_verifier')

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: verifier,
    }),
  })

  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

// API helpers

async function spotifyFetch<T>(endpoint: string, token: string, retry = 1): Promise<T> {
  const res = await fetch(`${SPOTIFY_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 429 && retry > 0) {
    const retryAfter = Math.min(Number(res.headers.get('Retry-After') ?? 2), 10)
    await new Promise((r) => setTimeout(r, retryAfter * 1000))
    return spotifyFetch<T>(endpoint, token, retry - 1)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Spotify ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`)
  }
  return res.json() as Promise<T>
}

// Data fetchers

export function getTopArtists(token: string, timeRange: TimeRange, limit = 20) {
  return spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    token,
  ).then((r) => r.items)
}

export function getTopTracks(token: string, timeRange: TimeRange, limit = 20) {
  return spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    token,
  ).then((r) => r.items)
}

export function getRecentlyPlayed(token: string, limit = 50) {
  return spotifyFetch<{ items: { track: SpotifyTrack; played_at: string }[] }>(
    `/me/player/recently-played?limit=${limit}`,
    token,
  ).then((r) => r.items)
}

export function getUserPlaylists(token: string, limit = 50) {
  return spotifyFetch<{ items: SpotifyPlaylist[] }>(
    `/me/playlists?limit=${limit}`,
    token,
  ).then((r) => r.items)
}

export async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  trackUris: string[],
): Promise<SpotifyPlaylist> {
  const res = await fetch(`${SPOTIFY_API}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, public: false }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[Spotify] createPlaylist failed', res.status, body)
    throw new Error(`Spotify ${res.status}: ${body || res.statusText}`)
  }
  const playlist = (await res.json()) as SpotifyPlaylist

  const addRes = await fetch(`${SPOTIFY_API}/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: trackUris }),
  })
  if (!addRes.ok) {
    const body = await addRes.text().catch(() => '')
    console.error('[Spotify] add tracks failed', addRes.status, body)
  }

  return playlist
}

export function searchTracks(token: string, query: string, limit = 5) {
  return spotifyFetch<{ tracks: { items: SpotifyTrack[] } }>(
    `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    token,
  ).then((r) => r.tracks.items)
}

export function searchArtist(token: string, name: string) {
  return spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
    `/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
    token,
  ).then((r) => r.artists.items[0] ?? null)
}


export function getCurrentUser(token: string) {
  return spotifyFetch<{ id: string; display_name: string; images: { url: string }[] }>(
    '/me',
    token,
  )
}
