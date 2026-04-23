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
        <main
          className="relative z-10 mx-auto min-w-0 max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8"
          style={{ paddingBottom: 'calc(var(--nav-height) + 7rem)' }}
        >
          <Outlet />
        </main>
      </div>
    </SpotifyPlayerProvider>
  )
}
