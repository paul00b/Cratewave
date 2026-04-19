import { useState, useCallback } from 'react'
import { getSimilarArtists } from '../services/lastfm'
import type { LastFmArtist } from '../types'

export function useLastFm() {
  const [results, setResults] = useState<LastFmArtist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSimilar = useCallback(async (artist: string, limit?: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSimilarArtists(artist, limit)
      setResults(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, fetchSimilar }
}
