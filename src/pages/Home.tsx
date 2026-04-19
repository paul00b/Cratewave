import { Link } from 'react-router-dom'

export default function Home() {
  return (
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
  )
}
