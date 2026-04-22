import { create } from 'zustand'
import type {
  SpotifyTokens,
  SpotifyArtist,
  SpotifyTrack,
  TimeRange,
  Mood,
  DiscoveryMode,
} from '../types'

interface AppState {
  // Auth
  spotifyTokens: SpotifyTokens | null
  setSpotifyTokens: (tokens: SpotifyTokens | null) => void

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

  // Seen artist names (lowercase) — exclude from future recommendations
  seenArtists: string[]
  markSeen: (names: string[]) => void
  resetSeen: () => void
}

const SEEN_KEY = 'cratewave_seen_artists'
const loadSeen = (): string[] => {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch { /* ignore */ }
  return []
}

export const useAppStore = create<AppState>()((set) => ({
  spotifyTokens: null,
  setSpotifyTokens: (tokens) => set({ spotifyTokens: tokens }),

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

  seenArtists: loadSeen(),
  markSeen: (names) =>
    set((state) => {
      const lower = names.map((n) => n.toLowerCase())
      const merged = Array.from(new Set([...state.seenArtists, ...lower])).slice(-500)
      localStorage.setItem(SEEN_KEY, JSON.stringify(merged))
      return { seenArtists: merged }
    }),
  resetSeen: () => {
    localStorage.removeItem(SEEN_KEY)
    set({ seenArtists: [] })
  },
}))
