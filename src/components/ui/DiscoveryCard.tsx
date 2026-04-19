import { useState } from 'react'
import type { SpotifyTrack } from '../../types'
import { useAppStore } from '../../store'
import { searchTracks } from '../../services/spotify'
import { useSpotifyAuth } from '../../hooks/useSpotify'
import TrackCard from './TrackCard'

interface Props {
  name: string
  reason?: string
  genres?: string[]
}

export default function DiscoveryCard({ name, reason, genres }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(false)
  const { getToken } = useSpotifyAuth()
  const selectedTracks = useAppStore((s) => s.selectedTracks)
  const toggleTrack = useAppStore((s) => s.toggleTrack)

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    const token = getToken()
    if (!token) return
    setLoading(true)
    try {
      const results = await searchTracks(token, `artist:${name}`, 5)
      setTracks(results)
    } catch {
      setTracks([])
    } finally {
      setLoading(false)
      setExpanded(true)
    }
  }

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{name}</h3>
          {reason && (
            <p className="mt-1 text-xs text-text-muted">{reason}</p>
          )}
          {genres && genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-rose/10 px-2 py-0.5 text-xs text-rose-light"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleExpand}
          className="flex-shrink-0 rounded-lg bg-violet/10 px-3 py-1.5 text-xs font-medium text-violet-light transition-colors hover:bg-violet/20"
        >
          {loading ? '...' : expanded ? 'Masquer' : 'Morceaux'}
        </button>
      </div>

      {expanded && tracks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              selected={selectedTracks.some((t) => t.id === track.id)}
              onToggle={() => toggleTrack(track)}
            />
          ))}
        </div>
      )}

      {expanded && tracks.length === 0 && !loading && (
        <p className="text-xs text-text-muted">Aucun morceau trouvé.</p>
      )}
    </div>
  )
}
