import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { SpotifyTokens } from '../types'

export interface SpotifyConnection extends SpotifyTokens {
  spotify_user_id?: string | null
  display_name?: string | null
  avatar_url?: string | null
  is_premium?: boolean
}

const connRef = (userId: string) => doc(db, 'users', userId, 'spotifyConnection', 'main')

export async function loadSpotifyConnection(userId: string): Promise<SpotifyConnection | null> {
  const snap = await getDoc(connRef(userId))
  if (!snap.exists()) return null
  const data = snap.data() as {
    access_token: string
    refresh_token: string
    expires_at: number
    spotify_user_id?: string
    display_name?: string
    avatar_url?: string | null
    is_premium?: boolean
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    spotify_user_id: data.spotify_user_id,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    is_premium: data.is_premium ?? false,
  }
}

export async function saveSpotifyConnection(
  userId: string,
  tokens: SpotifyTokens,
  profile?: {
    spotify_user_id?: string
    display_name?: string
    avatar_url?: string | null
    is_premium?: boolean
  },
): Promise<void> {
  await setDoc(
    connRef(userId),
    {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      updated_at: serverTimestamp(),
      ...(profile ?? {}),
    },
    { merge: true },
  )
}

export async function deleteSpotifyConnection(userId: string): Promise<void> {
  await deleteDoc(connRef(userId))
}
