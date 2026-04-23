import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpotifyAuth } from '../hooks/useSpotify'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store'
import {
  createPlaylist as createCratewavePlaylist,
  addTrackToPlaylist,
} from '../services/playlists'
import {
  buildListeningProfile,
  getCloseRecommendations,
  getFarRecommendations,
} from '../services/recommendations'
import type { Recommendation } from '../types'
import AuthPrompt from '../components/ui/AuthPrompt'
import MoodSelector from '../components/ui/MoodSelector'
import ModeCards from '../components/ui/ModeCards'
import GlassCard from '../components/ui/GlassCard'
import DiscoveryCard from '../components/ui/DiscoveryCard'
import DiscoveryLoader from '../components/ui/DiscoveryLoader'
import { MOOD_PROFILES } from '../utils/mood'

export default function Discover() {
  const { isAuthenticated, getToken } = useSpotifyAuth()
  const { user } = useAuth()
  const navigate = useNavigate()
  const mood = useAppStore((s) => s.mood)
  const discoveryMode = useAppStore((s) => s.discoveryMode)
  const selectedTracks = useAppStore((s) => s.selectedTracks)
  const addTracks = useAppStore((s) => s.addTracks)
  const clearSelectedTracks = useAppStore((s) => s.clearSelectedTracks)
  const seenArtists = useAppStore((s) => s.seenArtists)
  const markSeen = useAppStore((s) => s.markSeen)
  const resetSeen = useAppStore((s) => s.resetSeen)

  const [results, setResults] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)

  if (!isAuthenticated) return <AuthPrompt />

  const run = async () => {
    const token = getToken()
    if (!token) return

    setLoading(true)
    setError(null)
    setResults([])
    clearSelectedTracks()

    try {
      const profile = await buildListeningProfile(token)
      const seen = new Set(seenArtists)

      const recs =
        discoveryMode === 'close'
          ? await getCloseRecommendations(token, profile, mood, seen, 10)
          : await getFarRecommendations(
              token,
              profile,
              mood,
              seen,
              12,
              Math.floor(Math.random() * 10_000),
            )

      if (recs.length === 0) {
        setError(
          discoveryMode === 'close'
            ? 'Aucune recommandation trouvée. Essaye d’élargir ton écoute puis recommence.'
            : 'Gemini n’a pas renvoyé de résultats exploitables. Réessaye.',
        )
      } else {
        setResults(recs)
        markSeen(recs.map((r) => r.artist.name))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!user || selectedTracks.length === 0) return

    const date = new Date().toLocaleDateString('fr-FR')
    const defaultName = `${MOOD_PROFILES[mood].label} — ${date}`
    const name = window.prompt('Nom de la playlist', defaultName)?.trim()
    if (!name) return

    setCreatingPlaylist(true)
    try {
      const playlist = await createCratewavePlaylist(user.uid, name)
      for (const track of selectedTracks) {
        await addTrackToPlaylist(user.uid, playlist.id, track)
      }
      clearSelectedTracks()
      navigate(`/playlists/${playlist.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de créer la playlist')
    } finally {
      setCreatingPlaylist(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">Découvrir</h1>
          <p className="mt-1 text-xs text-text-muted">
            {seenArtists.length > 0
              ? `${seenArtists.length} artiste${seenArtists.length > 1 ? 's' : ''} déjà exploré${seenArtists.length > 1 ? 's' : ''}`
              : 'Chaque recherche s’ajuste à tes écoutes récentes.'}
          </p>
        </div>
        {seenArtists.length > 0 && (
          <button
            onClick={resetSeen}
            className="text-xs text-text-muted transition-colors hover:text-rose-light"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Step 1 — Mode */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-light">
            1
          </span>
          <h2 className="text-sm font-medium text-text-muted">Choisis ta direction</h2>
        </div>
        <ModeCards />
      </div>

      {/* Step 2 — Mood */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="rounded-full bg-rose/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-light">
            2
          </span>
          <h2 className="text-sm font-medium text-text-muted">Donne le ton</h2>
        </div>
        <MoodSelector />
      </div>

      {/* Step 3 — Launch */}
      <button
        onClick={run}
        disabled={loading}
        className="w-full rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet/20 transition-colors hover:bg-violet-light disabled:opacity-40 sm:mx-auto sm:max-w-sm"
      >
        {loading
          ? 'Recherche…'
          : results.length > 0
            ? 'Régénérer'
            : 'Lancer la recherche'}
      </button>

      {error && (
        <GlassCard className="border-rose/20 text-center text-sm text-rose-light">
          {error}
        </GlassCard>
      )}

      {loading && <DiscoveryLoader mode={discoveryMode} />}

      {results.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold sm:text-xl">
              {discoveryMode === 'close' ? 'Dans ton univers' : 'Au-delà'} ·{' '}
              <span className="text-text-muted">{results.length}</span>
            </h2>
            <button
              onClick={() =>
                addTracks(results.map((r) => r.tracks[0]).filter((t): t is NonNullable<typeof t> => !!t))
              }
              className="rounded-xl border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-violet/40 hover:text-violet-light"
            >
              Tout ajouter
            </button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 sm:[grid-template-columns:repeat(2,minmax(0,1fr))]">
            {results.map((r, i) => (
              <DiscoveryCard
                key={`${r.source}-${r.artist.id ?? r.artist.name}-${i}`}
                rec={r}
              />
            ))}
          </div>
        </section>
      )}

      {/* Playlist creation bar */}
      {results.length > 0 && selectedTracks.length > 0 && (
        <div
          className="glass fixed left-1/2 z-40 flex w-[min(540px,calc(100%-1.5rem))] -translate-x-1/2 items-center justify-between gap-3 px-4 py-3 sm:w-auto sm:justify-start sm:gap-4 sm:px-5"
          style={{ bottom: 'calc(var(--nav-height) + 0.5rem)' }}
        >
          <span className="text-sm font-medium">
            {selectedTracks.length} morceau{selectedTracks.length > 1 ? 'x' : ''}{' '}
            sélectionné{selectedTracks.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleCreatePlaylist}
            disabled={creatingPlaylist}
            className="rounded-xl bg-violet px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-40"
          >
            {creatingPlaylist ? 'Création...' : 'Créer la playlist'}
          </button>
        </div>
      )}

    </div>
  )
}
