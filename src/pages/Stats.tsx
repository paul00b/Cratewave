import { useState, useEffect } from 'react'
import { useSpotifyAuth } from '../hooks/useSpotify'
import { useAppStore } from '../store'
import {
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed,
  getUserPlaylists,
} from '../services/spotify'
import type { SpotifyTrack, SpotifyPlaylist } from '../types'
import AuthPrompt from '../components/ui/AuthPrompt'
import TimeRangeTabs from '../components/ui/TimeRangeTabs'
import ArtistCard from '../components/ui/ArtistCard'
import TrackCard from '../components/ui/TrackCard'
import GlassCard from '../components/ui/GlassCard'
import { SkeletonList } from '../components/ui/Skeleton'
import {
  formatRelativeTime,
  computeDominantGenres,
} from '../utils/format'

export default function Stats() {
  const { isAuthenticated, getToken } = useSpotifyAuth()
  const timeRange = useAppStore((s) => s.timeRange)
  const setTopArtists = useAppStore((s) => s.setTopArtists)

  // Time-range-dependent data
  const [artists, setArtists] = useState<Awaited<ReturnType<typeof getTopArtists>>>([])
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [loadingArtists, setLoadingArtists] = useState(false)
  const [loadingTracks, setLoadingTracks] = useState(false)

  // One-time data
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [recentlyPlayed, setRecentlyPlayed] = useState<
    { track: SpotifyTrack; played_at: string }[]
  >([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [loadingRecent, setLoadingRecent] = useState(false)

  // Fetch top artists + tracks when timeRange changes
  useEffect(() => {
    const token = getToken()
    if (!token) return

    setLoadingArtists(true)
    setLoadingTracks(true)

    getTopArtists(token, timeRange, 20)
      .then((data) => {
        setArtists(data)
        setTopArtists(data)
      })
      .catch(() => setArtists([]))
      .finally(() => setLoadingArtists(false))

    getTopTracks(token, timeRange, 20)
      .then(setTracks)
      .catch(() => setTracks([]))
      .finally(() => setLoadingTracks(false))
  }, [timeRange, isAuthenticated, getToken, setTopArtists])

  // Fetch playlists + recent history once
  useEffect(() => {
    const token = getToken()
    if (!token) return

    setLoadingPlaylists(true)
    setLoadingRecent(true)

    getUserPlaylists(token)
      .then((data) => setPlaylists(data.sort((a, b) => b.tracks.total - a.tracks.total)))
      .catch(() => setPlaylists([]))
      .finally(() => setLoadingPlaylists(false))

    getRecentlyPlayed(token)
      .then(setRecentlyPlayed)
      .catch(() => setRecentlyPlayed([]))
      .finally(() => setLoadingRecent(false))
  }, [isAuthenticated, getToken])

  if (!isAuthenticated) return <AuthPrompt />

  const genres = computeDominantGenres(artists).slice(0, 12)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Tes stats</h1>
        <TimeRangeTabs />
      </div>

      {/* Top Artists */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Top artistes</h2>
        {loadingArtists ? (
          <SkeletonList count={6} className="h-48 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}
      </section>

      {/* Dominant Genres */}
      {genres.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Genres dominants</h2>
          <GlassCard className="flex flex-wrap gap-2">
            {genres.map(({ genre, count }, i) => (
              <span
                key={genre}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  i < 3
                    ? 'bg-gradient-to-r from-violet/20 to-rose/20 text-violet-light'
                    : 'bg-surface text-text-muted'
                }`}
              >
                {genre}
                <span className="ml-1.5 text-xs opacity-60">{count}</span>
              </span>
            ))}
          </GlassCard>
        </section>
      )}

      {/* Top Tracks */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Top morceaux</h2>
        {loadingTracks ? (
          <SkeletonList count={10} />
        ) : (
          <div className="flex flex-col gap-2">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </section>

      {/* Playlists */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Tes playlists</h2>
        {loadingPlaylists ? (
          <SkeletonList count={5} />
        ) : (
          <div className="flex flex-col gap-2">
            {playlists.slice(0, 15).map((pl) => (
              <a
                key={pl.id}
                href={pl.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="glass flex items-center gap-3 p-3 transition-colors hover:bg-surface"
              >
                {pl.images[0]?.url ? (
                  <img
                    src={pl.images[0].url}
                    alt={pl.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-xs text-text-muted">
                    ♫
                  </div>
                )}
                <span className="flex-1 truncate text-sm font-medium">
                  {pl.name}
                </span>
                <span className="text-xs text-text-muted">
                  {pl.tracks.total} titres
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Recently Played */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Écoutes récentes</h2>
        {loadingRecent ? (
          <SkeletonList count={10} />
        ) : (
          <div className="flex flex-col gap-2">
            {recentlyPlayed.map(({ track, played_at }, i) => (
              <div key={`${track.id}-${i}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <TrackCard track={track} />
                </div>
                <span className="flex-shrink-0 text-xs text-text-muted">
                  {formatRelativeTime(played_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
