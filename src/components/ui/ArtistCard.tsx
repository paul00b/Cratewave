import type { SpotifyArtist } from '../../types'

interface Props {
  artist: SpotifyArtist
  compact?: boolean
}

export default function ArtistCard({ artist, compact = false }: Props) {
  const image = artist.images[0]?.url

  if (compact) {
    return (
      <a
        href={artist.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="glass flex w-36 shrink-0 snap-start flex-col items-center gap-2 p-3 transition-colors hover:bg-surface"
      >
        {image ? (
          <img
            src={image}
            alt={artist.name}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface text-xl text-text-muted">
            {artist.name[0]}
          </div>
        )}
        <span className="line-clamp-1 text-center text-xs font-semibold">
          {artist.name}
        </span>
        {artist.genres?.[0] && (
          <span className="line-clamp-1 rounded-full bg-violet/10 px-2 py-0.5 text-[10px] text-violet-light">
            {artist.genres[0]}
          </span>
        )}
      </a>
    )
  }

  return (
    <a
      href={artist.external_urls.spotify}
      target="_blank"
      rel="noopener noreferrer"
      className="glass flex flex-col items-center gap-3 p-4 transition-colors hover:bg-surface"
    >
      {image ? (
        <img
          src={image}
          alt={artist.name}
          className="h-28 w-28 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface text-2xl text-text-muted">
          {artist.name[0]}
        </div>
      )}
      <span className="text-center text-sm font-semibold">{artist.name}</span>
      <div className="flex flex-wrap justify-center gap-1">
        {(artist.genres ?? []).slice(0, 3).map((genre) => (
          <span
            key={genre}
            className="rounded-full bg-violet/10 px-2 py-0.5 text-xs text-violet-light"
          >
            {genre}
          </span>
        ))}
      </div>
      <div className="h-1 w-full rounded-full bg-surface">
        <div
          className="h-1 rounded-full bg-violet"
          style={{ width: `${artist.popularity}%` }}
        />
      </div>
    </a>
  )
}
