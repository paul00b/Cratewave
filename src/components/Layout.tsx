import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import PlayerBar from './PlayerBar'
import { SpotifyPlayerProvider } from '../hooks/useSpotifyPlayer'

export default function Layout() {
  return (
    <SpotifyPlayerProvider>
      <div className="relative min-h-dvh">
        {/* Background glows */}
        <div className="glow-violet pointer-events-none fixed inset-0" />
        <div className="glow-rose pointer-events-none fixed inset-0" />

        <Nav />
        <PlayerBar />
        <main className="relative z-10 mx-auto max-w-5xl px-4 pb-40 pt-8">
          <Outlet />
        </main>
      </div>
    </SpotifyPlayerProvider>
  )
}
