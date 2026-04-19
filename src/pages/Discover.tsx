import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpotifyAuth } from '../hooks/useSpotify'
import { useAppStore } from '../store'
import { getTopArtists, createPlaylist, getCurrentUser } from '../services/spotify'
import { getSimilarArtists } from '../services/lastfm'
import { getDeepRecommendations } from '../services/gemini'
import type { LastFmArtist, GeminiRecommendation } from '../types'
import AuthPrompt from '../components/ui/AuthPrompt'
import MoodSelector from '../components/ui/MoodSelector'
import ModeSlider from '../components/ui/ModeSlider'
import GlassCard from '../components/ui/GlassCard'
import DiscoveryCard from '../components/ui/DiscoveryCard'
import { SkeletonList } from '../components/ui/Skeleton'

type DiscoveryResult =
  | { type: 'lastfm'; artists: LastFmArtist[] }
  | { type: 'gemini'; recommendations: GeminiRecommendation[] }

export default function Discover() {
  const { isAuthenticated, getToken } = useSpotifyAuth()
  const settings = useAppStore((s) => s.settings)
  const mood = useAppStore((s) => s.mood)
  const discoveryMode = useAppStore((s) => s.discoveryMode)
  const topArtists = useAppStore((s) => s.topArtists)
  const setTopArtists = useAppStore((s) => s.setTopArtists)
  const selectedTracks = useAppStore((s) => s.selectedTracks)
  const clearSelectedTracks = useAppStore((s) => s.clearSelectedTracks)

  const [results, setResults] = useState<DiscoveryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)

  if (!isAuthenticated) return <AuthPrompt />

  const missingKey =
    discoveryMode === 'close'
      ? !settings.lastfmApiKey
      : !settings.geminiApiKey

  const handleSearch = async () => {
    const token = getToken()
    if (!token) return

    setLoading(true)
    setError(null)
    setResults(null)
    setPlaylistUrl(null)
    clearSelectedTracks()

    try {
      // Ensure topArtists is populated
      let artists = topArtists
      if (artists.length === 0) {
        artists = await getTopArtists(token, 'medium_term', 20)
        setTopArtists(artists)
      }

      if (discoveryMode === 'close') {
        // Last.fm: get similar artists for top 5
        const topNames = artists.slice(0, 5).map((a) => a.name)
        const allSimilar = await Promise.all(
          topNames.map((name) =>
            getSimilarArtists(name, 8).catch(() => [] as LastFmArtist[]),
          ),
        )
        // Flatten, deduplicate, filter out known artists
        const knownNames = new Set(artists.map((a) => a.name.toLowerCase()))
        const seen = new Set<string>()
        const unique: LastFmArtist[] = []
        for (const list of allSimilar) {
          for (const artist of list) {
            const key = artist.name.toLowerCase()
            if (!seen.has(key) && !knownNames.has(key)) {
              seen.add(key)
              unique.push(artist)
            }
          }
        }
        setResults({ type: 'lastfm', artists: unique })
      } else {
        // Gemini: deep recommendations
        const recs = await getDeepRecommendations(artists, mood, 15)
        setResults({ type: 'gemini', recommendations: recs })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    const token = getToken()
    if (!token || selectedTracks.length === 0) return

    setCreatingPlaylist(true)
    try {
      const user = await getCurrentUser(token)
      const moodLabels: Record<string, string> = {
        focus: 'Focus',
        energy: 'Énergie',
        melancholy: 'Mélancolie',
        party: 'Fête',
        chill: 'Chill',
        introspection: 'Introspection',
      }
      const date = new Date().toLocaleDateString('fr-FR')
      const name = `Cratewave — ${moodLabels[mood]} — ${date}`
      const uris = selectedTracks.map((t) => `spotify:track:${t.id}`)
      const playlist = await createPlaylist(token, user.id, name, uris)
      setPlaylistUrl(playlist.external_urls.spotify)
      clearSelectedTracks()
    } catch {
      setError('Impossible de créer la playlist')
    } finally {
      setCreatingPlaylist(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Découvrir</h1>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="mb-2 text-sm font-medium text-text-muted">Mood</h2>
          <MoodSelector />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h2 className="mb-2 text-sm font-medium text-text-muted">Mode</h2>
            <ModeSlider />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || missingKey}
            className="mt-auto rounded-xl bg-violet px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-40"
          >
            {loading ? 'Recherche...' : 'Lancer la recherche'}
          </button>
        </div>
      </div>

      {missingKey && (
        <GlassCard className="text-center">
          <p className="text-sm text-text-muted">
            {discoveryMode === 'close'
              ? 'Clé API Last.fm requise pour le mode Proche.'
              : 'Clé API Gemini requise pour le mode Lointain.'}
          </p>
          <Link
            to="/settings"
            className="mt-2 inline-block text-sm text-violet-light hover:underline"
          >
            Configurer dans les paramètres
          </Link>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="border-rose/20 text-center text-sm text-rose-light">
          {error}
        </GlassCard>
      )}

      {/* Results */}
      {loading && <SkeletonList count={8} className="h-24 w-full" />}

      {results?.type === 'lastfm' && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Artistes similaires ({results.artists.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.artists.map((a) => (
              <DiscoveryCard key={a.name} name={a.name} />
            ))}
          </div>
        </section>
      )}

      {results?.type === 'gemini' && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Recommandations Gemini ({results.recommendations.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.recommendations.map((r) => (
              <DiscoveryCard
                key={r.artist}
                name={r.artist}
                reason={r.reason}
                genres={r.genres}
              />
            ))}
          </div>
        </section>
      )}

      {/* Playlist creation bar */}
      {results && selectedTracks.length > 0 && (
        <div className="glass fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 px-5 py-3">
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

      {/* Playlist success */}
      {playlistUrl && (
        <GlassCard className="text-center">
          <p className="mb-2 text-sm font-medium text-violet-light">
            Playlist créée avec succès !
          </p>
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-muted hover:text-text hover:underline"
          >
            Ouvrir dans Spotify
          </a>
        </GlassCard>
      )}
    </div>
  )
}
