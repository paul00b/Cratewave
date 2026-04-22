import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSpotifyAuth } from './useSpotify'

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js'

interface PlayerContextValue {
  ready: boolean
  deviceId: string | null
  state: Spotify.PlaybackState | null
  error: string | null
  playUris: (uris: string[], startIndex?: number) => Promise<void>
  togglePlay: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

function loadSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Spotify?.Player) return resolve()
    if (document.querySelector(`script[src="${SDK_SRC}"]`)) {
      const prev = window.onSpotifyWebPlaybackSDKReady
      window.onSpotifyWebPlaybackSDKReady = () => {
        prev?.()
        resolve()
      }
      return
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    const script = document.createElement('script')
    script.src = SDK_SRC
    script.async = true
    document.body.appendChild(script)
  })
}

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, getToken } = useSpotifyAuth()
  const [ready, setReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [state, setState] = useState<Spotify.PlaybackState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)

  // Keep a live ref to getToken so the SDK's getOAuthToken always reads the
  // freshest token without needing to re-init the player when it refreshes.
  const getTokenRef = useRef(getToken)
  useEffect(() => { getTokenRef.current = getToken }, [getToken])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    let player: Spotify.Player | null = null

    ;(async () => {
      await loadSdk()
      if (cancelled || !window.Spotify) return

      player = new window.Spotify.Player({
        name: 'Cratewave Web',
        getOAuthToken: (cb) => {
          const token = getTokenRef.current()
          if (token) cb(token)
        },
        volume: 0.6,
      })

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id)
        setReady(true)
      })
      player.addListener('not_ready', () => setReady(false))
      player.addListener('player_state_changed', (s) => setState(s))
      // The SDK's initial `check_scope` call sometimes returns 403 even when
      // the token has `streaming`. We ignore this transient auth error as long
      // as the `ready` event fires with a device_id.
      player.addListener('authentication_error', () => {})
      player.addListener('account_error', () => {
        setError('Spotify Premium requis pour la lecture dans Cratewave.')
      })
      player.addListener('initialization_error', ({ message }) => setError(message))
      player.addListener('playback_error', ({ message }) => setError(message))

      const ok = await player.connect()
      if (!ok) setError('Connexion au lecteur Spotify échouée.')
      playerRef.current = player
    })()

    return () => {
      cancelled = true
      if (player) {
        player.disconnect()
      }
      playerRef.current = null
      setReady(false)
      setDeviceId(null)
      setState(null)
    }
  }, [isAuthenticated])

  // Live-tick position while playing
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!state || state.paused) return
    const i = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [state])

  const liveState = useMemo(() => {
    if (!state || state.paused) return state
    const extra = tick * 1000
    return { ...state, position: Math.min(state.position + extra, state.duration) }
  }, [state, tick])

  const playUris = useCallback(
    async (uris: string[], startIndex = 0) => {
      const token = getToken()
      if (!token || !deviceId || uris.length === 0) return
      setTick(0)

      const doPlay = () =>
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris, offset: { position: startIndex } }),
        })

      let res = await doPlay()

      // If device not yet registered server-side, transfer playback then retry.
      if (res.status === 404) {
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ device_ids: [deviceId], play: false }),
        })
        // Small delay to let Spotify register the transfer.
        await new Promise((r) => setTimeout(r, 500))
        res = await doPlay()
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        if (res.status === 403) {
          setError('Lecture refusée (Spotify Premium requis).')
        } else {
          setError(`Lecture échouée: ${res.status} ${body.slice(0, 120)}`)
        }
      } else {
        setError(null)
      }
    },
    [deviceId, getToken],
  )

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay()
  }, [])
  const next = useCallback(async () => {
    await playerRef.current?.nextTrack()
  }, [])
  const previous = useCallback(async () => {
    await playerRef.current?.previousTrack()
  }, [])
  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(positionMs)
  }, [])

  const value: PlayerContextValue = {
    ready,
    deviceId,
    state: liveState,
    error,
    playUris,
    togglePlay,
    next,
    previous,
    seek,
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function useSpotifyPlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('useSpotifyPlayer must be used inside SpotifyPlayerProvider')
  return ctx
}
