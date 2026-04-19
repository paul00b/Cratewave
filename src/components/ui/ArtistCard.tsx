import type { SpotifyArtist } from '../../types'

interface Props {
  artist: SpotifyArtist
}

export default function ArtistCard({ artist }: Props) {
  const image = artist.images[0]?.url

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
        {artist.genres.slice(0, 3).map((genre) => (
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
