import { useCallback, useEffect } from 'react'
import { useAppStore } from '../store'
import { exchangeCode, refreshAccessToken, getCurrentUser } from '../services/spotify'
import {
  loadSpotifyConnection,
  saveSpotifyConnection,
  deleteSpotifyConnection,
} from '../services/spotifyConnection'
import { useAuth } from './useAuth'

/**
 * Handles Spotify OAuth callback, token refresh, and Supabase sync.
 * Spotify tokens live in the Supabase `spotify_connections` table (RLS by user_id).
 * Call once at app root level.
 */
export function useSpotifyAuth() {
  const { user } = useAuth()
  const { spotifyTokens, setSpotifyTokens } = useAppStore()

  // Load existing Spotify connection from Supabase once user is known
  useEffect(() => {
    if (!user) {
      setSpotifyTokens(null)
      return
    }
    let cancelled = false
    loadSpotifyConnection(user.uid)
      .then((conn) => {
        if (cancelled || !conn) return
        setSpotifyTokens({
          access_token: conn.access_token,
          refresh_token: conn.refresh_token,
          expires_at: conn.expires_at,
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user, setSpotifyTokens])

  // Handle OAuth redirect callback
  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    window.history.replaceState({}, '', '/')

    exchangeCode(code)
      .then(async (tokens) => {
        setSpotifyTokens(tokens)
        // fetch profile to cache display_name/avatar/premium
        try {
          const profile = await getCurrentUser(tokens.access_token)
          await saveSpotifyConnection(user.uid, tokens, {
            spotify_user_id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.images?.[0]?.url ?? null,
            is_premium: (profile as unknown as { product?: string }).product === 'premium',
          })
        } catch {
          await saveSpotifyConnection(user.uid, tokens)
        }
      })
      .catch(console.error)
  }, [user, setSpotifyTokens])

  // Auto-refresh token before expiry + persist refreshed tokens
  useEffect(() => {
    if (!spotifyTokens || !user) return

    const msUntilExpiry = spotifyTokens.expires_at - Date.now()
    const timeout = Math.max(msUntilExpiry - 60_000, 0)

    const timer = setTimeout(() => {
      refreshAccessToken(spotifyTokens.refresh_token)
        .then(async (fresh) => {
          setSpotifyTokens(fresh)
          await saveSpotifyConnection(user.uid, fresh)
        })
        .catch(() => setSpotifyTokens(null))
    }, timeout)

    return () => clearTimeout(timer)
  }, [spotifyTokens, user, setSpotifyTokens])

  const getToken = useCallback((): string | null => {
    if (!spotifyTokens) return null
    if (Date.now() >= spotifyTokens.expires_at) return null
    return spotifyTokens.access_token
  }, [spotifyTokens])

  const isAuthenticated = spotifyTokens !== null && Date.now() < spotifyTokens.expires_at

  const logout = useCallback(async () => {
    if (user) await deleteSpotifyConnection(user.uid)
    setSpotifyTokens(null)
  }, [setSpotifyTokens, user])

  return { isAuthenticated, getToken, logout }
}
