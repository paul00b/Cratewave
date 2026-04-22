import { useEffect, useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import { useSpotifyAuth } from '../hooks/useSpotify'
import { useAuth } from '../hooks/useAuth'
import { startSpotifyAuth, getCurrentUser } from '../services/spotify'

export default function Settings() {
  const { isAuthenticated, getToken, logout } = useSpotifyAuth()
  const { user, signOut } = useAuth()
  const [spotifyProfile, setSpotifyProfile] = useState<{
    display_name: string
    images: { url: string }[]
  } | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setSpotifyProfile(null)
      return
    }
    let cancelled = false
    getCurrentUser(token)
      .then((u) => !cancelled && setSpotifyProfile(u))
      .catch(() => !cancelled && setSpotifyProfile(null))
    return () => { cancelled = true }
  }, [isAuthenticated, getToken])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold">Spotify</h2>

        {isAuthenticated && spotifyProfile ? (
          <div className="flex items-center gap-4">
            {spotifyProfile.images[0]?.url ? (
              <img
                src={spotifyProfile.images[0].url}
                alt={spotifyProfile.display_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet/20 text-lg font-bold text-violet-light">
                {spotifyProfile.display_name[0]}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{spotifyProfile.display_name}</p>
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
          <button
            onClick={() => startSpotifyAuth()}
            className="rounded-xl bg-violet px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-light"
          >
            Se connecter à Spotify
          </button>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="mb-2 text-lg font-semibold">Compte</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">{user?.email}</p>
          <button
            onClick={signOut}
            className="rounded-xl border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-rose/40 hover:text-rose-light"
          >
            Se déconnecter
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-1 text-lg font-semibold">À propos</h2>
        <p className="text-xs leading-relaxed text-text-muted">
          Cratewave utilise Spotify pour ton écoute, Last.fm pour les artistes proches,
          et Gemini pour les recommandations lointaines. Aucune clé n’est demandée — tout
          est configuré côté serveur.
        </p>
      </GlassCard>
    </div>
  )
}
