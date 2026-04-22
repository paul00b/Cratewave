// Minimal subset of the Spotify Web Playback SDK types we use.
export {}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: typeof Spotify
  }

  namespace Spotify {
    interface PlayerInit {
      name: string
      getOAuthToken: (cb: (token: string) => void) => void
      volume?: number
    }

    interface TrackArtist { name: string; uri: string }
    interface TrackAlbum {
      name: string
      uri: string
      images: { url: string; height: number; width: number }[]
    }
    interface Track {
      id: string
      uri: string
      name: string
      duration_ms: number
      artists: TrackArtist[]
      album: TrackAlbum
    }

    interface PlaybackState {
      paused: boolean
      position: number
      duration: number
      track_window: {
        current_track: Track
        previous_tracks: Track[]
        next_tracks: Track[]
      }
    }

    type ReadyEvent = { device_id: string }

    class Player {
      constructor(options: PlayerInit)
      connect(): Promise<boolean>
      disconnect(): void
      addListener(event: 'ready', cb: (e: ReadyEvent) => void): boolean
      addListener(event: 'not_ready', cb: (e: ReadyEvent) => void): boolean
      addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): boolean
      addListener(event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error', cb: (e: { message: string }) => void): boolean
      removeListener(event: string): void
      togglePlay(): Promise<void>
      pause(): Promise<void>
      resume(): Promise<void>
      nextTrack(): Promise<void>
      previousTrack(): Promise<void>
      seek(position_ms: number): Promise<void>
      setVolume(volume: number): Promise<void>
      getCurrentState(): Promise<PlaybackState | null>
    }
  }
}
