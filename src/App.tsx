import { Routes, Route, Navigate } from 'react-router-dom'
import { useSpotifyAuth } from './hooks/useSpotify'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Home from './pages/Home'
import Stats from './pages/Stats'
import Discover from './pages/Discover'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Playlists from './pages/Playlists'
import PlaylistDetail from './pages/PlaylistDetail'

export default function App() {
  const { user, loading } = useAuth()
  // Activate Spotify OAuth callback handler + token refresh lifecycle
  useSpotifyAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-text-muted">
        Chargement…
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/playlists/:id" element={<PlaylistDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
