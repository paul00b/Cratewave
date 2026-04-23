import { useState } from 'react'
import type { Recommendation } from '../../types'
import { useAppStore } from '../../store'
import TrackCard from './TrackCard'

interface Props {
  rec: Recommendation
}

export default function DiscoveryCard({ rec }: Props) {
  const [expanded, setExpanded] = useState(false)
  const selectedTracks = useAppStore((s) => s.selectedTracks)
  const toggleTrack = useAppStore((s) => s.toggleTrack)

  const { artist, reason, tags, tracks } = rec
  const initial = artist.name[0]?.toUpperCase() ?? '?'

  return (
    <div className="glass flex min-w-0 flex-col gap-3 overflow-hidden p-4 transition-colors">
      <div className="flex items-start gap-3">
        {artist.image ? (
          <img
            src={artist.image}
            alt={artist.name}
            className="h-16 w-16 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet/30 to-rose/20 text-lg font-semibold text-white/80 ring-1 ring-white/10">
            {initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">
              {artist.spotifyUrl ? (
                <a
                  href={artist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-violet-light"
                >
                  {artist.name}
                </a>
              ) : (
                artist.name
              )}
            </h3>
            <span className="flex-shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              {rec.source === 'close' ? 'Proche' : 'Lointain'}
            </span>
          </div>
          {reason && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-muted">
              {reason}
            </p>
          )}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    rec.source === 'close'
                      ? 'bg-violet/10 text-violet-light'
                      : 'bg-rose/10 text-rose-light'
                  }`}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1.5">
          {(expanded ? tracks : tracks.slice(0, 1)).map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              selected={selectedTracks.some((t) => t.id === track.id)}
              onToggle={() => toggleTrack(track)}
            />
          ))}
          {tracks.length > 1 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="self-start text-[11px] text-text-muted transition-colors hover:text-text"
            >
              {expanded ? 'Réduire' : `+ ${tracks.length - 1} autre${tracks.length - 1 > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
