import { Routes, Route, Navigate } from 'react-router-dom'
import { useSpotifyAuth } from './hooks/useSpotify'
import Layout from './components/Layout'
import Home from './pages/Home'
import Stats from './pages/Stats'
import Discover from './pages/Discover'
import Settings from './pages/Settings'

export default function App() {
  // Activate OAuth callback handler + token refresh lifecycle
  useSpotifyAuth()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
