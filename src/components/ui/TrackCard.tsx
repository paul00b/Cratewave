import type { SpotifyTrack } from '../../types'
import { formatDuration } from '../../utils/format'

interface Props {
  track: SpotifyTrack
  selected?: boolean
  onToggle?: () => void
}

export default function TrackCard({ track, selected = false, onToggle }: Props) {
  const image = track.album.images[0]?.url
  const artists = track.artists.map((a) => a.name).join(', ')

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`glass flex w-full items-center gap-3 p-3 text-left transition-colors ${
        selected ? 'border-violet/40 bg-violet/10' : 'hover:bg-surface'
      } ${onToggle ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {image ? (
        <img
          src={image}
          alt={track.album.name}
          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-surface text-text-muted">
          ♪
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.name}</p>
        <p className="truncate text-xs text-text-muted">{artists}</p>
      </div>
      <span className="flex-shrink-0 text-xs text-text-muted">
        {formatDuration(track.duration_ms)}
      </span>
      {onToggle && (
        <div
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected
              ? 'border-violet bg-violet text-white'
              : 'border-border'
          }`}
        >
          {selected && (
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </div>
      )}
    </button>
  )
}
