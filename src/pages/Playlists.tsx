import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import { useAuth } from '../hooks/useAuth'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import {
  createPlaylist,
  deletePlaylist,
  getPlaylistTracks,
  listPlaylists,
  type Playlist,
} from '../services/playlists'

export default function Playlists() {
  const { user } = useAuth()
  const { ready: playerReady, playUris } = useSpotifyPlayer()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setPlaylists(await listPlaylists(user.uid))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setCreating(true)
    try {
      await createPlaylist(user.uid, name.trim())
      setName('')
      await refresh()
    } finally {
      setCreating(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!user) return
    if (!confirm('Supprimer cette playlist ?')) return
    await deletePlaylist(user.uid, id)
    await refresh()
  }

  const onPlay = async (id: string) => {
    if (!user) return
    setPlayingId(id)
    try {
      const tracks = await getPlaylistTracks(user.uid, id)
      if (tracks.length === 0) return
      await playUris(tracks.map((t) => t.spotify_uri))
    } finally {
      setPlayingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Tes playlists</h1>

      <GlassCard>
        <form onSubmit={onCreate} className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nouvelle playlist…"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-violet/60"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="rounded-xl bg-violet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-50"
          >
            Créer
          </button>
        </form>
      </GlassCard>

      {loading ? (
        <p className="text-sm text-text-muted">Chargement…</p>
      ) : playlists.length === 0 ? (
        <GlassCard>
          <p className="text-center text-sm text-text-muted">
            Aucune playlist pour l'instant. Crée-en une, ou ajoutes-y des titres
            depuis Discover.
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {playlists.map((pl) => (
            <div key={pl.id} className="glass flex items-center gap-3 p-3">
              <Link to={`/playlists/${pl.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{pl.name}</p>
                <p className="text-xs text-text-muted">
                  {pl.track_count ?? 0} titre{(pl.track_count ?? 0) > 1 ? 's' : ''}
                </p>
              </Link>
              <button
                onClick={() => onPlay(pl.id)}
                disabled={!playerReady || (pl.track_count ?? 0) === 0 || playingId === pl.id}
                title={playerReady ? 'Lire' : 'Lecteur indisponible (Premium requis)'}
                className="rounded-full bg-violet p-2 text-white transition-colors hover:bg-violet-light disabled:opacity-40"
                aria-label="Lire"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(pl.id)}
                className="rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-rose/10 hover:text-rose-light"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
