import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { SpotifyTrack } from '../types'

export interface Playlist {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  track_count?: number
}

export interface PlaylistTrack {
  id: string
  playlist_id: string
  spotify_track_id: string
  spotify_uri: string
  track_name: string
  artist_name: string
  album_image_url: string | null
  duration_ms: number | null
  position: number
  added_at: string
}

const playlistsCol = (userId: string) => collection(db, 'users', userId, 'playlists')
const playlistDoc = (userId: string, id: string) =>
  doc(db, 'users', userId, 'playlists', id)
const tracksCol = (userId: string, playlistId: string) =>
  collection(db, 'users', userId, 'playlists', playlistId, 'tracks')
const trackDoc = (userId: string, playlistId: string, trackRowId: string) =>
  doc(db, 'users', userId, 'playlists', playlistId, 'tracks', trackRowId)

const toIsoString = (v: unknown): string => {
  if (v instanceof Timestamp) return v.toDate().toISOString()
  if (typeof v === 'string') return v
  return new Date().toISOString()
}

export async function listPlaylists(userId: string): Promise<Playlist[]> {
  const snap = await getDocs(query(playlistsCol(userId), orderBy('updated_at', 'desc')))
  const playlists = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data()
      const tracksSnap = await getDocs(tracksCol(userId, d.id))
      return {
        id: d.id,
        user_id: userId,
        name: data.name,
        description: data.description ?? null,
        created_at: toIsoString(data.created_at),
        updated_at: toIsoString(data.updated_at),
        track_count: tracksSnap.size,
      } satisfies Playlist
    }),
  )
  return playlists
}

export async function getPlaylist(userId: string, id: string): Promise<Playlist | null> {
  const snap = await getDoc(playlistDoc(userId, id))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    id: snap.id,
    user_id: userId,
    name: data.name,
    description: data.description ?? null,
    created_at: toIsoString(data.created_at),
    updated_at: toIsoString(data.updated_at),
  }
}

export async function getPlaylistTracks(
  userId: string,
  playlistId: string,
): Promise<PlaylistTrack[]> {
  const snap = await getDocs(query(tracksCol(userId, playlistId), orderBy('position', 'asc')))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      playlist_id: playlistId,
      spotify_track_id: data.spotify_track_id,
      spotify_uri: data.spotify_uri,
      track_name: data.track_name,
      artist_name: data.artist_name,
      album_image_url: data.album_image_url ?? null,
      duration_ms: data.duration_ms ?? null,
      position: data.position ?? 0,
      added_at: toIsoString(data.added_at),
    }
  })
}

export async function createPlaylist(
  userId: string,
  name: string,
  description?: string,
): Promise<Playlist> {
  const now = serverTimestamp()
  const ref = await addDoc(playlistsCol(userId), {
    name,
    description: description ?? null,
    created_at: now,
    updated_at: now,
  })
  return {
    id: ref.id,
    user_id: userId,
    name,
    description: description ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function updatePlaylist(
  userId: string,
  id: string,
  patch: { name?: string; description?: string | null },
): Promise<void> {
  await updateDoc(playlistDoc(userId, id), {
    ...patch,
    updated_at: serverTimestamp(),
  })
}

export async function deletePlaylist(userId: string, id: string): Promise<void> {
  const tracksSnap = await getDocs(tracksCol(userId, id))
  await Promise.all(tracksSnap.docs.map((t) => deleteDoc(t.ref)))
  await deleteDoc(playlistDoc(userId, id))
}

export async function addTrackToPlaylist(
  userId: string,
  playlistId: string,
  track: SpotifyTrack,
): Promise<void> {
  const existing = await getDocs(tracksCol(userId, playlistId))
  if (existing.docs.some((d) => d.data().spotify_track_id === track.id)) return
  const nextPosition = existing.size

  await addDoc(tracksCol(userId, playlistId), {
    spotify_track_id: track.id,
    spotify_uri: `spotify:track:${track.id}`,
    track_name: track.name,
    artist_name: track.artists.map((a) => a.name).join(', '),
    album_image_url: track.album?.images?.[0]?.url ?? null,
    duration_ms: track.duration_ms ?? null,
    position: nextPosition,
    added_at: serverTimestamp(),
  })
  await updateDoc(playlistDoc(userId, playlistId), { updated_at: serverTimestamp() })
}

export async function removeTrackFromPlaylist(
  userId: string,
  playlistId: string,
  trackRowId: string,
): Promise<void> {
  await deleteDoc(trackDoc(userId, playlistId, trackRowId))
  await updateDoc(playlistDoc(userId, playlistId), { updated_at: serverTimestamp() })
}
