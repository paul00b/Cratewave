import type { GeminiRecommendation, Mood, SpotifyArtist, SpotifyTrack } from '../types'
import { MOOD_PROFILES } from '../utils/mood'

const GEMINI_PROXY = '/api/gemini'

interface DeepRecInput {
  topArtists: SpotifyArtist[]
  topTracks: SpotifyTrack[]
  dominantTags: string[]
  mood: Mood
  count?: number
  avoidArtists?: string[]
  randomSeed?: number
}

export async function getDeepRecommendations(
  input: DeepRecInput,
): Promise<GeminiRecommendation[]> {
  const { topArtists, topTracks, dominantTags, mood, count = 12, avoidArtists = [], randomSeed } = input
  const profile = MOOD_PROFILES[mood]

  const artistsLine = topArtists
    .slice(0, 12)
    .map((a) => `${a.name}${a.genres?.length ? ` (${a.genres.slice(0, 3).join(', ')})` : ''}`)
    .join(', ')

  const tracksLine = topTracks
    .slice(0, 10)
    .map((t) => `"${t.name}" — ${t.artists.map((a) => a.name).join(', ')}`)
    .join('; ')

  const avoidLine = avoidArtists.length
    ? `Do NOT recommend any of these artists (the user already knows them): ${avoidArtists.slice(0, 40).join(', ')}.`
    : ''

  const seedNote = randomSeed !== undefined
    ? `Variation seed: ${randomSeed} — use this to vary your picks from previous attempts.`
    : ''

  const prompt = `You are a discerning music discovery expert. Recommend ${count} SPECIFIC TRACKS that will stretch this listener's taste while still resonating emotionally.

Listener's top artists: ${artistsLine}
Recent listening includes: ${tracksLine}
Dominant tags in their library: ${dominantTags.slice(0, 15).join(', ')}

Current mood: ${profile.label} — ${profile.geminiHint}.
Mood tags to LEAN INTO: ${profile.boost.slice(0, 8).join(', ')}.
Mood tags to AVOID: ${profile.avoid.join(', ')}.

Rules:
- Recommend REAL tracks that exist on Spotify — artist name + exact track title.
- Do NOT recommend artists already in the listener's top artists list or in the avoid list.
- PREFER artists that sit in adjacent or different primary genres from the listener's top — bridge, don't mirror.
- Every pick must feel emotionally consistent with the "${profile.label}" mood.
- Vary the recommendations across different sub-scenes; avoid clustering in one micro-genre.
- The "reason" must name ONE specific cross-reference to the user's taste or tags, and ONE mood justification, in a single concise sentence (max 22 words, French).

${avoidLine}
${seedNote}

Reply with ONLY a JSON array, no markdown fences, no prose. Each element:
{"artist": "Artist Name", "track": "Track Title", "reason": "…", "genres": ["genre1", "genre2"]}`

  const res = await fetch(GEMINI_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, responseMimeType: 'application/json' },
    }),
  })

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()

  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    return JSON.parse(jsonMatch[0]) as GeminiRecommendation[]
  } catch {
    return []
  }
}
