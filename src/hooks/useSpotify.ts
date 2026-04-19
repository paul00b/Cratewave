import { useCallback, useEffect } from 'react'
import { useAppStore } from '../store'
import { exchangeCode, refreshAccessToken } from '../services/spotify'

/**
 * Handles the OAuth callback and token refresh lifecycle.
 * Call once at app root level.
 */
export function useSpotifyAuth() {
  const { spotifyTokens, setSpotifyTokens } = useAppStore()

  // Handle OAuth redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    // Clean the URL
    window.history.replaceState({}, '', '/')

    exchangeCode(code)
      .then(setSpotifyTokens)
      .catch(console.error)
  }, [setSpotifyTokens])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!spotifyTokens) return

    const msUntilExpiry = spotifyTokens.expires_at - Date.now()
    // Refresh 60s before expiry
    const timeout = Math.max(msUntilExpiry - 60_000, 0)

    const timer = setTimeout(() => {
      refreshAccessToken(spotifyTokens.refresh_token)
        .then(setSpotifyTokens)
        .catch(() => setSpotifyTokens(null))
    }, timeout)

    return () => clearTimeout(timer)
  }, [spotifyTokens, setSpotifyTokens])

  const getToken = useCallback((): string | null => {
    if (!spotifyTokens) return null
    if (Date.now() >= spotifyTokens.expires_at) return null
    return spotifyTokens.access_token
  }, [spotifyTokens])

  const isAuthenticated = spotifyTokens !== null && Date.now() < spotifyTokens.expires_at
  const logout = useCallback(() => setSpotifyTokens(null), [setSpotifyTokens])

  return { isAuthenticated, getToken, logout }
}
