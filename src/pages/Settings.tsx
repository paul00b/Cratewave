import { useState, useEffect } from 'react'
import GlassCard from '../components/ui/GlassCard'
import { useSpotifyAuth } from '../hooks/useSpotify'
import { useAppStore } from '../store'
import { startSpotifyAuth, getCurrentUser } from '../services/spotify'

export default function Settings() {
  const { isAuthenticated, getToken, logout } = useSpotifyAuth()
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

  // Spotify Client ID (stored separately in localStorage, read by the service)
  const [clientId, setClientId] = useState(
    () => localStorage.getItem('cratewave_spotify_client_id') ?? '',
  )
  const [user, setUser] = useState<{
    display_name: string
    images: { url: string }[]
  } | null>(null)

  // API key visibility toggles
  const [showGemini, setShowGemini] = useState(false)
  const [showLastFm, setShowLastFm] = useState(false)

  // Persist client ID on change
  const handleClientIdChange = (value: string) => {
    setClientId(value)
    localStorage.setItem('cratewave_spotify_client_id', value)
  }

  // Fetch user profile when authenticated
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setUser(null)
      return
    }
    getCurrentUser(token).then(setUser).catch(() => setUser(null))
  }, [isAuthenticated, getToken])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      {/* Spotify Connection */}
      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold">Spotify</h2>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-4">
            {user.images[0]?.url ? (
              <img
                src={user.images[0].url}
                alt={user.display_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet/20 text-lg font-bold text-violet-light">
                {user.display_name[0]}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{user.display_name}</p>
              <p className="text-xs text-text-muted">Connecté</p>
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-rose/40 hover:text-rose-light"
            >
              Déconnecter
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => handleClientIdChange(e.target.value)}
                placeholder="Colle ton Spotify Client ID ici"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-violet/50"
              />
            </div>
            <button
              onClick={() => startSpotifyAuth()}
              disabled={!clientId.trim()}
              className="self-start rounded-xl bg-violet px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-40 disabled:hover:bg-violet"
            >
              Se connecter à Spotify
            </button>
          </div>
        )}
      </GlassCard>

      {/* Gemini API Key */}
      <GlassCard>
        <h2 className="mb-1 text-lg font-semibold">Gemini</h2>
        <p className="mb-3 text-xs text-text-muted">
          Clé API Google Gemini pour les recommandations profondes.
        </p>
        <div className="relative">
          <input
            type={showGemini ? 'text' : 'password'}
            value={settings.geminiApiKey}
            onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
            placeholder="Clé API Gemini"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 pr-16 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-violet/50"
          />
          <button
            type="button"
            onClick={() => setShowGemini(!showGemini)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-text-muted hover:text-text"
          >
            {showGemini ? 'Masquer' : 'Voir'}
          </button>
        </div>
      </GlassCard>

      {/* Last.fm API Key */}
      <GlassCard>
        <h2 className="mb-1 text-lg font-semibold">Last.fm</h2>
        <p className="mb-3 text-xs text-text-muted">
          Clé API Last.fm pour les artistes similaires.
        </p>
        <div className="relative">
          <input
            type={showLastFm ? 'text' : 'password'}
            value={settings.lastfmApiKey}
            onChange={(e) => updateSettings({ lastfmApiKey: e.target.value })}
            placeholder="Clé API Last.fm"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 pr-16 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-violet/50"
          />
          <button
            type="button"
            onClick={() => setShowLastFm(!showLastFm)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-text-muted hover:text-text"
          >
            {showLastFm ? 'Masquer' : 'Voir'}
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
