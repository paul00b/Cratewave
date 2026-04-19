import type { GeminiRecommendation, Mood, SpotifyArtist } from '../types'

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

function getApiKey(): string {
  const settings = localStorage.getItem('cratewave_settings')
  if (!settings) return ''
  return (JSON.parse(settings) as { geminiApiKey?: string }).geminiApiKey ?? ''
}

export async function getDeepRecommendations(
  topArtists: SpotifyArtist[],
  mood: Mood,
  count = 10,
): Promise<GeminiRecommendation[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Gemini API key not configured')

  const artistSummary = topArtists
    .slice(0, 15)
    .map((a) => `${a.name} (${a.genres.slice(0, 3).join(', ')})`)
    .join('\n')

  const prompt = `You are a music discovery expert. Based on this user's top Spotify artists:

${artistSummary}

The user's current mood is: ${mood}

Recommend ${count} artists that:
- Do NOT belong to the same primary genres as the listed artists
- Share transversal characteristics (energy, production style, emotional intent) with the user's taste
- Match the "${mood}" mood
- Are real, discoverable artists on Spotify

Reply ONLY with a JSON array. Each element: {"artist": "Name", "reason": "one sentence why", "genres": ["genre1", "genre2"]}
No markdown, no explanation, just the JSON array.`

  const res = await fetch(`${GEMINI_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()

  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  // Extract JSON from potential markdown code fences
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  return JSON.parse(jsonMatch[0]) as GeminiRecommendation[]
}
