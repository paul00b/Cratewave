import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import { useAuth } from '../hooks/useAuth'
import { useSpotifyAuth } from '../hooks/useSpotify'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import {
  getPlaylist,
  getPlaylistTracks,
  removeTrackFromPlaylist,
  updatePlaylist,
  type Playlist,
  type PlaylistTrack,
} from '../services/playlists'
import { createPlaylist as createSpotifyPlaylist, getCurrentUser } from '../services/spotify'

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { isAuthenticated: spotifyLinked, getToken } = useSpotifyAuth()
  const { ready: playerReady, playUris } = useSpotifyPlayer()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importUrl, setImportUrl] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const [pl, tks] = await Promise.all([
        getPlaylist(user.uid, id),
        getPlaylistTracks(user.uid, id),
      ])
      setPlaylist(pl)
      setTracks(tks)
      setName(pl?.name ?? '')
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => { refresh() }, [refresh])

  const onRename = async () => {
    if (!id || !user || !name.trim() || !playlist) return
    await updatePlaylist(user.uid, id, { name: name.trim() })
    setRenaming(false)
    await refresh()
  }

  const onRemoveTrack = async (rowId: string) => {
    if (!id || !user) return
    await removeTrackFromPlaylist(user.uid, id, rowId)
    await refresh()
  }

  const onPlayAll = async (startIndex = 0) => {
    if (tracks.length === 0) return
    await playUris(tracks.map((t) => t.spotify_uri), startIndex)
  }

  const onImportToSpotify = async () => {
    const token = getToken()
    if (!token || !playlist || tracks.length === 0) return
    setImporting(true)
    setImportUrl(null)
    try {
      const me = await getCurrentUser(token)
      const created = await createSpotifyPlaylist(
        token,
        me.id,
        playlist.name,
        tracks.map((t) => t.spotify_uri),
      )
      setImportUrl(created.external_urls.spotify)
    } catch (err) {
      console.error(err)
      alert("L'import a échoué. Assure-toi que Spotify est connecté.")
    } finally {
      setImporting(false)
    }
  }

  if (!user) return null
  if (loading) return <p className="text-sm text-text-muted">Chargement…</p>
  if (!playlist)
    return (
      <GlassCard>
        <p className="text-center text-sm text-text-muted">Playlist introuvable.</p>
        <Link to="/playlists" className="mt-3 block text-center text-sm text-violet-light">
          Retour
        </Link>
      </GlassCard>
    )

  return (
    <div className="flex flex-col gap-6">
      <Link to="/playlists" className="text-sm text-text-muted hover:text-text">
        ← Tes playlists
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPlayAll(0)}
          disabled={!playerReady || tracks.length === 0}
          title={playerReady ? 'Lire la playlist' : 'Lecteur indisponible (Premium requis)'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet text-white transition-colors hover:bg-violet-light disabled:opacity-40"
          aria-label="Lire tout"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        {renaming ? (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-lg font-semibold outline-none focus:border-violet/60"
            />
            <button
              onClick={onRename}
              className="rounded-xl bg-violet px-4 py-2 text-sm text-white hover:bg-violet-light"
            >
              OK
            </button>
          </>
        ) : (
          <>
            <h1 className="min-w-0 flex-1 truncate text-2xl font-bold sm:text-3xl">{playlist.name}</h1>
            <button
              onClick={() => setRenaming(true)}
              className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs text-text-muted hover:border-violet/40 hover:text-violet-light"
            >
              Renommer
            </button>
          </>
        )}
      </div>

      <GlassCard>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Importer dans Spotify</p>
          <p className="text-xs text-text-muted">
            Crée une playlist Spotify avec ces {tracks.length} titres.
          </p>
          {!spotifyLinked && (
            <p className="text-xs text-rose-light">
              Connecte Spotify dans <Link to="/settings" className="underline">Paramètres</Link>.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onImportToSpotify}
              disabled={!spotifyLinked || importing || tracks.length === 0}
              className="rounded-xl bg-violet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-50"
            >
              {importing ? 'Import…' : 'Importer dans Spotify'}
            </button>
            {importUrl && (
              <a
                href={importUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-light underline"
              >
                Ouvrir sur Spotify ↗
              </a>
            )}
          </div>
        </div>
      </GlassCard>

      {tracks.length === 0 ? (
        <GlassCard>
          <p className="text-center text-sm text-text-muted">
            Aucun titre. Ajoute-en depuis Discover ou Stats.
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((t, i) => (
            <div key={t.id} className="glass flex items-center gap-3 p-3">
              {t.album_image_url ? (
                <img
                  src={t.album_image_url}
                  alt={t.track_name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-text-muted">
                  ♫
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{t.track_name}</p>
                <p className="truncate text-xs text-text-muted">{t.artist_name}</p>
              </div>
              <button
                onClick={() => onPlayAll(i)}
                disabled={!playerReady}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-violet/10 hover:text-violet-light disabled:opacity-30"
                title="Lire"
                aria-label="Lire"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <a
                href={`https://open.spotify.com/track/${t.spotify_track_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text"
                title="Ouvrir sur Spotify"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </a>
              <button
                onClick={() => onRemoveTrack(t.id)}
                className="rounded-lg px-2 py-1 text-xs text-text-muted transition-colors hover:bg-rose/10 hover:text-rose-light"
                title="Retirer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
