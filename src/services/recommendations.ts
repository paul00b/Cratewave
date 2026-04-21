import type {
  Mood,
  Recommendation,
  SpotifyArtist,
  SpotifyTrack,
} from '../types'
import {
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed,
  searchArtist,
  searchTracks,
} from './spotify'
import { getSimilarArtists, getArtistTopTags } from './lastfm'
import { getDeepRecommendations } from './gemini'
import { moodTagScore, MOOD_PROFILES } from '../utils/mood'

// ---------- Listening profile ----------

export interface ListeningProfile {
  topArtists: SpotifyArtist[]        // weighted merge, short-term first
  topTracks: SpotifyTrack[]
  recentArtistNames: Set<string>     // lowercase
  knownArtistNames: Set<string>      // lowercase, top + recent
  dominantTags: string[]              // from Last.fm tags across top artists
}

let profileCache: { value: ListeningProfile; expires: number } | null = null
const PROFILE_TTL_MS = 10 * 60 * 1000

export function invalidateListeningProfile() {
  profileCache = null
}

export async function buildListeningProfile(token: string): Promise<ListeningProfile> {
  if (profileCache && Date.now() < profileCache.expires) return profileCache.value

  const [shortArtists, mediumArtists, shortTracks, mediumTracks, recent] =
    await Promise.all([
      getTopArtists(token, 'short_term', 20).catch(() => [] as SpotifyArtist[]),
      getTopArtists(token, 'medium_term', 20).catch(() => [] as SpotifyArtist[]),
      getTopTracks(token, 'short_term', 20).catch(() => [] as SpotifyTrack[]),
      getTopTracks(token, 'medium_term', 20).catch(() => [] as SpotifyTrack[]),
      getRecentlyPlayed(token, 50).catch(() => []),
    ])

  // Weighted merge of top artists — short heavier than medium
  const artistScore = new Map<string, { artist: SpotifyArtist; score: number }>()
  shortArtists.forEach((a, i) => {
    artistScore.set(a.id, { artist: a, score: (20 - i) * 2 })
  })
  mediumArtists.forEach((a, i) => {
    const prev = artistScore.get(a.id)
    const weight = 20 - i
    if (prev) prev.score += weight
    else artistScore.set(a.id, { artist: a, score: weight })
  })

  const topArtists = Array.from(artistScore.values())
    .sort((a, b) => b.score - a.score)
    .map((x) => x.artist)

  // Merge top tracks (dedupe, short first)
  const trackById = new Map<string, SpotifyTrack>()
  ;[...shortTracks, ...mediumTracks].forEach((t) => {
    if (!trackById.has(t.id)) trackById.set(t.id, t)
  })
  const topTracks = Array.from(trackById.values())

  const recentArtistNames = new Set<string>(
    recent.map((r) => r.track.artists[0]?.name.toLowerCase() ?? '').filter(Boolean),
  )
  const knownArtistNames = new Set<string>([
    ...topArtists.map((a) => a.name.toLowerCase()),
    ...topTracks.flatMap((t) => t.artists.map((a) => a.name.toLowerCase())),
    ...recentArtistNames,
  ])

  // Aggregate Last.fm tags for top 8 artists (cached in lastfm service)
  const tagWeight = new Map<string, number>()
  const seedsForTags = topArtists.slice(0, 8)
  const tagsPerArtist = await Promise.all(
    seedsForTags.map((a) => getArtistTopTags(a.name).catch(() => [])),
  )
  tagsPerArtist.forEach((tags, idx) => {
    const seedWeight = 1 + (8 - idx) / 8 // 2 → 1.125
    tags.slice(0, 5).forEach((t) => {
      const key = t.name.toLowerCase()
      tagWeight.set(key, (tagWeight.get(key) ?? 0) + t.count * seedWeight / 100)
    })
  })
  const dominantTags = Array.from(tagWeight.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  const profile = { topArtists, topTracks, recentArtistNames, knownArtistNames, dominantTags }
  profileCache = { value: profile, expires: Date.now() + PROFILE_TTL_MS }
  return profile
}

// ---------- Close strategy (Last.fm + scoring) ----------

interface CloseCandidate {
  name: string
  score: number
  matchSum: number
  tagsFromSources: string[]
}

async function scoreCloseCandidates(
  profile: ListeningProfile,
  mood: Mood,
  seen: Set<string>,
): Promise<CloseCandidate[]> {
  const seeds = profile.topArtists.slice(0, 10)
  const similarLists = await Promise.all(
    seeds.map((seed, idx) =>
      getSimilarArtists(seed.name, 10)
        .then((arr) => ({ seedIdx: idx, arr }))
        .catch(() => ({ seedIdx: idx, arr: [] })),
    ),
  )

  const candidates = new Map<string, CloseCandidate>()
  for (const { seedIdx, arr } of similarLists) {
    const seedWeight = 1 + (10 - seedIdx) / 10
    for (const s of arr) {
      const key = s.name.toLowerCase()
      if (profile.knownArtistNames.has(key)) continue
      if (seen.has(key)) continue
      const match = Number(s.match ?? 0)
      const prev = candidates.get(key)
      if (prev) {
        prev.matchSum += match * seedWeight
        prev.score += match * seedWeight
      } else {
        candidates.set(key, {
          name: s.name,
          score: match * seedWeight,
          matchSum: match * seedWeight,
          tagsFromSources: [],
        })
      }
    }
  }

  // Fetch tags for the top ~20 candidates; heavy call, keep bounded.
  const top = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  const tagsPer = await Promise.all(
    top.map((c) => getArtistTopTags(c.name).catch(() => [])),
  )

  tagsPer.forEach((tags, i) => {
    const tagNames = tags.slice(0, 8).map((t) => t.name)
    top[i].tagsFromSources = tagNames
    const moodScore = moodTagScore(tagNames, mood)
    const userOverlap = tagNames.filter((t) =>
      profile.dominantTags.slice(0, 20).includes(t.toLowerCase()),
    ).length * 0.4
    top[i].score = top[i].matchSum + moodScore + userOverlap
  })

  return top.sort((a, b) => b.score - a.score)
}

async function resolveArtistOnSpotify(
  token: string,
  name: string,
): Promise<{ artist: SpotifyArtist; tracks: SpotifyTrack[] } | null> {
  const artist = await searchArtist(token, name).catch(() => null)
  if (!artist) return null
  const results = await searchTracks(token, `artist:"${artist.name}"`, 8).catch(() => [])
  const tracks = results
    .filter((t) => t.artists.some((a) => a.id === artist.id))
    .slice(0, 3)
  return { artist, tracks }
}

export async function getCloseRecommendations(
  token: string,
  profile: ListeningProfile,
  mood: Mood,
  seen: Set<string>,
  count = 10,
): Promise<Recommendation[]> {
  const scored = await scoreCloseCandidates(profile, mood, seen)
  // Over-fetch so we still land at `count` after drops/dedupe
  const top = scored.slice(0, count + 4)

  const resolved = await Promise.all(
    top.map(async (c) => {
      const r = await resolveArtistOnSpotify(token, c.name)
      if (!r || r.tracks.length === 0) return null
      // Skip if the resolved Spotify artist is already in user's known set
      if (profile.knownArtistNames.has(r.artist.name.toLowerCase())) return null
      const rec: Recommendation = {
        artist: {
          id: r.artist.id,
          name: r.artist.name,
          image: r.artist.images?.[0]?.url,
          spotifyUrl: r.artist.external_urls?.spotify,
        },
        tracks: r.tracks,
        reason: buildCloseReason(c, profile, mood),
        tags: c.tagsFromSources.slice(0, 3),
        score: c.score,
        source: 'close',
      }
      return rec
    }),
  )

  // Dedupe by resolved Spotify artist id
  const seenIds = new Set<string>()
  const unique: Recommendation[] = []
  for (const r of resolved) {
    if (!r) continue
    const key = r.artist.id ?? r.artist.name.toLowerCase()
    if (seenIds.has(key)) continue
    seenIds.add(key)
    unique.push(r)
    if (unique.length >= count) break
  }
  return unique
}

function buildCloseReason(
  c: CloseCandidate,
  profile: ListeningProfile,
  mood: Mood,
): string {
  const moodLabel = MOOD_PROFILES[mood].label
  const overlap = c.tagsFromSources.filter((t) =>
    profile.dominantTags.slice(0, 20).includes(t.toLowerCase()),
  )
  if (overlap.length > 0) {
    return `Partage ${overlap.slice(0, 2).join(' / ')} avec ton écoute — cohérent pour un mood ${moodLabel.toLowerCase()}.`
  }
  if (c.tagsFromSources.length > 0) {
    return `Univers ${c.tagsFromSources.slice(0, 2).join(' / ')} — proche de tes artistes récents.`
  }
  return `Recommandé par affinité avec tes artistes les plus écoutés.`
}

// ---------- Far strategy (Gemini) ----------

export async function getFarRecommendations(
  token: string,
  profile: ListeningProfile,
  mood: Mood,
  seen: Set<string>,
  count = 12,
  randomSeed?: number,
): Promise<Recommendation[]> {
  const avoidArtists = Array.from(profile.knownArtistNames).slice(0, 40)

  const recs = await getDeepRecommendations({
    topArtists: profile.topArtists,
    topTracks: profile.topTracks,
    dominantTags: profile.dominantTags,
    mood,
    count,
    avoidArtists,
    randomSeed,
  })

  const filtered = recs.filter(
    (r) =>
      !profile.knownArtistNames.has(r.artist.toLowerCase()) &&
      !seen.has(r.artist.toLowerCase()),
  )

  const resolved = await Promise.all(
    filtered.map(async (r) => {
      const artist = await searchArtist(token, r.artist).catch(() => null)
      if (!artist) return null

      // Try to find the specific track recommended, then fall back to popular tracks by the artist
      const specific = await searchTracks(
        token,
        `artist:"${r.artist}" track:"${r.track}"`,
        3,
      ).catch(() => [] as SpotifyTrack[])
      let tracks = specific.filter((t) => t.artists.some((a) => a.id === artist.id))
      if (tracks.length === 0) {
        const pop = await searchTracks(token, `artist:"${artist.name}"`, 6).catch(
          () => [] as SpotifyTrack[],
        )
        tracks = pop.filter((t) => t.artists.some((a) => a.id === artist.id)).slice(0, 2)
      }
      if (tracks.length === 0) return null

      const rec: Recommendation = {
        artist: {
          id: artist.id,
          name: artist.name,
          image: artist.images?.[0]?.url,
          spotifyUrl: artist.external_urls?.spotify,
        },
        tracks: tracks.slice(0, 2),
        reason: r.reason,
        tags: r.genres?.slice(0, 3) ?? [],
        source: 'far',
      }
      return rec
    }),
  )

  // Dedupe by artist id
  const seenIds = new Set<string>()
  const unique: Recommendation[] = []
  for (const r of resolved) {
    if (!r) continue
    const key = r.artist.id ?? r.artist.name.toLowerCase()
    if (seenIds.has(key)) continue
    seenIds.add(key)
    unique.push(r)
  }
  return unique
}
