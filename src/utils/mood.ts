import type { Mood } from '../types'

interface MoodProfile {
  label: string
  boost: string[]
  avoid: string[]
  geminiHint: string
}

export const MOOD_PROFILES: Record<Mood, MoodProfile> = {
  focus: {
    label: 'Focus',
    boost: [
      'ambient', 'minimal', 'instrumental', 'post-rock', 'downtempo',
      'idm', 'shoegaze', 'drone', 'modern classical', 'electronic',
    ],
    avoid: ['party', 'club', 'dance-pop', 'eurodance', 'trap'],
    geminiHint: 'music that sustains deep concentration — restrained, textural, low vocal presence',
  },
  energy: {
    label: 'Énergie',
    boost: [
      'punk', 'post-punk', 'garage rock', 'indie rock', 'dance-punk',
      'breakbeat', 'big beat', 'electro', 'hardcore', 'techno',
    ],
    avoid: ['ambient', 'sleep', 'lullaby', 'new-age'],
    geminiHint: 'music with driving forward momentum — high kinetic energy, propulsive rhythm',
  },
  melancholy: {
    label: 'Mélancolie',
    boost: [
      'sadcore', 'slowcore', 'melancholic', 'melancholy', 'moody',
      'dream pop', 'shoegaze', 'lo-fi', 'folk', 'indie folk', 'wistful',
    ],
    avoid: ['party', 'happy', 'upbeat', 'eurodance'],
    geminiHint: 'introspective music with emotional weight — melancholic, bittersweet, contemplative',
  },
  party: {
    label: 'Fête',
    boost: [
      'disco', 'funk', 'house', 'nu-disco', 'dance', 'afrobeats',
      'baile funk', 'garage', 'uk garage', 'hip hop', 'pop',
    ],
    avoid: ['ambient', 'drone', 'sadcore', 'slowcore', 'funeral'],
    geminiHint: 'music built for collective celebration — danceable, warm, euphoric',
  },
  chill: {
    label: 'Chill',
    boost: [
      'lo-fi', 'chillout', 'downtempo', 'trip-hop', 'neo-soul',
      'bossa nova', 'jazz', 'soft rock', 'ambient pop',
    ],
    avoid: ['hardcore', 'metal', 'punk', 'noise'],
    geminiHint: 'relaxed, warm, unhurried music — low-tempo, comforting textures',
  },
  introspection: {
    label: 'Introspection',
    boost: [
      'singer-songwriter', 'folk', 'indie folk', 'chamber pop',
      'art rock', 'post-rock', 'ambient', 'modern classical',
      'spoken word', 'slowcore',
    ],
    avoid: ['club', 'eurodance', 'party'],
    geminiHint: 'music that invites deep listening — lyrical, patient, emotionally nuanced',
  },
}

/**
 * Score how well a bag of tags matches a mood profile.
 * Positive for boost tags, negative for avoid tags.
 */
export function moodTagScore(tags: string[], mood: Mood): number {
  const profile = MOOD_PROFILES[mood]
  const lower = tags.map((t) => t.toLowerCase())
  let score = 0
  for (const tag of lower) {
    if (profile.boost.some((b) => tag.includes(b))) score += 1
    if (profile.avoid.some((a) => tag.includes(a))) score -= 1.5
  }
  return score
}
