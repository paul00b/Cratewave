import { useState, useCallback } from 'react'
import { getDeepRecommendations } from '../services/gemini'
import type { GeminiRecommendation, Mood, SpotifyArtist } from '../types'

export function useGemini() {
  const [results, setResults] = useState<GeminiRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = useCallback(
    async (topArtists: SpotifyArtist[], mood: Mood, count?: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await getDeepRecommendations(topArtists, mood, count)
        setResults(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { results, loading, error, fetchRecommendations }
}
