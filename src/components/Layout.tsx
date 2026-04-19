import { Outlet } from 'react-router-dom'
import Nav from './Nav'

export default function Layout() {
  return (
    <div className="relative min-h-dvh">
      {/* Background glows */}
      <div className="glow-violet pointer-events-none fixed inset-0" />
      <div className="glow-rose pointer-events-none fixed inset-0" />

      <Nav />
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-8">
        <Outlet />
      </main>
    </div>
  )
}
