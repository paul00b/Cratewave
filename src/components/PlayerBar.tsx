import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlayerBar() {
  const { state, error, togglePlay, next, previous, seek } = useSpotifyPlayer()

  if (error) {
    return (
      <div className="glass fixed bottom-20 left-1/2 z-40 -translate-x-1/2 px-4 py-2 text-xs text-rose-light">
        {error}
      </div>
    )
  }

  if (!state?.track_window?.current_track) return null

  const track = state.track_window.current_track
  const cover = track.album.images[0]?.url
  const progress = state.duration > 0 ? (state.position / state.duration) * 100 : 0

  return (
    <div className="glass fixed bottom-20 left-1/2 z-40 flex w-[min(540px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        {cover && (
          <img src={cover} alt={track.name} className="h-10 w-10 rounded-md object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{track.name}</p>
          <p className="truncate text-xs text-text-muted">
            {track.artists.map((a) => a.name).join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={previous}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text"
            aria-label="Précédent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="rounded-full bg-violet p-2.5 text-white transition-colors hover:bg-violet-light"
            aria-label={state.paused ? 'Lire' : 'Pause'}
          >
            {state.paused ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            )}
          </button>
          <button
            onClick={next}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text"
            aria-label="Suivant"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6l8.5 6L6 18zM16 6h2v12h-2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span>{formatTime(state.position)}</span>
        <div
          className="relative h-1 flex-1 cursor-pointer rounded-full bg-surface"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            seek(Math.max(0, Math.min(1, ratio)) * state.duration)
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-violet"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{formatTime(state.duration)}</span>
      </div>
    </div>
  )
}
