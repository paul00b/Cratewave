import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpotifyAuth } from '../hooks/useSpotify'
import { useAppStore } from '../store'
import { getTopArtists } from '../services/spotify'
import type { SpotifyArtist } from '../types'
import ArtistCard from '../components/ui/ArtistCard'
import { SkeletonList } from '../components/ui/Skeleton'

export default function Home() {
  const { isAuthenticated, getToken } = useSpotifyAuth()
  const storedTopArtists = useAppStore((s) => s.topArtists)
  const setTopArtists = useAppStore((s) => s.setTopArtists)

  const [artists, setArtists] = useState<SpotifyArtist[]>(storedTopArtists)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    if (artists.length > 0) return
    const token = getToken()
    if (!token) return
    let cancelled = false
    setLoading(true)
    getTopArtists(token, 'medium_term', 20)
      .then((data) => {
        if (cancelled) return
        setArtists(data)
        setTopArtists(data)
      })
      .catch(() => !cancelled && setArtists([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [isAuthenticated, getToken, artists.length, setTopArtists])

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col items-center gap-8 pt-16 text-center">
        <h1 className="bg-gradient-to-r from-violet-light to-rose-light bg-clip-text text-5xl font-bold tracking-tight text-transparent">
          Cratewave
        </h1>
        <p className="max-w-md text-lg text-text-muted">
          Découverte musicale personnelle. Spotify te connaît bien — Cratewave
          t'emmène plus loin.
        </p>

        <div className="mt-4 flex gap-4">
          <Link
            to="/stats"
            className="glass rounded-xl px-6 py-3 text-sm font-medium text-violet-light transition-colors hover:bg-violet/10"
          >
            Mes stats
          </Link>
          <Link
            to="/discover"
            className="rounded-xl bg-violet px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-light"
          >
            Découvrir
          </Link>
        </div>
      </div>

      {isAuthenticated && (loading || artists.length > 0) && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Tes artistes du moment</h2>
          {loading ? (
            <SkeletonList count={6} className="h-40 w-36" />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <div className="flex snap-x snap-mandatory gap-3">
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} compact />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
