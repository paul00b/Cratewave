import { create } from 'zustand'
import type {
  SpotifyTokens,
  SpotifyArtist,
  SpotifyTrack,
  TimeRange,
  Mood,
  DiscoveryMode,
  AppSettings,
} from '../types'

interface AppState {
  // Auth
  spotifyTokens: SpotifyTokens | null
  setSpotifyTokens: (tokens: SpotifyTokens | null) => void

  // Settings
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void

  // Stats
  timeRange: TimeRange
  setTimeRange: (range: TimeRange) => void

  // Discovery
  mood: Mood
  setMood: (mood: Mood) => void
  discoveryMode: DiscoveryMode
  setDiscoveryMode: (mode: DiscoveryMode) => void

  // Selected tracks for playlist creation
  selectedTracks: SpotifyTrack[]
  toggleTrack: (track: SpotifyTrack) => void
  clearSelectedTracks: () => void

  // Top artists cache (used by discovery)
  topArtists: SpotifyArtist[]
  setTopArtists: (artists: SpotifyArtist[]) => void
}

const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem('cratewave_settings')
    if (raw) return JSON.parse(raw) as AppSettings
  } catch { /* ignore */ }
  return { geminiApiKey: '', lastfmApiKey: '' }
}

const loadTokens = (): SpotifyTokens | null => {
  try {
    const raw = localStorage.getItem('cratewave_spotify_tokens')
    if (raw) return JSON.parse(raw) as SpotifyTokens
  } catch { /* ignore */ }
  return null
}

export const useAppStore = create<AppState>()((set) => ({
  spotifyTokens: loadTokens(),
  setSpotifyTokens: (tokens) => {
    if (tokens) {
      localStorage.setItem('cratewave_spotify_tokens', JSON.stringify(tokens))
    } else {
      localStorage.removeItem('cratewave_spotify_tokens')
    }
    set({ spotifyTokens: tokens })
  },

  settings: loadSettings(),
  updateSettings: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch }
      localStorage.setItem('cratewave_settings', JSON.stringify(next))
      return { settings: next }
    }),

  timeRange: 'medium_term',
  setTimeRange: (timeRange) => set({ timeRange }),

  mood: 'energy',
  setMood: (mood) => set({ mood }),

  discoveryMode: 'close',
  setDiscoveryMode: (discoveryMode) => set({ discoveryMode }),

  selectedTracks: [],
  toggleTrack: (track) =>
    set((state) => {
      const exists = state.selectedTracks.some((t) => t.id === track.id)
      return {
        selectedTracks: exists
          ? state.selectedTracks.filter((t) => t.id !== track.id)
          : [...state.selectedTracks, track],
      }
    }),
  clearSelectedTracks: () => set({ selectedTracks: [] }),

  topArtists: [],
  setTopArtists: (topArtists) => set({ topArtists }),
}))
