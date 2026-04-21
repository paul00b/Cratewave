// Spotify types

export interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: SpotifyImage[]
  popularity: number
  external_urls: { spotify: string }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Pick<SpotifyArtist, 'id' | 'name'>[]
  album: {
    id: string
    name: string
    images: SpotifyImage[]
  }
  duration_ms: number
  preview_url: string | null
  external_urls: { spotify: string }
}

export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyPlaylist {
  id: string
  name: string
  images: SpotifyImage[]
  tracks: { total: number }
  external_urls: { spotify: string }
}

// Time range for Spotify top items
export type TimeRange = 'short_term' | 'medium_term' | 'long_term'

// Mood options for recommendations
export type Mood =
  | 'focus'
  | 'energy'
  | 'melancholy'
  | 'party'
  | 'chill'
  | 'introspection'

// Discovery slider mode
export type DiscoveryMode = 'close' | 'far'

// Last.fm types

export interface LastFmArtist {
  name: string
  mbid?: string
  url: string
  image?: { '#text': string; size: string }[]
  match?: string
}

export interface LastFmTag {
  name: string
  count: number
}

// Gemini types

export interface GeminiRecommendation {
  artist: string
  track: string
  reason: string
  genres: string[]
}

// Unified recommendation returned by the pipeline
export interface Recommendation {
  artist: {
    id?: string
    name: string
    image?: string
    spotifyUrl?: string
  }
  tracks: SpotifyTrack[]
  reason: string
  tags: string[]
  // Score & source kept for transparency / debugging
  score?: number
  source: 'close' | 'far'
}

// App settings stored in localStorage
export interface AppSettings {
  geminiApiKey: string
}
